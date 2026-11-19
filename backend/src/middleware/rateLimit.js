import rateLimit from 'express-rate-limit';
const make = (windowMs, limit, message) => rateLimit({
  windowMs, limit, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message } }),
});
export const apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests. Please slow down.');
export const authLimiter = make(15 * 60 * 1000, 10, 'Too many attempts. Try again in a few minutes.');
export const resetLimiter = make(60 * 60 * 1000, 5, 'Too many reset requests. Try again later.');
export const uploadLimiter = make(60 * 60 * 1000, 40, 'Upload limit reached. Try again later.');
