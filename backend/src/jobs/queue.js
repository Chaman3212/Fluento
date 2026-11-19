import { Queue } from 'bullmq';
import { createRedis } from '../config/redis.js';

export const QUEUE_NAME = 'speech-processing';
let queue; let connection;
export function getQueue() {
  if (!queue) {
    connection = createRedis();
    queue = new Queue(QUEUE_NAME, { connection, defaultJobOptions: {
      attempts: 3, backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 3600, count: 200 }, removeOnFail: { age: 7 * 86400 },
    } });
  }
  return queue;
}
// jobId = sessionId -> BullMQ ignores duplicate adds (duplicate protection)
export const enqueueSession = (sessionId) => getQueue().add('process', { sessionId: String(sessionId) }, { jobId: String(sessionId) });
export async function removeJob(sessionId) {
  try { const j = await getQueue().getJob(String(sessionId)); if (j) await j.remove(); } catch { /* job may be active */ }
}
export const queueHealthy = async () => { try { await (await getQueue().client).ping(); return true; } catch { return false; } };
