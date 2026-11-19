import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, resetLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import { audioUpload, verifyAudioContents } from '../middleware/upload.js';
import { issueCsrf } from '../middleware/csrf.js';
import * as S from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';
import * as practice from '../controllers/practice.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import * as imp from '../controllers/improvement.controller.js';
import * as profile from '../controllers/profile.controller.js';
import { dbReady } from '../config/db.js';
import { queueHealthy } from '../jobs/queue.js';

const r = Router();

r.get('/health', async (_req, res) => {
  const mongo = dbReady(); const redis = await queueHealthy().catch(() => false);
  res.status(mongo && redis ? 200 : 503).json({ status: mongo && redis ? 'ok' : 'degraded', mongo, redis });
});
r.get('/csrf', issueCsrf);

// Auth
r.post('/auth/register', authLimiter, validate(S.registerSchema), auth.register);
r.post('/auth/login', authLimiter, validate(S.loginSchema), auth.login);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', requireAuth, auth.me);
r.post('/auth/forgot-password', resetLimiter, validate(S.forgotSchema), auth.forgotPassword);
r.post('/auth/reset-password', resetLimiter, validate(S.resetSchema), auth.resetPassword);

// Everything below requires a session
r.use(requireAuth);

r.post('/practice', uploadLimiter, audioUpload, verifyAudioContents, validate(S.createPracticeSchema), practice.create);
r.get('/practice', validate(S.listPracticeSchema, 'query'), practice.list);
r.get('/practice/:id', practice.get);
r.get('/practice/:id/status', practice.status);
r.get('/practice/:id/audio', practice.audio);
r.delete('/practice/:id', practice.remove);

r.get('/dashboard/overview', dash.getOverview);
r.get('/dashboard/analytics', validate(S.analyticsQuerySchema, 'query'), dash.getAnalytics);

r.get('/improvement', imp.getPlan);
r.post('/improvement/plan', imp.createPlan);
r.patch('/improvement/tasks/:id', imp.toggleTask);

r.get('/profile', profile.getProfile);
r.patch('/profile', validate(S.profileUpdateSchema), profile.updateProfile);
r.patch('/profile/password', validate(S.changePasswordSchema), profile.changePassword);
r.delete('/profile', validate(S.deleteAccountSchema), profile.deleteAccount);

export default r;
