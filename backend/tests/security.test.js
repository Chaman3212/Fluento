import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
describe('CSRF + auth gates (no DB needed)', () => {
  it('issues a csrf token and cookie', async () => {
    const res = await request(app).get('/api/csrf');
    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toHaveLength(48);
    expect(res.headers['set-cookie'].join(';')).toContain('fluento_csrf=');
  });
  it('blocks mutations without a CSRF token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF');
  });
  it('blocks mismatched CSRF token', async () => {
    const res = await request(app).post('/api/auth/login').set('Cookie', 'fluento_csrf=aaa').set('x-csrf-token', 'bbb').send({});
    expect(res.status).toBe(403);
  });
  it('validates input after CSRF passes', async () => {
    const t = 'a'.repeat(48);
    const res = await request(app).post('/api/auth/login').set('Cookie', `fluento_csrf=${t}`).set('x-csrf-token', t).send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
  it('requires auth on protected routes', async () => {
    for (const p of ['/api/practice', '/api/dashboard/overview', '/api/improvement', '/api/profile']) {
      const res = await request(app).get(p);
      expect(res.status).toBe(401);
    }
  });
  it('rejects a forged JWT cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'fluento_token=forged.jwt.value');
    expect(res.status).toBe(401);
  });
  it('sets security headers and 404s unknown routes', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
