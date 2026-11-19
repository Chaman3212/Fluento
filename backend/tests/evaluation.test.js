import { describe, it, expect } from 'vitest';
import { finalizeEvaluation, computeOverall } from '../src/services/evaluation.service.js';
import { evaluationSchema, registerSchema, resetSchema } from '../src/validators/schemas.js';

const good = {
  fluencyScore: 80, grammarScore: 70.4, vocabularyScore: 90, clarityScore: 60, sentenceConstructionScore: 75, relevanceScore: 100,
  summary: 'Solid answer.', strengths: ['Clear structure'], weaknesses: ['Tense errors'],
  grammarMistakes: [{ original: 'I goed', corrected: 'I went', explanation: 'Irregular past tense' }],
  vocabularySuggestions: [], sentenceImprovements: [], recommendations: ['Practise past tense'], nextPracticeTopics: ['Describe your last trip'],
};
describe('AI evaluation validation', () => {
  it('accepts valid output, rounds scores and computes overall server-side', () => {
    const e = finalizeEvaluation({ ...good, overallScore: 999 }, { transcript: 'hi', audioMetrics: { wordsPerMinute: 120 } });
    expect(e.grammarScore).toBe(70);
    expect(e.overallScore).toBe(computeOverall(evaluationSchema.parse(good)));
    expect(e.overallScore).toBeLessThanOrEqual(100);
    expect(e.pronunciationScore).toBeNull();
    expect(e.basis.notMeasured).toContain('pronunciationScore');
  });
  it('rejects out-of-range or malformed AI output', () => {
    expect(() => evaluationSchema.parse({ ...good, grammarScore: 140 })).toThrow();
    expect(() => evaluationSchema.parse({ ...good, strengths: 'nope' })).toThrow();
    expect(() => evaluationSchema.parse({})).toThrow();
  });
});
describe('request validators', () => {
  const base = { name: 'Aryan Dixit', email: 'A@B.com', password: 'Passw0rdX', confirmPassword: 'Passw0rdX' };
  it('registers valid input and lowercases email', () => expect(registerSchema.parse(base).email).toBe('a@b.com'));
  it('rejects weak or mismatched passwords', () => {
    expect(() => registerSchema.parse({ ...base, password: 'short', confirmPassword: 'short' })).toThrow();
    expect(() => registerSchema.parse({ ...base, confirmPassword: 'Different1' })).toThrow();
  });
  it('rejects malformed reset tokens (NoSQL injection attempt)', () => {
    expect(() => resetSchema.parse({ token: { $ne: null }, password: 'Passw0rdX' })).toThrow();
  });
});
