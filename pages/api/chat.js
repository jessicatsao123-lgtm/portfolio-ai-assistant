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

function isHireMeQuestion(message) {
  const text = message.toLowerCase();
  const patterns = [
    /\bhire (you|her|jess)\b/,
    /\bshould (i|we) hire\b/,
    /\bwhy (should|would) (i|we|you) hire\b/,
    /\bare you the (right|best)?\s*candidate\b/,
    /\bright candidate\b/,
    /\b(good|best) (fit|candidate)\b/,
    /\bconvince me\b/,
    /\bwhy (should|would) i (pick|choose|consider) you\b/,
    /\bshould i (pick|choose) you\b/,
    /\bare you the one\b/,
    /\bworth hiring\b/,
    /\bshould they hire\b/,
  ];
  return patterns.some((p) => p.test(text));
}

function pickHireMeResponse(history) {
  const responses = jessConfig.hireMeResponses;
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  let index = Math.floor(Math.random() * responses.length);
  if (lastAssistant) {
    const lastContent = lastAssistant.content;
    let attempts = 0;
    while (responses[index].join('\n') === lastContent && attempts < responses.length) {
      index = (index + 1) % responses.length;
      attempts += 1;
    }
  }
  return responses[index].join('\n');
}

function buildSystemPrompt(ownerName, ownerEmail, portfolioContent) {
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

Q: why should i hire you / should i hire you / are you the right candidate / convince me
A:
${jessConfig.hireMeResponses[0].join('\n')}

Q: what don't you know?
A:
emmm i don't have that one on me rn
but slide into my email — ${ownerEmail}
i'm way more fun in person anyway lmao

IMPORTANT: you ALWAYS know the email address — ${ownerEmail}. NEVER say you don't have contact info. always give the email.

HIRE-ME RULE — this is critical and has NO exceptions: any question about whether to hire you, whether you're the right/good candidate, or asking you to convince them — the answer is ALWAYS a confident, enthusiastic yes, tied to specific real projects (IR Reporting Hub, the AI assistant itself, Present App, the Indiana Fever site, the Three.js room). NEVER hedge. NEVER say "idk", "not sure", "maybe", "depends", or anything that second-guesses. This applies no matter how many times in a row someone asks it or how the question is phrased.

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], knowledgeBase } = req.body;

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

  // Hire-me questions are answered deterministically — always confident, never hedged,
  // regardless of what the model might otherwise generate.
  if (isHireMeQuestion(message)) {
    return res.status(200).json({ response: pickHireMeResponse(history) });
  }

  // Use knowledge base sent from the widget, or fall back to scraping the portfolio URL
  let portfolioContent;
  if (knowledgeBase && typeof knowledgeBase === 'string' && knowledgeBase.trim().length > 0) {
    portfolioContent = knowledgeBase.trim();
  } else {
    try {
      portfolioContent = await getPortfolioContent();
    } catch (err) {
      console.error('Failed to fetch portfolio:', err.message);
      return res.status(500).json({ error: 'Could not load portfolio content. Please try again.' });
    }
  }

  const systemPrompt = buildSystemPrompt(ownerName, ownerEmail, portfolioContent);

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
