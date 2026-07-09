// ============================================================
// Portfolio AI Chat Widget — Framer Embed
// ============================================================
// SETUP:
//   1. Deploy this repo to Vercel and add your env vars there
//   2. Paste your Vercel URL into API_URL below
//   3. In Framer: Assets → Code → "+ New file" → paste → Save
//      Then drag "ChatWidget" onto any page
// ============================================================

import { useState, useRef, useEffect } from "react"

// ============================================================
// YOUR VERCEL URL
// ============================================================
const API_URL = "https://portfolio-ai-assistant-five.vercel.app/api/chat"

// ============================================================
// YOUR DETAILS
// ============================================================
const YOUR_NAME       = "Jess"
const TRIGGER_LABEL   = "Ask Jess"
const ASSISTANT_LABEL = "Jess's AI"

// ============================================================
// Colors — edit to match your brand
// ============================================================
const C = {
  accent:      "#C9866E",
  userBubble:  "#C9866E",
  userText:    "#FFFFFF",
  aiBubble:    "rgba(255,255,255,0.82)",
  aiText:      "#6B4030",
  textMuted:   "#C9A898",
  inputBorder: "rgba(201,134,110,0.25)",
  bg:          "linear-gradient(135deg, #FFFFFF, #FFFCFA)",
  shadow:      "0 20px 60px rgba(180,100,70,0.18), 0 4px 16px rgba(0,0,0,0.06)",
}

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================

const GREETING = `hey! think of me as the AI ver. of ${YOUR_NAME} lol\nask me anything: projects, skills, what she's been up to, whatever`

function toLines(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean)
}

const URL_PATTERN = /(https?:\/\/[^\s]+)/g
// Set this to your site's own domain so project links navigate in the same
// tab (feels like following a link on the site) while external links
// (LinkedIn, etc.) still open in a new one.
const SITE_ORIGIN = "https://jess-tsao-creative.vercel.app"
const CHAT_HISTORY_KEY = "jess-chat-messages"
const CHAT_OPEN_KEY = "jess-chat-open"

// Renders a line of text with any http(s) urls turned into real clickable
// links, so a project mention with its url (see jessConfig.projectLinks)
// is clickable straight through to the case study. Same-site links use the
// default same-tab navigation so history/session state (see below) carries
// across; external links open in a new tab so the visitor doesn't lose
// their place on the portfolio entirely.
const ARROW_LINK = /([^\n]*?)\s*->\s*(https?:\/\/[^\s]+)/

// "Name -> https://..." becomes a link on "Name" instead of showing the
// full url a second time — see the matching fix + comment in pages/index.js
// for why this notation leaks into the model's own output.
function renderLine(line) {
  const arrowMatch = line.match(ARROW_LINK)
  if (arrowMatch) {
    const [full, label, url] = arrowMatch
    const before = line.slice(0, arrowMatch.index)
    const after = line.slice(arrowMatch.index + full.length)
    return [
      before,
      <a
        key="arrow-link"
        href={url}
        target={url.startsWith(SITE_ORIGIN) ? "_self" : "_blank"}
        rel="noopener noreferrer"
        style={{ color: "inherit", textDecoration: "underline" }}
      >{label.trim() || url}</a>,
      ...renderLine(after),
    ]
  }
  return line.split(URL_PATTERN).map((part, i) =>
    part.startsWith("http://") || part.startsWith("https://")
      ? <a
          key={i}
          href={part}
          target={part.startsWith(SITE_ORIGIN) ? "_self" : "_blank"}
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}
        >{part}</a>
      : part
  )
}

function loadSaved(key) {
  if (typeof window === "undefined") return null
  try { return JSON.parse(window.sessionStorage.getItem(key)) } catch { return null }
}

export default function ChatWidget() {
  const [isOpen, setIsOpenState] = useState(() => loadSaved(CHAT_OPEN_KEY) === true)
  const [input, setInput]       = useState("")
  const [isLoading, setLoading] = useState(false)

  const [messages, setMessages] = useState(() => {
    const saved = loadSaved(CHAT_HISTORY_KEY)
    return Array.isArray(saved) && saved.length > 0 ? saved : [{ role: "assistant", lines: toLines(GREETING) }]
  })

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // A same-tab navigation to a project link reloads this component fresh on
  // the destination page — sessionStorage survives that (scoped to this
  // browser tab + site, not to any one page), so both the open/closed state
  // and the full conversation pick back up where they left off.
  function setIsOpen(v) {
    setIsOpenState(v)
    if (typeof window !== "undefined") { try { window.sessionStorage.setItem(CHAT_OPEN_KEY, JSON.stringify(v)) } catch {} }
  }
  useEffect(() => {
    if (typeof window === "undefined") return
    try { window.sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

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
      .slice(1, -1)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.lines.join("\n") }))

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "failed")
      const lines = data.response.split("\n").map(l => l.trim()).filter(Boolean)
      setMessages(prev => [...prev, { role: "assistant", lines }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", lines: ["something went wrong, try again in a sec"] },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  const bubbleStyle = j => ({
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
          background: C.bg, borderRadius: 28,
          boxShadow: C.shadow,
          border: "1px solid rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px) saturate(125%)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.7)", borderBottom: "1px solid rgba(201,134,110,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6BCB77" }} />
              <span style={{ color: "#6B4030", fontWeight: 700, fontSize: 14 }}>{ASSISTANT_LABEL}</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: C.userBubble, color: C.userText, borderRadius: "16px 16px 4px 16px", padding: "9px 14px", fontSize: 13.5, lineHeight: 1.5, maxWidth: "82%" }}>
                    {msg.lines[0]}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                  {msg.lines.map((line, j) => <div key={j} style={bubbleStyle(j)}>{renderLine(line)}</div>)}
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
        onClick={() => setIsOpen(!isOpen)}
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
