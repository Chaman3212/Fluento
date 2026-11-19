import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profile: {
    goal: { type: String, enum: ['interview', 'work', 'academic', 'daily', ''], default: '' },
    nativeLanguage: { type: String, default: '', maxlength: 60 },
  },
  preferences: {
    dailyGoalMinutes: { type: Number, min: 1, max: 240, default: 10 },
    emailReminders: { type: Boolean, default: false },
    weeklySummary: { type: Boolean, default: true },
    defaultDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.passwordHash; delete ret.__v; return ret; },
});
export const User = mongoose.model('User', userSchema);
