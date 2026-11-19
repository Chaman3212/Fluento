import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { createRedis } from '../config/redis.js';
import { QUEUE_NAME } from '../jobs/queue.js';
import { processSession } from './processor.js';
import { logger } from '../utils/logger.js';

await connectDb();
const worker = new Worker(QUEUE_NAME, processSession, {
  connection: createRedis(), concurrency: 3, lockDuration: 6 * 60 * 1000,
});
worker.on('completed', (j) => logger.info({ jobId: j.id }, 'Job completed'));
worker.on('failed', (j, e) => logger.error({ jobId: j?.id, err: e.message, attempts: j?.attemptsMade }, 'Job failed'));
worker.on('error', (e) => logger.error({ err: e.message }, 'Worker error'));
logger.info('Fluento worker started');

async function shutdown() {
  logger.info('Worker shutting down');
  await worker.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
