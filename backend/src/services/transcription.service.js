import fs from 'node:fs';
import path from 'node:path';
import { toFile } from 'openai';
import { env } from '../config/env.js';
import { getOpenAI } from './openaiClient.js';
import { audioPath } from '../storage/privateStorage.js';
import { computeAudioMetrics } from '../utils/audio.js';

// Sends the private audio file to OpenAI speech-to-text. Real call, no mocks.
export async function transcribe(storageKey) {
  const full = audioPath(storageKey);
  const file = await toFile(fs.createReadStream(full), path.basename(full));
  const isWhisper = env.OPENAI_TRANSCRIBE_MODEL.startsWith('whisper');
  const res = await getOpenAI().audio.transcriptions.create(isWhisper
    ? { file, model: env.OPENAI_TRANSCRIBE_MODEL, response_format: 'verbose_json', timestamp_granularities: ['word'], language: 'en' }
    : { file, model: env.OPENAI_TRANSCRIBE_MODEL, response_format: 'json', language: 'en' });
  const text = (res.text || '').trim();
  const duration = Number(res.duration) || 0;
  const words = Array.isArray(res.words) ? res.words : [];
  return { text, duration, audioMetrics: computeAudioMetrics({ words, text, duration }) };
}
