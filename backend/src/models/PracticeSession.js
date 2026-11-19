import mongoose from 'mongoose';

export const STATUSES = ['UPLOADED', 'QUEUED', 'TRANSCRIBING', 'EVALUATING', 'COMPLETED', 'FAILED'];
export const PRACTICE_TYPES = ['free', 'daily', 'interview', 'topic', 'qa'];

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  practiceType: { type: String, enum: PRACTICE_TYPES, required: true },
  topic: { type: String, trim: true, maxlength: 300, default: '' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  audioMetadata: {
    mimeType: String, sizeBytes: Number, originalName: String,
    source: { type: String, enum: ['recording', 'upload'], default: 'recording' },
  },
  audioStorageKey: { type: String, select: false },
  transcript: { type: String, default: '' },
  evaluation: { type: mongoose.Schema.Types.Mixed, default: null },
  duration: { type: Number, default: 0 }, // seconds
  status: { type: String, enum: STATUSES, default: 'UPLOADED' },
  error: { message: String, stage: String, at: Date },
  processingMetadata: {
    attempts: { type: Number, default: 0 },
    transcribeModel: String, evaluationModel: String,
    audioMetrics: mongoose.Schema.Types.Mixed,
    startedAt: Date,
  },
  completedAt: Date,
}, { timestamps: true });

schema.index({ userId: 1, createdAt: -1 });
schema.index({ userId: 1, status: 1, createdAt: -1 });
schema.index({ userId: 1, practiceType: 1, createdAt: -1 });
schema.index({ userId: 1, 'evaluation.overallScore': -1 });

export const PracticeSession = mongoose.model('PracticeSession', schema);
