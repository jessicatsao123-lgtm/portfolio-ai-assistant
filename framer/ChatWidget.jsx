// ============================================================
// Portfolio AI Chat Widget — Framer Embed
// ============================================================
// HOW TO ADD TO FRAMER:
//   1. Open your Framer project
//   2. Left sidebar → Assets → Code → "+ New file"
//   3. Name it "ChatWidget"
//   4. Paste this entire file
//   5. Update API_URL below to your Vercel URL
//   6. Drag the "ChatWidget" component onto any page
//      (it floats bottom-right automatically)
// ============================================================

import { useState, useRef, useEffect } from "react"

// --- REQUIRED: paste your Vercel URL here ---
const API_URL = "https://portfolio-ai-assistant-five.vercel.app/api/chat"

// --- Edit to match your name / brand ---
const ASSISTANT_NAME = "Jess's AI"
const TRIGGER_LABEL = "Ask Jess"

// --- Warm glassmorphic brand colors ---
const C = {
  bg: "linear-gradient(135deg, #FFFFFF, #FFFCFA)",
  glass: "rgba(255,255,255,0.82)",
  accent: "#C9866E",
  accentDeep: "#A8624E",
  userBubble: "#C9866E",
  userText: "#FFFFFF",
  aiBubble: "rgba(255,255,255,0.72)",
  aiText: "#6B4030",
  textMuted: "#C9A898",
  border: "rgba(255,255,255,0.9)",
  inputBg: "rgba(255,255,255,0.6)",
  shadow: "0 20px 60px rgba(180,100,70,0.18), 0 4px 16px rgba(0,0,0,0.06)",
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      lines: [
        "hey! think of me as the AI ver. of jess lol",
        "ask me anything — projects, skills, what she's been up to, whatever",
      ],
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 120)
  }, [isOpen])

  async function send() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const allMessages = [...messages, { role: "user", lines: [trimmed] }]
    setMessages(allMessages)
    setInput("")
    setIsLoading(true)

    const history = allMessages
      .slice(1, -1)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.lines.join("\n") }))

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, mode: "jess" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "failed")
      const lines = data.response
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
      setMessages((prev) => [...prev, { role: "assistant", lines }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", lines: ["something went wrong — try again in a sec"] },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: 64,
          right: 0,
          width: 340,
          height: 500,
          background: C.bg,
          borderRadius: 28,
          boxShadow: C.shadow,
          border: `1px solid ${C.border}`,
          backdropFilter: "blur(20px) saturate(125%)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 18px",
            background: "rgba(255,255,255,0.7)",
            borderBottom: `1px solid rgba(201,134,110,0.15)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6BCB77" }} />
              <span style={{ color: "#6B4030", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
                {ASSISTANT_NAME}
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: "none", border: "none", color: C.textMuted,
              cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2,
            }}>×</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "14px 14px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    background: C.userBubble, color: C.userText,
                    borderRadius: "16px 16px 4px 16px",
                    padding: "9px 14px", fontSize: 13.5, lineHeight: 1.5,
                    maxWidth: "82%",
                  }}>{msg.lines[0]}</div>
                </div>
              ) : (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                  {msg.lines.map((line, j) => (
                    <div key={j} style={{
                      background: C.aiBubble,
                      backdropFilter: "blur(8px)",
                      border: `1px solid rgba(255,255,255,0.8)`,
                      color: C.aiText,
                      borderRadius: j === 0
                        ? "16px 16px 16px 4px"
                        : "4px 16px 16px 4px",
                      padding: "9px 14px", fontSize: 13.5, lineHeight: 1.5,
                      maxWidth: "82%",
                      animationDelay: `${j * 80}ms`,
                    }}>{line}</div>
                  ))}
                </div>
              )
            )}

            {isLoading && (
              <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: C.textMuted,
                    animation: `chatbounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "10px 12px",
            borderTop: `1px solid rgba(201,134,110,0.12)`,
            background: "rgba(255,255,255,0.6)",
            display: "flex", gap: 8,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything about Jess..."
              maxLength={500}
              disabled={isLoading}
              style={{
                flex: 1, border: `1px solid rgba(201,134,110,0.25)`,
                borderRadius: 12, padding: "8px 12px",
                fontSize: 13.5, fontFamily: "inherit",
                color: "#6B4030", background: C.inputBg,
                outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim() ? "rgba(201,134,110,0.2)" : C.accent,
                color: isLoading || !input.trim() ? C.textMuted : "#fff",
                border: "none", borderRadius: 12,
                width: 38, height: 38, cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating pill button */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,134,110,0.45)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,134,110,0.3)"
        }}
        style={{
          background: C.accent, color: "#fff", border: "none",
          borderRadius: 24, padding: "11px 20px",
          cursor: "pointer", fontWeight: 700, fontSize: 14,
          letterSpacing: "-0.01em",
          boxShadow: "0 4px 16px rgba(201,134,110,0.3)",
          display: "flex", alignItems: "center", gap: 8,
          transition: "transform 0.15s, box-shadow 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {isOpen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {isOpen ? "Close" : TRIGGER_LABEL}
      </button>

      <style>{`
        @keyframes chatbounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
