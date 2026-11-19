import { ImprovementPlan } from '../models/ImprovementPlan.js';
import { PracticeSession } from '../models/PracticeSession.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { generatePlan } from '../services/improvement.service.js';

const tally = (plan) => ({ completed: plan.tasks.filter((t) => t.completed).length, total: plan.tasks.length });

export const getPlan = asyncHandler(async (req, res) => {
  const plan = await ImprovementPlan.findOne({ userId: req.user._id, active: true }).sort({ createdAt: -1 });
  res.json({ plan });
});

export const createPlan = asyncHandler(async (req, res) => {
  const sessions = await PracticeSession.find({ userId: req.user._id, status: 'COMPLETED' }).sort({ createdAt: -1 }).limit(8)
    .select('practiceType topic evaluation').lean();
  if (!sessions.length) throw new AppError(400, 'Complete at least one practice session to generate a plan', 'NO_DATA');
  const summaries = sessions.map((s) => ({
    practiceType: s.practiceType, topic: s.topic,
    scores: { fluency: s.evaluation.fluencyScore, grammar: s.evaluation.grammarScore, vocabulary: s.evaluation.vocabularyScore, clarity: s.evaluation.clarityScore },
    weaknesses: s.evaluation.weaknesses, grammarMistakes: s.evaluation.grammarMistakes?.slice(0, 4),
    nextTopics: s.evaluation.nextPracticeTopics,
  }));
  const generated = await generatePlan(summaries);
  await ImprovementPlan.updateMany({ userId: req.user._id, active: true }, { active: false });
  const plan = await ImprovementPlan.create({ userId: req.user._id, ...generated, basedOnSessions: sessions.map((s) => s._id) });
  plan.completionStatus = tally(plan); await plan.save();
  res.status(201).json({ plan });
});

export const toggleTask = asyncHandler(async (req, res) => {
  const plan = await ImprovementPlan.findOne({ userId: req.user._id, 'tasks._id': req.params.id });
  if (!plan) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  const task = plan.tasks.id(req.params.id);
  task.completed = typeof req.body.completed === 'boolean' ? req.body.completed : !task.completed;
  task.completedAt = task.completed ? new Date() : undefined;
  plan.completionStatus = tally(plan);
  await plan.save();
  res.json({ plan });
});
