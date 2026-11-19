# Fluento

AI-powered English speaking practice. Record or upload speech, get a transcript, an AI evaluation, personalised feedback, progress analytics and a weekly improvement plan.

**Stack:** React + Vite + Tailwind · Node/Express · MongoDB · Redis + BullMQ · OpenAI (speech-to-text + evaluation) · Docker + Nginx.
Design tokens (colours, fonts, spacing) come from the Fluento Figma file.

## Quick start (Docker)
```bash
cp .env.example .env          # set JWT_SECRET (openssl rand -hex 32) and OPENAI_API_KEY
docker compose up --build
# open http://localhost:8080
```
Services: `mongo`, `redis`, `backend` (API), `worker` (BullMQ), `frontend` (static), `nginx` (edge proxy, port 8080).

## Local development
Requires Node 20+, MongoDB and Redis running locally.
```bash
# terminal 1 – API
cd backend && cp .env.example .env && npm install && npm run dev
# terminal 2 – worker (processes uploaded audio)
cd backend && npm run dev:worker
# terminal 3 – web app (proxies /api to :4000)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Tests, lint, build
```bash
cd backend  && npm run lint && npm test
cd frontend && npm run lint && npm test && npm run build
```

## How the AI pipeline works
1. Browser records (MediaRecorder) or the user uploads audio → `POST /api/practice` (multipart).
2. API validates MIME **and real file contents** (magic bytes), size and ownership, stores the file in private storage, creates a `PracticeSession` (`UPLOADED`) and enqueues a BullMQ job (`jobId = sessionId` → duplicate protection) → `QUEUED`. Returns `202` immediately.
3. Worker → `TRANSCRIBING`: sends audio to OpenAI speech-to-text (`whisper-1`, word timestamps).
4. Worker computes **measured** delivery metrics from timestamps: words/min, pauses ≥0.7 s, filler words.
5. Worker → `EVALUATING`: sends transcript + metrics to the OpenAI evaluation model with a fixed rubric; output is validated with Zod (one automatic re-ask if invalid). The overall score is computed server-side from the validated category scores.
6. Result saved → `COMPLETED` (or `FAILED` with a user-safe message). Retries: 3 attempts, exponential backoff, 5-minute job timeout.
7. The frontend polls `GET /api/practice/:id/status` and shows `/feedback/:id` when done.

**Honesty rules:** pronunciation is **not scored** (`pronunciationScore: null`) because a transcript cannot reliably measure it. Measured values (pace, pauses, fillers) are shown separately from AI estimates, and scores are labelled as coaching estimates, not certified proficiency.

## API (all under `/api`, JSON, cookie auth + `X-CSRF-Token` on mutations)
| Method | Path | Purpose |
|---|---|---|
| GET | `/csrf` | Issue CSRF token (also sets cookie) |
| GET | `/health` | Mongo + Redis status |
| POST | `/auth/register` · `/auth/login` · `/auth/logout` | Session management |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Emailed one-time token (30 min) |
| POST | `/practice` | Upload audio (`audio` file + `practiceType, topic, difficulty, duration, source`) → 202 |
| GET | `/practice?page&limit&q&status&practiceType&sort` | Paginated history |
| GET | `/practice/:id` · `/practice/:id/status` · `/practice/:id/audio` | Detail / polling / private audio stream |
| DELETE | `/practice/:id` | Delete session + audio file + queued job |
| GET | `/dashboard/overview` · `/dashboard/analytics?days=` | Stats and charts (MongoDB aggregations) |
| GET/POST | `/improvement` · `/improvement/plan` | Current plan / generate from real results |
| PATCH | `/improvement/tasks/:id` | Toggle task completion |
| GET/PATCH/DELETE | `/profile`, PATCH `/profile/password` | Profile, password, account deletion |

## Data model
`User` · `PracticeSession` (status enum, evaluation, audioStorageKey [never returned], processingMetadata, indexes on `userId+createdAt`, `userId+status`, `userId+practiceType`) · `PasswordResetToken` (sha256 hash, TTL index) · `ImprovementPlan` (tasks + completion).

## Security summary
bcrypt (cost 12) · JWT in **HttpOnly** SameSite cookie (never localStorage) · `Secure` cookie in production · double-submit **CSRF** on all mutations · rate limits (login 10/15 min, reset 5/h, uploads 40/h, API 600/15 min) · Helmet · strict CORS · Zod validation everywhere · `sanitizeFilter` against NoSQL injection · reset tokens stored hashed and never returned · generic responses to avoid account enumeration · private audio, streamed only after an ownership check · every query scoped by `userId` · account deletion removes sessions, audio, tokens and plans · CSP/security headers in Nginx.

## Environment variables
See `.env.example` (compose) and `backend/.env.example` (local). Required: `JWT_SECRET`, `OPENAI_API_KEY`. For reset emails: `SMTP_*`. Set `COOKIE_SECURE=true` behind HTTPS.

## Production notes
Terminate TLS at Nginx (or a load balancer), set `COOKIE_SECURE=true` and `APP_URL=https://your-domain`. API and worker must share the audio volume (or swap `storage/privateStorage.js` for S3/GCS). Back up the `mongo-data` and `audio-data` volumes.

## Known limitations
* Pronunciation scoring is intentionally absent (see above).
* Landing-page sample score card and weekly chart are labelled illustrative; the "Who it's for" section contains no invented testimonials. Replace with real learner quotes when you have them.
* Without SMTP configured, reset emails are not sent (a warning is logged on the server; the token is never exposed).
