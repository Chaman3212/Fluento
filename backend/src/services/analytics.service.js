import mongoose from 'mongoose';
import { PracticeSession } from '../models/PracticeSession.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const CATS = ['fluencyScore', 'grammarScore', 'vocabularyScore', 'clarityScore'];

export async function overview(userId) {
  const uid = oid(userId);
  const [totals] = await PracticeSession.aggregate([
    { $match: { userId: uid } },
    { $group: {
      _id: null, sessions: { $sum: 1 },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
      totalSeconds: { $sum: '$duration' },
    } },
  ]);
  const [avg] = await PracticeSession.aggregate([
    { $match: { userId: uid, status: 'COMPLETED' } },
    { $group: { _id: null, overall: { $avg: '$evaluation.overallScore' },
      fluency: { $avg: '$evaluation.fluencyScore' }, grammar: { $avg: '$evaluation.grammarScore' },
      vocabulary: { $avg: '$evaluation.vocabularyScore' }, clarity: { $avg: '$evaluation.clarityScore' } } },
  ]);
  const since = new Date(Date.now() - 6 * 864e5); since.setHours(0, 0, 0, 0);
  const weekly = await PracticeSession.aggregate([
    { $match: { userId: uid, status: 'COMPLETED', createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      score: { $avg: '$evaluation.overallScore' }, sessions: { $sum: 1 }, seconds: { $sum: '$duration' } } },
  ]);
  const map = Object.fromEntries(weekly.map((w) => [w._id, w]));
  const weeklyChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since.getTime() + i * 864e5);
    const key = d.toISOString().slice(0, 10);
    const w = map[key];
    return { date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), score: w ? Math.round(w.score) : null, sessions: w?.sessions || 0 };
  });
  const recent = await PracticeSession.find({ userId: uid }).sort({ createdAt: -1 }).limit(5)
    .select('practiceType topic duration status createdAt evaluation.overallScore').lean();
  const latest = await PracticeSession.findOne({ userId: uid, status: 'COMPLETED' }).sort({ createdAt: -1 })
    .select('evaluation.overallScore evaluation.nextPracticeTopics evaluation.recommendations createdAt').lean();
  const r = (n) => (n == null ? null : Math.round(n));
  return {
    totalSessions: totals?.sessions || 0,
    completedSessions: totals?.completed || 0,
    totalSpeakingSeconds: Math.round(totals?.totalSeconds || 0),
    averages: { overall: r(avg?.overall), fluency: r(avg?.fluency), grammar: r(avg?.grammar), vocabulary: r(avg?.vocabulary), clarity: r(avg?.clarity), pronunciation: null },
    latestScore: latest?.evaluation?.overallScore ?? null,
    weeklyChart,
    recentSessions: recent,
    recommendedNext: latest?.evaluation?.nextPracticeTopics || [],
    recommendations: latest?.evaluation?.recommendations || [],
    streakDays: await streak(uid),
  };
}

async function streak(uid) {
  const days = await PracticeSession.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
    { $sort: { _id: -1 } }, { $limit: 120 },
  ]);
  const set = new Set(days.map((d) => d._id));
  let count = 0; const d = new Date();
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

export async function analytics(userId, days = 30) {
  const uid = oid(userId);
  const since = new Date(Date.now() - days * 864e5);
  const sessions = await PracticeSession.find({ userId: uid, status: 'COMPLETED', createdAt: { $gte: since } })
    .sort({ createdAt: 1 }).select('createdAt duration practiceType evaluation').lean();
  const series = sessions.map((s) => ({
    id: s._id, date: s.createdAt, overall: s.evaluation.overallScore, fluency: s.evaluation.fluencyScore,
    grammar: s.evaluation.grammarScore, vocabulary: s.evaluation.vocabularyScore, clarity: s.evaluation.clarityScore,
  }));
  const weekMap = {};
  for (const s of sessions) {
    const d = new Date(s.createdAt); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0);
    const k = d.toISOString().slice(0, 10);
    (weekMap[k] ||= { week: k, sessions: 0, seconds: 0 });
    weekMap[k].sessions++; weekMap[k].seconds += s.duration || 0;
  }
  const catAvg = {};
  for (const c of CATS) catAvg[c.replace('Score', '')] = series.length ? Math.round(series.reduce((a, s) => a + s[c.replace('Score', '')], 0) / series.length) : null;
  const entries = Object.entries(catAvg).filter(([, v]) => v != null);
  const weakest = entries.length ? entries.reduce((a, b) => (b[1] < a[1] ? b : a))[0] : null;
  const strongest = entries.length ? entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : null;
  const best = series.length ? series.reduce((a, b) => (b.overall > a.overall ? b : a)) : null;
  const delta = (key) => {
    if (series.length < 2) return null;
    const half = Math.ceil(series.length / 2);
    const avg = (arr) => arr.reduce((a, s) => a + s[key], 0) / arr.length;
    return Math.round(avg(series.slice(-half)) - avg(series.slice(0, half)));
  };
  const activeDays = new Set(sessions.map((s) => new Date(s.createdAt).toISOString().slice(0, 10))).size;
  return {
    rangeDays: days, series, weekly: Object.values(weekMap),
    categoryAverages: catAvg, weakestCategory: weakest, strongestCategory: strongest,
    bestSession: best && { id: best.id, score: best.overall, date: best.date },
    improvement: { overall: delta('overall'), fluency: delta('fluency'), grammar: delta('grammar'), vocabulary: delta('vocabulary') },
    totalSpeakingSeconds: Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0)),
    consistency: { activeDays, rangeDays: days, percent: Math.round((activeDays / days) * 100) },
    sessionsPerWeek: Math.round((sessions.length / days) * 7 * 10) / 10,
  };
}
