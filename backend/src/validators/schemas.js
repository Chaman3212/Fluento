import { z } from 'zod';
import { PRACTICE_TYPES } from '../models/PracticeSession.js';

const password = z.string().min(8, 'Password must be at least 8 characters').max(128)
  .regex(/[a-z]/, 'Include a lowercase letter').regex(/[A-Z]/, 'Include an uppercase letter').regex(/\d/, 'Include a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});
export const forgotSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const resetSchema = z.object({ token: z.string().length(64).regex(/^[a-f0-9]+$/), password });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128), newPassword: password,
});
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  profile: z.object({
    goal: z.enum(['interview', 'work', 'academic', 'daily', '']).optional(),
    nativeLanguage: z.string().trim().max(60).optional(),
  }).optional(),
  preferences: z.object({
    dailyGoalMinutes: z.number().int().min(1).max(240).optional(),
    emailReminders: z.boolean().optional(),
    weeklySummary: z.boolean().optional(),
    defaultDifficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }).optional(),
}).strict();
export const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) });

export const createPracticeSchema = z.object({
  practiceType: z.enum(PRACTICE_TYPES),
  topic: z.string().trim().max(300).default(''),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  duration: z.coerce.number().min(0).max(60 * 30).default(0),
  source: z.enum(['recording', 'upload']).default('recording'),
});
export const listPracticeSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(100).optional(),
  status: z.enum(['UPLOADED', 'QUEUED', 'TRANSCRIBING', 'EVALUATING', 'COMPLETED', 'FAILED']).optional(),
  practiceType: z.enum(PRACTICE_TYPES).optional(),
  sort: z.enum(['newest', 'oldest', 'score_desc', 'score_asc']).default('newest'),
});
export const analyticsQuerySchema = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) });

const score = z.number().min(0).max(100).transform((n) => Math.round(n));
const str = (n) => z.string().trim().min(1).max(n);
export const evaluationSchema = z.object({
  fluencyScore: score, grammarScore: score, vocabularyScore: score, clarityScore: score,
  sentenceConstructionScore: score, relevanceScore: score,
  summary: str(1200),
  strengths: z.array(str(300)).max(8),
  weaknesses: z.array(str(300)).max(8),
  grammarMistakes: z.array(z.object({ original: str(400), corrected: str(400), explanation: str(500) })).max(15),
  vocabularySuggestions: z.array(z.object({ original: str(120), suggestion: str(120), reason: str(400) })).max(12),
  sentenceImprovements: z.array(z.object({ original: str(500), improved: str(500), explanation: str(500) })).max(10),
  recommendations: z.array(str(400)).max(8),
  nextPracticeTopics: z.array(str(200)).max(6),
});

export const planSchema = z.object({
  goals: z.array(str(200)).min(1).max(5),
  recommendations: z.array(str(400)).max(8),
  tasks: z.array(z.object({
    type: z.enum(['grammar', 'vocabulary', 'speaking', 'interview', 'fluency', 'sentence']),
    title: str(200), description: str(800),
    estimatedMinutes: z.number().int().min(1).max(120),
    dayOfWeek: z.number().int().min(0).max(6),
  })).min(3).max(14),
});
