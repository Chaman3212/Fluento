import jwt from 'jsonwebtoken';
import { env, cookieSecure } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const AUTH_COOKIE = 'fluento_token';
const MAX_AGE = 7 * 864e5;

export const signToken = (userId) => jwt.sign({ sub: String(userId) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256' });

export const setAuthCookie = (res, userId) => res.cookie(AUTH_COOKIE, signToken(userId), {
  httpOnly: true, sameSite: 'lax', secure: cookieSecure, path: '/', maxAge: MAX_AGE,
});
export const clearAuthCookie = (res) => res.clearCookie(AUTH_COOKIE, { httpOnly: true, sameSite: 'lax', secure: cookieSecure, path: '/' });

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    let payload;
    try { payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { throw new AppError(401, 'Session expired. Please sign in again.', 'SESSION_EXPIRED'); }
    const user = await User.findById(payload.sub);
    if (!user) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
    req.user = user;
    next();
  } catch (e) { next(e); }
}
export const requireRole = (role) => (req, _res, next) =>
  req.user?.role === role ? next() : next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
