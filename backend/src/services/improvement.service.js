import { env } from '../config/env.js';
import { getOpenAI } from './openaiClient.js';
import { planSchema } from '../validators/schemas.js';

const SYSTEM = `You create a 7-day English speaking improvement plan from a learner's recent evaluated sessions.
Base every task on the actual weaknesses/mistakes provided. Return ONLY JSON:
{"goals":[...],"recommendations":[...],"tasks":[{"type":"grammar|vocabulary|speaking|interview|fluency|sentence","title":"","description":"","estimatedMinutes":10,"dayOfWeek":0-6}]}
Provide 5-10 tasks spread across the week, mixing task types according to the weakest categories.`;

export async function generatePlan(summaries) {
  const res = await getOpenAI().chat.completions.create({
    model: env.OPENAI_EVAL_MODEL, temperature: 0.4, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: JSON.stringify(summaries) }],
  });
  return planSchema.parse(JSON.parse(res.choices[0].message.content));
}
