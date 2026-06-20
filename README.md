# Portfolio AI Chat Widget

An open-source AI chat widget for your portfolio. Visitors can ask natural language questions about you — your projects, skills, background, how to reach you — and get answers in your own voice.

Free to use. No paid API required. Fork it and make it yours.

---

## How it works

```
Visitor asks a question in your Framer site
           |
           v
  ChatWidget.jsx (Framer custom code)
  — your knowledge base is written here —
           |  sends: message + your content
           v
  /api/chat.js (your Vercel deployment)
  — your Groq API key lives here —
           |  calls Groq (free AI)
           v
  Reply sent back to the widget
```

Your **API key** never leaves Vercel (safe).  
Your **knowledge base** lives in the Framer widget (easy to edit, no code needed).

---

## Setup

### 1. Get a free Groq API key

Go to [console.groq.com](https://console.groq.com), sign up, and create an API key.  
Groq is free — 14,400 requests/day on the free tier.

### 2. Fork and deploy to Vercel

1. Fork this repo on GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your fork
3. In **Project Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | your key from console.groq.com |
| `OWNER_NAME` | your name |
| `OWNER_EMAIL` | your email |

4. Deploy. Your API is now live at `https://your-project.vercel.app/api/chat`

> **Never** put your API key in Framer or anywhere public. It lives only in Vercel.

### 3. Add the widget to Framer

1. Open `framer/ChatWidget.jsx` in this repo and copy the entire file
2. In Framer: **Assets → Code → + New File** → name it `ChatWidget` → paste → Save
3. At the top of the file, fill in your details:

```js
// Your Vercel URL
const API_URL = "https://your-project.vercel.app/api/chat"

// Your details
const YOUR_NAME  = "Your Name"
const YOUR_EMAIL = "you@email.com"
```

4. Edit the `KNOWLEDGE_BASE` block with your own info (see below)
5. Drag the `ChatWidget` component onto any Framer page → Publish

---

## Editing your knowledge base

Everything the AI knows about you lives in the `KNOWLEDGE_BASE` block near the top of `ChatWidget.jsx` in Framer. Just edit it like a text document — no special format, no code knowledge needed.

```js
const KNOWLEDGE_BASE = `
Name: Your Name
Email: you@email.com

About:
Write a few sentences about yourself here.

Projects:
- Project Name: short description
- Another Project: short description

Skills:
- Design: Figma, Framer, etc.
- Code: React, etc.

Experience:
- Company — Role (dates)

Fun facts:
- Something personal
`
```

The AI will only answer from what you write here. If it's not in the knowledge base, it will say so and direct people to your email.

---

## Customising the personality

All personality settings live in `jess.config.js` at the root of the repo. Edit it once, push to GitHub, and Vercel redeploys automatically.

```js
// jess.config.js

modeNames: {
  jess: 'Jess Mode',      // rename to whatever you want, e.g. "Chill"
  formal: 'Professional', // e.g. "Work Mode"
},

greeting: "hey! ...",     // opening message (use \n for separate bubbles)

vocab: ['lol', 'lowkey', ...],   // slang words the AI uses

signOffs: ['wanna know more?', ...],  // how it ends replies (rotates)

contactResponse: [        // what it says when asked how to reach you
  "here's my email — you@email.com",
  "find me on LinkedIn too",
],

suggestions: [            // quick-tap chips before the first message
  'what have you been working on?',
  ...
],
```

---

## File structure

```
portfolio-ai-assistant/
├── pages/
│   ├── api/
│   │   └── chat.js         ← Vercel API route (Groq call happens here)
│   └── index.js            ← demo/test page
├── framer/
│   └── ChatWidget.jsx      ← paste this into Framer
├── jess.config.js          ← personality settings (edit this)
├── .env.example            ← copy to .env.local for local dev
├── .gitignore
├── package.json
└── README.md
```

---

## Local development

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-ai-assistant.git
cd portfolio-ai-assistant
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
# open http://localhost:3000 to test the chat UI
```

---

## Cost

Free. Groq's free tier covers 14,400 requests/day — more than enough for a portfolio.  
Vercel's free tier covers the backend.

---

## License

MIT — fork it, customise it, make it yours.
