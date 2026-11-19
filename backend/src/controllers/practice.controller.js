import { PracticeSession } from '../models/PracticeSession.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { saveAudio, deleteAudio, audioStream } from '../storage/privateStorage.js';
import { enqueueSession, removeJob } from '../jobs/queue.js';
import { logger } from '../utils/logger.js';

const own = (req) => ({ _id: req.params.id, userId: req.user._id });
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const create = asyncHandler(async (req, res) => {
  const { practiceType, topic, difficulty, duration, source } = req.validated;
  const key = await saveAudio(req.user._id, req.file.buffer, req.audioKind.ext);
  const session = await PracticeSession.create({
    userId: req.user._id, practiceType, topic, difficulty, duration, status: 'UPLOADED', audioStorageKey: key,
    audioMetadata: { mimeType: req.audioKind.mime, sizeBytes: req.file.size, originalName: String(req.file.originalname || '').slice(0, 120), source },
  });
  try {
    await enqueueSession(session._id);
    session.status = 'QUEUED'; await session.save();
  } catch (e) {
    logger.error({ err: e.message }, 'Queueing failed');
    session.status = 'FAILED'; session.error = { message: 'Processing queue unavailable. Please try again shortly.', stage: 'QUEUE', at: new Date() };
    await session.save();
    throw new AppError(503, 'Processing queue unavailable. Please try again shortly.', 'QUEUE_DOWN');
  }
  res.status(202).json({ id: session._id, status: session.status });
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, q, status, practiceType, sort } = req.validatedQuery;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;
  if (practiceType) filter.practiceType = practiceType;
  if (q) filter.topic = { $regex: escapeRe(q), $options: 'i' };
  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, score_desc: { 'evaluation.overallScore': -1, createdAt: -1 }, score_asc: { 'evaluation.overallScore': 1, createdAt: -1 } };
  const [items, total] = await Promise.all([
    PracticeSession.find(filter).sort(sortMap[sort]).skip((page - 1) * limit).limit(limit)
      .select('practiceType topic difficulty duration status createdAt completedAt error evaluation.overallScore').lean(),
    PracticeSession.countDocuments(filter),
  ]);
  res.json({ items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
});

export const get = asyncHandler(async (req, res) => {
  const s = await PracticeSession.findOne(own(req));
  if (!s) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  res.json({ session: s });
});

export const status = asyncHandler(async (req, res) => {
  const s = await PracticeSession.findOne(own(req)).select('status error completedAt').lean();
  if (!s) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  res.json({ id: req.params.id, status: s.status, error: s.error?.message || null, completedAt: s.completedAt });
});

export const audio = asyncHandler(async (req, res) => {
  const s = await PracticeSession.findOne(own(req)).select('+audioStorageKey audioMetadata');
  if (!s?.audioStorageKey) throw new AppError(404, 'Audio not found', 'NOT_FOUND');
  res.set({ 'Content-Type': s.audioMetadata?.mimeType || 'audio/webm', 'Cache-Control': 'private, no-store' });
  audioStream(s.audioStorageKey).on('error', () => res.status(404).end()).pipe(res);
});

export const remove = asyncHandler(async (req, res) => {
  const s = await PracticeSession.findOne(own(req)).select('+audioStorageKey');
  if (!s) throw new AppError(404, 'Session not found', 'NOT_FOUND');
  await removeJob(s._id).catch(() => {});
  await deleteAudio(s.audioStorageKey);
  await s.deleteOne();
  res.json({ ok: true });
});
