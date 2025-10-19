import type { NextApiRequest, NextApiResponse } from 'next';

type ReqBody = {
  prompt?: string;
  level?: 'easy' | 'medium' | 'hard';
};

const systemPrompts: Record<string, string> = {
  easy: `You are a friendly football assistant for beginners. Respond in 1-2 short sentences with clear and accurate answers. Include both recent and historical information as needed. Keep the language very simple.`,
  medium: `You are a helpful football analyst who provides accurate and up-to-date answers in 2–4 sentences. Include recent events and relevant historical context. Keep your tone informative and accessible.`,
  hard: `You are a football expert with deep and current knowledge of the sport. Respond in 4–6 insightful sentences with expert-level detail, including stats, tactical insights, and historical relevance.`
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set on the server');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const body: ReqBody = req.body || {};
  const prompt = body.prompt || '';
  const level = body.level || 'medium';

  try {
    const systemPrompt = systemPrompts[level] || systemPrompts['medium'];

    const payload = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: level === 'easy' ? 300 : level === 'medium' ? 600 : 1000,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('OpenAI error', data);
      return res.status(r.status).json({ error: data });
    }

    const text = data?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('OpenAI proxy error', err);
    return res.status(500).json({ error: 'OpenAI request failed' });
  }
}
