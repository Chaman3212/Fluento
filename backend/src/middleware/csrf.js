import crypto from 'node:crypto';
import { cookieSecure } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const CSRF_COOKIE = 'fluento_csrf';
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

// Double-submit cookie: mutation must echo the cookie value in X-CSRF-Token.
export function issueCsrf(req, res) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE, token, { httpOnly: false, sameSite: 'lax', secure: cookieSecure, path: '/', maxAge: 7 * 864e5 });
  res.json({ csrfToken: token });
}

export function csrfProtection(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length
      || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return next(new AppError(403, 'Invalid or missing CSRF token', 'CSRF'));
  }
  next();
}
