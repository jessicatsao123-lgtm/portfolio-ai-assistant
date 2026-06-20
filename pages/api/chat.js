const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://jesstsao-portfolio.netlify.app';
const CACHE_TTL = 60 * 60 * 1000; // refresh portfolio content every hour

let portfolioCache = { content: null, fetchedAt: 0 };

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000); // keep within context limits
}

async function getPortfolioContent() {
  const now = Date.now();
  if (portfolioCache.content && now - portfolioCache.fetchedAt < CACHE_TTL) {
    return portfolioCache.content;
  }

  const res = await fetch(PORTFOLIO_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)' },
  });

  if (!res.ok) throw new Error(`Failed to fetch portfolio: ${res.status}`);

  const html = await res.text();
  const content = stripHtml(html);

  portfolioCache = { content, fetchedAt: now };
  return content;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 characters)' });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'History must be an array' });
  }

  const ownerName = process.env.OWNER_NAME || 'the portfolio owner';
  const ownerEmail = process.env.OWNER_EMAIL || 'the contact email listed on the site';

  let portfolioContent;
  try {
    portfolioContent = await getPortfolioContent();
  } catch (err) {
    console.error('Failed to fetch portfolio:', err.message);
    return res.status(500).json({ error: 'Could not load portfolio content. Please try again.' });
  }

  const systemPrompt = `You are a helpful assistant embedded in ${ownerName}'s portfolio website. Answer questions about ${ownerName} and their work.

Answer based ONLY on the portfolio content below. Do not make anything up.

Guidelines:
- Keep answers concise — 2-3 sentences max
- Be friendly and conversational
- If you can't find the answer in the content, say: "I don't have that info — reach out directly at ${ownerEmail}"
- Never fabricate projects, skills, dates, or facts not in the portfolio
- Only answer questions about ${ownerName} and their work

--- PORTFOLIO CONTENT ---
${portfolioContent}
--- END ---`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: message.trim() },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      console.error('Groq error:', groqRes.status, err);
      if (groqRes.status === 401) return res.status(500).json({ error: 'API key error — check Vercel environment variables' });
      if (groqRes.status === 429) return res.status(429).json({ error: 'Too many requests — please try again in a moment' });
      return res.status(500).json({ error: err?.error?.message || 'Something went wrong. Please try again.' });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ response: reply });
  } catch (error) {
    console.error('Fetch error:', error.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
