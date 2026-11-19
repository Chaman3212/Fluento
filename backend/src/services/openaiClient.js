import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

let client;
export function getOpenAI() {
  if (!env.OPENAI_API_KEY) throw new AppError(503, 'AI service is not configured (missing OPENAI_API_KEY)', 'AI_NOT_CONFIGURED');
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 120_000, maxRetries: 1 });
  return client;
}
