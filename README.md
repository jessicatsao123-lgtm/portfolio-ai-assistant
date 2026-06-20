# Portfolio AI Assistant

An open-source AI chat widget for your portfolio, powered by Claude. Visitors can ask natural language questions about you and your work — "what's her latest project?", "what skills does she have?", "where's her LinkedIn?" — and get accurate answers from your own knowledge base.

Built with Next.js + the Anthropic SDK, embedded in Framer via a custom code component.

---

## How it works

```
Visitor types a question in Framer
        |
        v
ChatWidget.jsx (Framer custom code)
        |  fetch POST
        v
/api/chat.js (Next.js on Vercel)
        |  claude-opus-4-8
        v
Claude reads knowledge-base.md
        |
        v
Answer sent back to the widget
```

---

## Setup (5 steps)

### Step 1: Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/portfolio-ai-assistant.git
cd portfolio-ai-assistant
npm install
```

### Step 2: Add your info

Edit `data/knowledge-base.md` — replace everything with your own background, projects, skills, and links. The AI will only answer based on what's in this file, so be thorough.

### Step 3: Set up environment variables locally

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
- `ANTHROPIC_API_KEY` — get yours at [console.anthropic.com](https://console.anthropic.com)
- `OWNER_NAME` — your name
- `OWNER_EMAIL` — your email (used in fallback responses)

Test it locally:
```bash
npm run dev
# Try: curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"what projects have you worked on?"}'
```

### Step 4: Deploy to Vercel

Push to GitHub, then:

1. Go to [vercel.com](https://vercel.com) and import your repo
2. In **Project Settings > Environment Variables**, add:
   - `ANTHROPIC_API_KEY`
   - `OWNER_NAME`
   - `OWNER_EMAIL`
3. Deploy. Your API will be live at `https://your-project.vercel.app/api/chat`

**IMPORTANT:** Never put your API key in Framer or anywhere public. It lives only in Vercel's environment variables.

### Step 5: Add the widget to Framer

1. In Framer, go to **Assets > Code > + New File**
2. Paste the contents of `framer/ChatWidget.jsx`
3. At the top of the file, update `API_URL` to your Vercel URL:
   ```js
   const API_URL = "https://your-project.vercel.app/api/chat"
   ```
4. Update `ASSISTANT_NAME` to your name
5. Adjust the `COLORS` object to match your brand
6. Save, then drag the component onto any Framer page
7. Publish your Framer site

---

## Customisation

**Change the AI's personality**: Edit the `systemPrompt` in `pages/api/chat.js`

**Change colors**: Edit the `COLORS` object at the top of `framer/ChatWidget.jsx`

**Change the trigger button text**: Find `"Ask Jess"` in `ChatWidget.jsx` and replace with your name

**Change the greeting**: Edit the initial message in the `useState` at the top of `ChatWidget.jsx`

---

## File structure

```
portfolio-ai-assistant/
├── pages/
│   └── api/
│       └── chat.js         ← Claude API route
├── data/
│   └── knowledge-base.md   ← YOUR info goes here
├── framer/
│   └── ChatWidget.jsx      ← paste into Framer
├── .env.example            ← copy to .env.local
├── .gitignore
├── package.json
├── next.config.js
└── README.md
```

---

## Costs

This uses Claude Opus via the Anthropic API. Each chat message costs roughly $0.01–$0.03 depending on length. For a portfolio with moderate traffic, expect under $5/month. Prompt caching is enabled by default to reduce repeated costs from the knowledge base.

---

## License

MIT — fork it, use it, make it yours.
