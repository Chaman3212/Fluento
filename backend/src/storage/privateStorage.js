import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const root = path.resolve(env.STORAGE_DIR);

// Keys look like "<userId>/<random>.<ext>"; resolved path must stay inside root.
function resolveKey(key) {
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid storage key');
  return full;
}
export async function saveAudio(userId, buffer, ext) {
  const key = `${userId}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const full = resolveKey(key);
  await fsp.mkdir(path.dirname(full), { recursive: true, mode: 0o700 });
  await fsp.writeFile(full, buffer, { mode: 0o600 });
  return key;
}
export const audioPath = (key) => resolveKey(key);
export const audioStream = (key) => fs.createReadStream(resolveKey(key));
export async function deleteAudio(key) {
  if (!key) return;
  await fsp.rm(resolveKey(key), { force: true });
}
export async function deleteUserAudio(userId) {
  await fsp.rm(resolveKey(String(userId)), { recursive: true, force: true });
}
