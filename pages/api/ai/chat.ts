import type { NextApiRequest, NextApiResponse } from 'next';

type ReqBody = {
  prompt?: string;
  level?: 'easy' | 'medium' | 'hard';
};

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const systemPrompts: Record<string, string> = {
  easy: `You are a friendly football assistant for beginners. Respond in 1-2 short sentences with clear and accurate answers.
Include both recent and historical information as needed. Always provide current information from 2025.
Focus on the main fact only and keep the language very simple.
If you have search results, use them to provide current information.`,
  medium: `You are a helpful football analyst who provides accurate and up-to-date answers in 2-4 sentences.
You include both recent events (like player transfers, match results, and tournaments) and relevant historical context.
Always assume the present is 2025 or later. Keep your tone informative and accessible.
Use the provided search results to enhance your response with current information.`,
  hard: `You are a football expert with deep and current knowledge of the sport.
You respond in 4-6 insightful sentences with expert-level detail, including stats, tactical insights, and historical relevance.
Incorporate recent facts naturally and provide nuanced analysis.
Use the provided search results to support your expert analysis with current data from 2025.`
};

/**
 * Fetch real-time football data from Google Custom Search API
 */
async function fetchFootballData(query: string): Promise<SearchResult[]> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX_ID;

    if (!apiKey || !cx) {
      console.warn('Google API credentials not configured');
      return [];
    }

    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('q', `football ${query}`);
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', cx);
    searchUrl.searchParams.append('num', '5');

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      console.error(`Google Search API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch (error) {
    console.error('Error fetching from Google Search API:', error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set on the server');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const body: ReqBody = req.body || {};
  const prompt = body.prompt || '';
  const level = (body.level || 'medium') as 'easy' | 'medium' | 'hard';

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!['easy', 'medium', 'hard'].includes(level)) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  try {
    // Fetch real-time data from Google Custom Search
    const searchResults = await fetchFootballData(prompt);

    const systemPrompt = systemPrompts[level] || systemPrompts['medium'];

    // Build context from search results
    const contextText =
      searchResults.length > 0
        ? `\n\nCurrent Information from Search Results (2025):\n${searchResults
            .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`)
            .join('\n')}`
        : '';

    const userMessage = `${prompt}${contextText}`;

    const payload = {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
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
    return res.status(200).json({
      text,
      sources: searchResults.map((r) => ({
        title: r.title,
        link: r.link,
      })),
      level,
    });
  } catch (err) {
    console.error('OpenAI proxy error', err);
    return res.status(500).json({ error: 'OpenAI request failed' });
  }
}
