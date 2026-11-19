import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PracticeSession } from '../models/PracticeSession.js';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { ImprovementPlan } from '../models/ImprovementPlan.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { clearAuthCookie } from '../middleware/auth.js';
import { deleteUserAudio } from '../storage/privateStorage.js';
import { removeJob } from '../jobs/queue.js';

export const getProfile = (req, res) => res.json({ user: req.user });

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profile, preferences } = req.validated;
  const set = {};
  if (name) set.name = name;
  for (const [k, v] of Object.entries(profile || {})) set[`profile.${k}`] = v;
  for (const [k, v] of Object.entries(preferences || {})) set[`preferences.${k}`] = v;
  const user = await User.findByIdAndUpdate(req.user._id, { $set: set }, { new: true, runValidators: true });
  res.json({ user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(400, 'Current password is incorrect', 'WRONG_PASSWORD');
  user.passwordHash = await bcrypt.hash(newPassword, 12); await user.save();
  res.json({ message: 'Password updated' });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.validated.password, user.passwordHash))) throw new AppError(400, 'Password is incorrect', 'WRONG_PASSWORD');
  const ids = await PracticeSession.find({ userId: user._id }).distinct('_id');
  await Promise.all(ids.map((id) => removeJob(id)));
  await deleteUserAudio(user._id);
  await Promise.all([
    PracticeSession.deleteMany({ userId: user._id }), ImprovementPlan.deleteMany({ userId: user._id }),
    PasswordResetToken.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id }),
  ]);
  clearAuthCookie(res);
  res.json({ ok: true });
});
