import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let cachedKnowledgeBase = null;

function getKnowledgeBase() {
  if (!cachedKnowledgeBase) {
    cachedKnowledgeBase = fs.readFileSync(
      path.join(process.cwd(), 'data', 'knowledge-base.md'),
      'utf-8'
    );
  }
  return cachedKnowledgeBase;
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
  const knowledgeBase = getKnowledgeBase();

  const systemPrompt = `You are a helpful assistant embedded in ${ownerName}'s portfolio website. Your job is to answer questions about ${ownerName} and their work.

Answer based ONLY on the information provided in the knowledge base below. Do not make anything up.

Guidelines:
- Keep answers concise — 2-3 sentences max
- Be friendly and conversational, like a well-informed colleague introducing someone
- If you don't have the answer, say: "I don't have that info — reach out directly at ${ownerEmail}"
- Never fabricate projects, skills, dates, or facts not in the knowledge base
- Stay on topic: only answer questions about ${ownerName} and their work

---
${knowledgeBase}
---`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: message.trim() },
      ],
    });

    const reply = response.choices[0]?.message?.content || '';
    return res.status(200).json({ response: reply });
  } catch (error) {
    console.error('Groq API error:', {
      message: error.message,
      status: error.status,
    });

    const status = error.status ?? error.statusCode;

    if (status === 401) {
      return res.status(500).json({ error: 'API key error — check Vercel environment variables' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Too many requests — please try again in a moment' });
    }

    return res.status(500).json({ error: error.message || 'Something went wrong. Please try again.' });
  }
}
