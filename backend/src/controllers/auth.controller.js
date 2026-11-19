import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { randomToken, sha256 } from '../utils/tokens.js';
import { sendResetEmail } from '../services/mailer.js';
import { env } from '../config/env.js';

const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5pXK1R7vN4cV8Yq3qgq7oX7H8m1mBqe';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated;
  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  setAuthCookie(res, user._id);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH); // constant-ish time
  if (!user || !ok) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  setAuthCookie(res, user._id);
  res.json({ user });
});

export const logout = (_req, res) => { clearAuthCookie(res); res.json({ ok: true }); };
export const me = (req, res) => res.json({ user: req.user });

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.validated.email });
  if (user) {
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
    const token = randomToken(32);
    await PasswordResetToken.create({ userId: user._id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    try { await sendResetEmail(user.email, user.name, `${env.APP_URL}/reset-password?token=${token}`); } catch { /* never reveal */ }
  }
  // Same response whether or not the account exists; token is never returned.
  res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated;
  const rec = await PasswordResetToken.findOne({ tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!rec) throw new AppError(400, 'This reset link is invalid or has expired', 'INVALID_TOKEN');
  await User.updateOne({ _id: rec.userId }, { passwordHash: await bcrypt.hash(password, 12) });
  rec.usedAt = new Date(); await rec.save();
  clearAuthCookie(res);
  res.json({ message: 'Password updated. You can now sign in.' });
});
