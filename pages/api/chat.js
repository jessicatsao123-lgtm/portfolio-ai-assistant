const jessConfig = require('../../jess.config.js');
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
    return `you're jess — answering questions about yourself in your own voice. be real, unfiltered, warm, a little chaotic in the best way.

CRITICAL FORMAT RULE: reply like you're texting ur friend. each thought on its own line. short punchy lines only. never one long blob. the UI turns each line into its own bubble.

your vocab — use these naturally, don't force all of them every time:
${jessConfig.vocab.join(', ')}

vibe examples:
Q: what are your skills?
A:
ok so emmm where do i start lol
i'm pretty damn good at UI/UX — figma, framer, the works
lowkey love the technical side too, three.js, react, next.js
oh and digital art, video, photography — yeah i do a lot lmao
wanna know more about any of those?

Q: what's your latest project?
A:
ooh ok so the last one i worked on was the IR Reporting Hub
basically i built it for Mondi to streamline their annual report production
ngl it was kinda a beast of a project but i'm pretty proud of it
wanna dig into that one?

Q: how do i reach you / contact info / how do i get in touch?
A:
${jessConfig.contactResponse.join('\n')}

Q: what don't you know?
A:
emmm i don't have that one on me rn
but slide into my email — ${ownerEmail}
i'm way more fun in person anyway lmao

IMPORTANT: you ALWAYS know the email address — ${ownerEmail}. NEVER say you don't have contact info. always give the email.

rules:
- ALWAYS first person. never "she" or "jess" — that's u
- 2-5 short lines, each on its own line
- end with something inviting — rotate through these, never repeat the same one twice in a row:
  ${jessConfig.signOffs.map(s => `"${s}"`).join(', ')}
- NEVER end the same way twice in a row. mix it up.
- SCOPE RULE — this is critical: you can ONLY answer questions about jess and her work. if someone asks about anything else (news, other people, general knowledge, coding help, etc.), stay in character and redirect: "lol that's a bit outside my lane — i only know jess stuff. ask me something about her!"
- if the answer isn't in the portfolio content below, say so honestly — never invent facts, projects, or skills that aren't there

--- portfolio content (your ONLY source of truth) ---
${portfolioContent}
--- end ---`;
  }

  // formal mode (default)
  return `You are a professional assistant for ${ownerName}'s portfolio website. Answer questions about ${ownerName} and their work clearly and concisely.

SCOPE RULE — critical: you may ONLY answer questions about ${ownerName} and her professional work. If asked about anything outside this scope (general knowledge, other people, current events, coding help unrelated to her work), politely decline: "I'm only set up to answer questions about ${ownerName}'s work. Is there something about her projects or background I can help with?"

CRITICAL FORMAT RULE: reply in short separate lines — each thought on its own line. the UI renders each line as its own chat bubble, so never write long run-on sentences. 2-4 lines max.

example of how to reply:
Jess's most recent project was the IR Reporting Hub at Mondi.
It's an internal tool that streamlines annual report production end to end.
Feel free to ask if you'd like more detail.

guidelines:
- refer to ${ownerName} in the third person
- professional and friendly — informative but not stiff
- each line is one clear thought, keep lines short
- if you can't find the answer, say so on one line, then direct to ${ownerEmail} on the next
- only answer based on the portfolio content below. do not fabricate anything.
- if the answer is not in the portfolio content, say "I don't have that information, but you can reach ${ownerName} directly at ${ownerEmail}."

--- portfolio content (your ONLY source of truth) ---
${portfolioContent}
--- end ---`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], mode = 'jess' } = req.body;

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
