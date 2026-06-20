// ============================================================
// Portfolio AI Chat Widget
// Paste this entire file into Framer: Assets > Code > New File
// Then drag the component onto any page.
//
// BEFORE YOU USE: Update API_URL below to your Vercel deployment URL.
// ============================================================

import { useState, useRef, useEffect } from "react"

// --- UPDATE THIS to your deployed Vercel URL ---
const API_URL = "https://your-project.vercel.app/api/chat"

// --- UPDATE THIS to your name (shown in the chat header) ---
const ASSISTANT_NAME = "Jess's AI"

// --- Colors — edit to match your brand ---
const COLORS = {
  accent: "#0537B5",       // electric blue — primary color
  accentHover: "#042d8f",  // darker blue for hover
  background: "#F8F7F4",   // off-white
  surface: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#6B6B6B",
  userBubble: "#0537B5",
  userText: "#FFFFFF",
  assistantBubble: "#F0EFEC",
  assistantText: "#1A1A1A",
  inputBorder: "#E0DFDC",
  highlight: "#FD5ECD",    // hot pink — used sparingly
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm here to answer questions about Jess — her projects, skills, background, or anything else. What would you like to know?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage = { role: "user", content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    // Build history for the API (exclude the initial greeting)
    const history = updatedMessages
      .slice(1) // skip the initial assistant greeting
      .slice(-6) // last 6 messages for context
      .map(({ role, content }) => ({ role, content }))

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: history.slice(0, -1), // exclude the message we just added
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Request failed")
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong — please try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            width: 340,
            height: 480,
            backgroundColor: COLORS.background,
            borderRadius: 20,
            boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: COLORS.accent,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                }}
              />
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Cabinet Grotesk', 'Satoshi', system-ui, sans-serif",
                  letterSpacing: "-0.01em",
                }}
              >
                {ASSISTANT_NAME}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                padding: 4,
                lineHeight: 1,
                fontSize: 18,
              }}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    backgroundColor:
                      msg.role === "user"
                        ? COLORS.userBubble
                        : COLORS.assistantBubble,
                    color:
                      msg.role === "user"
                        ? COLORS.userText
                        : COLORS.assistantText,
                    borderRadius: msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    padding: "9px 13px",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: COLORS.assistantBubble,
                    borderRadius: "16px 16px 16px 4px",
                    padding: "10px 14px",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: COLORS.textMuted,
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${COLORS.inputBorder}`,
              display: "flex",
              gap: 8,
              backgroundColor: COLORS.surface,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Jess..."
              maxLength={500}
              disabled={isLoading}
              style={{
                flex: 1,
                border: `1px solid ${COLORS.inputBorder}`,
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13.5,
                fontFamily: "inherit",
                color: COLORS.text,
                backgroundColor: COLORS.background,
                outline: "none",
                resize: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor:
                  isLoading || !input.trim()
                    ? COLORS.inputBorder
                    : COLORS.accent,
                color:
                  isLoading || !input.trim() ? COLORS.textMuted : "#FFFFFF",
                border: "none",
                borderRadius: 12,
                width: 38,
                height: 38,
                cursor:
                  isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background-color 0.15s ease",
              }}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          backgroundColor: COLORS.accent,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 24,
          padding: "10px 18px",
          cursor: "pointer",
          fontFamily: "'Cabinet Grotesk', 'Satoshi', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "-0.01em",
          boxShadow: "0 4px 16px rgba(5, 55, 181, 0.35)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(5, 55, 181, 0.45)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(5, 55, 181, 0.35)"
        }}
        aria-label={isOpen ? "Close chat" : "Ask Jess's AI"}
      >
        {isOpen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isOpen ? "Close" : "Ask Jess"}
      </button>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
