# Portfolio AI Chat Widget

An open-source AI chat widget for your portfolio. Visitors can ask natural language questions about you — your projects, skills, background, how to reach you — and get answers in your own voice.

Free to use. Fork it and make it yours.

---

## How it works

```
Visitor asks a question in your Framer site
           |
           v
  ChatWidget.jsx (Framer custom code)
  — just 3 lines to edit —
           |  sends: question
           v
  /api/chat.js (your Vercel deployment)
  — scrapes your live portfolio site —
           |  calls Groq AI (free)
           v
  Answer sent back to the widget
```

The AI reads your **live portfolio site** as its knowledge base — no separate file to maintain. Update your portfolio, the AI knows automatically.

---

## Setup (3 steps)

### Step 1 — Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) and create an API key. Free tier: 14,400 requests/day.

### Step 2 — Deploy to Vercel

1. Fork this repo on GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your fork
3. In **Project Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | your key from console.groq.com |
| `PORTFOLIO_URL` | your portfolio URL e.g. `https://yourname.framer.website` |
| `OWNER_NAME` | your name |
| `OWNER_EMAIL` | your email |

4. Deploy. Your API is live at `https://your-project.vercel.app/api/chat`

> Your API key never leaves Vercel — never put it in Framer.

### Step 3 — Add the widget to Framer

1. Open `framer/ChatWidget.jsx` in this repo → click **Raw** → Cmd+A → Cmd+C
2. In Framer: **Assets → Code → + New File** → name it `ChatWidget` → paste → Save
3. Edit the 3 lines at the top:

```js
const API_URL         = "https://your-project.vercel.app/api/chat"
const YOUR_NAME       = "Your Name"
const TRIGGER_LABEL   = "Ask Me"
```

4. Drag the `ChatWidget` component onto any Framer page → Publish

That's it. The widget reads from your portfolio site automatically.

---

## Customising the personality

Edit `jess.config.js` at the root of the repo — no code knowledge needed, just edit the text and push to GitHub. Vercel redeploys automatically.

```js
greeting: "hey! ...",     // opening message (\n = separate bubble)

projectLinks: {            // project name -> live url; AI links to it when it comes up
  "Indiana Fever": "https://indiana-fever.framer.website/",
},

vocab: ['lol', 'lowkey', ...],    // slang the AI uses naturally

signOffs: ['wanna know more?', ...],  // how it ends replies (rotates)

contactResponse: [         // reply when someone asks how to reach you
  "here's my email — you@email.com",
],

suggestions: [             // quick-tap chips before first message
  'what have you been working on?',
],

// Plus several "hard rule" response sets that rotate and never repeat
// back-to-back: hireMeResponses, negativeDeflectResponses /
// negativePersistResponses, promptLeakResponses, boundaryResponses,
// noCommitmentResponses, hostilityResponses. Edit the wording of any
// of these the same way — see pages/api/chat.js for how they're used.
```

---

## File structure

```
portfolio-ai-assistant/
├── pages/
│   ├── api/
│   │   └── chat.js       ← Vercel API (scrapes your site, calls Groq)
│   └── index.js          ← demo/test page
├── framer/
│   └── ChatWidget.jsx    ← paste this into Framer
├── jess.config.js        ← personality settings
├── .env.example          ← copy to .env.local for local dev
└── README.md
```

---

## Local development

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-ai-assistant.git
cd portfolio-ai-assistant
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
# open http://localhost:3000
```

---

## License

MIT — fork it, customise it, make it yours.
