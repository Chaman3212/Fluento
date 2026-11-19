import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  type: { type: String, enum: ['grammar', 'vocabulary', 'speaking', 'interview', 'fluency', 'sentence'], required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 1000 },
  estimatedMinutes: { type: Number, default: 10, min: 1, max: 120 },
  dayOfWeek: { type: Number, min: 0, max: 6, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: Date,
});
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true },
  goals: [String],
  recommendations: [String],
  tasks: [taskSchema],
  basedOnSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PracticeSession' }],
  completionStatus: { completed: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
}, { timestamps: true });
schema.index({ userId: 1, active: 1, createdAt: -1 });
export const ImprovementPlan = mongoose.model('ImprovementPlan', schema);
