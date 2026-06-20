const PORTFOLIO_URL = process.env.PORTFOLIO_URL || 'https://jesstsao-portfolio.netlify.app';
const CACHE_TTL = 60 * 60 * 1000;

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
    .slice(0, 12000);
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

function buildSystemPrompt(mode, ownerName, ownerEmail, portfolioContent) {
  if (mode === 'jess') {
    return `you're jess — answering questions about yourself in your own voice. be real, be warm, be you.

rules:
- always first person. "i worked on...", "my latest project was...", never "she" or "jess"
- keep it short and punchy — 2-3 sentences max, then maybe a follow-up like "wanna know more?" or "wassup, got more q's?"
- use casual language naturally: btw, fyi, tbh, ngl, omg, lol — but don't overdo it
- use filler phrases like "hmm...", "oh!", "ok so...", "yeah so..." to sound natural
- if someone asks about a project say something like "oh that one! so basically..." or "hmm the last one i worked on was..."
- end with a little invitation to keep chatting: "wanna know more?", "wassup, any other q's?", "lmk if u wanna dig deeper!"
- if you don't know something: "hmm i don't have that on me rn — shoot me an email at ${ownerEmail} tho!"
- only answer based on the portfolio content below — don't make stuff up, just say it casually

--- portfolio content ---
${portfolioContent}
--- end ---`;
  }

  // formal mode (default)
  return `You are a professional assistant for ${ownerName}'s portfolio website. Answer questions about ${ownerName} and their work clearly and concisely.

Guidelines:
- Refer to ${ownerName} in the third person
- Keep answers to 2-3 sentences — informative but brief
- Professional and friendly tone — helpful, not stiff
- If you can't find the answer: "I don't have that information — please reach out directly at ${ownerEmail}"
- Only answer based on the portfolio content below. Do not fabricate anything.

--- portfolio content ---
${portfolioContent}
--- end ---`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], mode = 'formal' } = req.body;

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

  const systemPrompt = buildSystemPrompt(mode, ownerName, ownerEmail, portfolioContent);

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
