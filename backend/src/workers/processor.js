import { PracticeSession } from '../models/PracticeSession.js';
import { transcribe } from '../services/transcription.service.js';
import { evaluateSpeech } from '../services/evaluation.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const JOB_TIMEOUT_MS = 5 * 60 * 1000;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('Job timed out')), ms))]);

export async function processSession(job) {
  const { sessionId } = job.data;
  const session = await PracticeSession.findById(sessionId).select('+audioStorageKey');
  if (!session) { logger.warn({ sessionId }, 'Session vanished (deleted?), skipping'); return; }
  if (session.status === 'COMPLETED') return; // idempotent
  let stage = 'TRANSCRIBING';
  try {
    await withTimeout((async () => {
      session.status = 'TRANSCRIBING';
      session.processingMetadata.attempts = job.attemptsMade + 1;
      session.processingMetadata.startedAt = new Date();
      session.processingMetadata.transcribeModel = env.OPENAI_TRANSCRIBE_MODEL;
      session.error = undefined;
      await session.save();

      const t = await transcribe(session.audioStorageKey);
      if (!t.text) throw Object.assign(new Error('No speech detected in the recording'), { unrecoverable: true });
      session.transcript = t.text;
      if (t.duration) session.duration = Math.round(t.duration);
      session.processingMetadata.audioMetrics = t.audioMetrics;
      stage = 'EVALUATING';
      session.status = 'EVALUATING';
      session.processingMetadata.evaluationModel = env.OPENAI_EVAL_MODEL;
      await session.save();

      const evaluation = await evaluateSpeech({
        transcript: t.text, practiceType: session.practiceType, topic: session.topic,
        difficulty: session.difficulty, audioMetrics: t.audioMetrics,
      });
      session.evaluation = evaluation;
      session.status = 'COMPLETED';
      session.completedAt = new Date();
      await session.save();
    })(), JOB_TIMEOUT_MS);
  } catch (err) {
    logger.error({ sessionId, stage, err: err.message }, 'Processing failed');
    const finalAttempt = err.unrecoverable || job.attemptsMade + 1 >= (job.opts.attempts || 1);
    if (finalAttempt) {
      session.status = 'FAILED';
      session.error = { message: userMessage(err), stage, at: new Date() };
      await session.save();
      if (err.unrecoverable) return; // do not retry
    } else {
      session.status = 'QUEUED';
      await session.save();
    }
    throw err; // lets BullMQ retry with backoff
  }
}

function userMessage(err) {
  if (err.unrecoverable) return err.message;
  if (/timed out/i.test(err.message)) return 'Processing took too long. Please try again.';
  if (/OPENAI_API_KEY|not configured/i.test(err.message)) return 'AI service is not configured.';
  if (err.status === 429) return 'AI service is busy. Please retry in a minute.';
  return 'We could not analyze this recording. Please try again.';
}
