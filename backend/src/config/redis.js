import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// BullMQ requires maxRetriesPerRequest: null
export function createRedis() {
  const conn = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: true });
  conn.on('error', (e) => logger.error({ err: e.message }, 'Redis error'));
  return conn;
}
