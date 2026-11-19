import crypto from 'node:crypto';
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
