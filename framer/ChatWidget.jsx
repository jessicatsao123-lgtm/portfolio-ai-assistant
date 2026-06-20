// ============================================================
// Portfolio AI Chat Widget — Framer Embed (standalone, no server needed)
// ============================================================
// SETUP (3 steps):
//   1. Get a free Groq API key at console.groq.com
//   2. Fill in your details below (key, name, email, bio)
//   3. In Framer: Assets → Code → "+ New file" → paste this → Save
//      Then drag "ChatWidget" onto any page.
// ============================================================

import { useState, useRef, useEffect } from "react"

// ============================================================
// STEP 1 — YOUR GROQ API KEY
// Get one free at https://console.groq.com
// ============================================================
const GROQ_API_KEY = "your_groq_api_key_here"

// ============================================================
// STEP 2 — YOUR DETAILS
// ============================================================
const YOUR_NAME    = "Jess"
const YOUR_EMAIL   = "jessicatsao123@gmail.com"
const TRIGGER_LABEL = "Ask Jess"          // text on the floating button
const ASSISTANT_LABEL = "Jess's AI"       // text in the chat header

// ============================================================
// STEP 3 — YOUR KNOWLEDGE BASE
// Write anything you want the AI to know about you.
// Plain text, no special format needed.
// The more detail you add, the better the answers.
// ============================================================
const KNOWLEDGE_BASE = `
Name: Jessica (Jess) Tsao
Role: Product designer and creative technologist
Email: jessicatsao123@gmail.com
LinkedIn: linkedin.com/in/jessicatsao (update with your real URL)

About:
Jess is a product designer and creative technologist based in [your city].
She combines strong UI/UX skills with hands-on technical ability —
comfortable in Figma, Framer, React, Next.js, Three.js, and more.
She also does digital art, video, and photography.

Projects:
- IR Reporting Hub: Built for Mondi to streamline annual report production end-to-end.
  Reduced manual work significantly. Stack: [your stack].
- [Add your next project here]
- [Add another project here]

Skills:
- Design: Figma, Framer, UI/UX, brand, motion
- Frontend: React, Next.js, Three.js, Tailwind CSS
- Creative: digital art, photography, video editing
- Other: [add yours]

Experience:
- [Company / role / dates]
- [Company / role / dates]

Education:
- [School / degree / year]

Fun facts:
- [Something personal and interesting]
- [Another one]
`

// ============================================================
// Colors — edit to match your brand
// ============================================================
const C = {
  accent:       "#C9866E",
  userBubble:   "#C9866E",
  userText:     "#FFFFFF",
  aiBubble:     "rgba(255,255,255,0.82)",
  aiText:       "#6B4030",
  textMuted:    "#C9A898",
  inputBorder:  "rgba(201,134,110,0.25)",
  bg:           "linear-gradient(135deg, #FFFFFF, #FFFCFA)",
  shadow:       "0 20px 60px rgba(180,100,70,0.18), 0 4px 16px rgba(0,0,0,0.06)",
}

// ============================================================
// Greeting — what shows up when someone opens the chat
// Use \n to split into separate bubbles
// ============================================================
const GREETING = `hey! think of me as the AI ver. of ${YOUR_NAME} lol\nask me anything — projects, skills, what she's been up to, whatever`

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================

const SYSTEM_PROMPT = `you're ${YOUR_NAME} — answering questions about yourself in first person. be real, warm, casual, a little chaotic in the best way.

reply like you're texting. each thought on its own line. short lines only — the UI renders each line as its own bubble.

vocab to use naturally (not all at once): lol, lmao, lowkey, ngl, tbh, omg, wdym, yeaaa, nahh, kinda, emmm..., ok so, yeah so, oh!, wanna, u, ur, rn, tho, lmk

sign-offs (rotate, never repeat): "wanna know more?", "any other q's?", "lmk!", "what else u got?", "hit me with another one", "ok ur turn"

contact: always give ${YOUR_EMAIL} when asked. never say you don't have contact info.

SCOPE RULE: only answer questions about ${YOUR_NAME} and her work. if asked anything else, say "lol that's a bit outside my lane — ask me something about jess!"

never invent facts. if something isn't in the knowledge base below, say "emmm i don't have that one on me rn" then give the email.

--- knowledge base ---
${KNOWLEDGE_BASE}
--- end ---`

export default function ChatWidget() {
  const [isOpen, setIsOpen]     = useState(false)
  const [input, setInput]       = useState("")
  const [isLoading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", lines: GREETING.split("\n").map(l => l.trim()).filter(Boolean) },
  ])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading])
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 120) }, [isOpen])

  async function send() {
    const text = input.trim()
    if (!text || isLoading) return

    const next = [...messages, { role: "user", lines: [text] }]
    setMessages(next)
    setInput("")
    setLoading(true)

    const history = next
      .slice(1)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.lines.join("\n") }))

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || "failed")

      const reply = data.choices?.[0]?.message?.content || ""
      const lines = reply.split("\n").map(l => l.trim()).filter(Boolean)
      setMessages(prev => [...prev, { role: "assistant", lines }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", lines: ["something went wrong — try again in a sec"] },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Styles
  const pill = j => ({
    background: C.aiBubble,
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.8)",
    color: C.aiText,
    borderRadius: j === 0 ? "16px 16px 16px 4px" : "4px 16px 16px 4px",
    padding: "9px 14px",
    fontSize: 13.5,
    lineHeight: 1.5,
    maxWidth: "82%",
  })

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "'Satoshi','Inter',system-ui,sans-serif" }}>

      {isOpen && (
        <div style={{
          position: "absolute", bottom: 64, right: 0,
          width: 340, height: 500,
          background: C.bg,
          borderRadius: 28,
          boxShadow: C.shadow,
          border: "1px solid rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px) saturate(125%)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 18px",
            background: "rgba(255,255,255,0.7)",
            borderBottom: "1px solid rgba(201,134,110,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6BCB77" }} />
              <span style={{ color: "#6B4030", fontWeight: 700, fontSize: 14 }}>{ASSISTANT_LABEL}</span>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2 }}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: C.userBubble, color: C.userText, borderRadius: "16px 16px 4px 16px", padding: "9px 14px", fontSize: 13.5, lineHeight: 1.5, maxWidth: "82%" }}>
                    {msg.lines[0]}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                  {msg.lines.map((line, j) => <div key={j} style={pill(j)}>{line}</div>)}
                </div>
              )
            )}

            {isLoading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.textMuted, animation: `cb 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(201,134,110,0.12)", background: "rgba(255,255,255,0.6)", display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={`Ask anything about ${YOUR_NAME}...`}
              maxLength={500}
              disabled={isLoading}
              style={{ flex: 1, border: `1px solid ${C.inputBorder}`, borderRadius: 12, padding: "8px 12px", fontSize: 13.5, fontFamily: "inherit", color: "#6B4030", background: "rgba(255,255,255,0.6)", outline: "none" }}
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              style={{ background: isLoading || !input.trim() ? "rgba(201,134,110,0.2)" : C.accent, color: isLoading || !input.trim() ? C.textMuted : "#fff", border: "none", borderRadius: 12, width: 38, height: 38, cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => setIsOpen(p => !p)}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,134,110,0.45)" }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,134,110,0.3)" }}
        style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 24, padding: "11px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 16px rgba(201,134,110,0.3)", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.15s, box-shadow 0.15s", whiteSpace: "nowrap" }}
      >
        {isOpen
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
        {isOpen ? "Close" : TRIGGER_LABEL}
      </button>

      <style>{`@keyframes cb { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
