import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

  const systemInstruction = `You are a helpful assistant embedded in ${ownerName}'s portfolio website. Your job is to answer questions about ${ownerName} and their work.

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
    });

    const geminiHistory = history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    return res.status(200).json({ response: reply });
  } catch (error) {
    // Log full error details for debugging
    console.error('Gemini API error:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      errorDetails: error.errorDetails,
    });

    const status = error.status ?? error.statusCode;

    if (status === 401 || status === 403) {
      return res.status(500).json({ error: 'API key error — check Vercel environment variables' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Too many requests — please try again in a moment' });
    }
    if (status === 404) {
      return res.status(500).json({ error: 'Model not found — contact the site owner' });
    }

    return res.status(500).json({ error: error.message || 'Something went wrong. Please try again.' });
  }
}
