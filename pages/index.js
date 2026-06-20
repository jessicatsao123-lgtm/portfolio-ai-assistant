import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'What projects has she worked on?',
  'What are her skills?',
  'How can I contact her?',
]

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm here to answer questions about Jess — her projects, skills, background, or anything else. What would you like to know?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function sendMessage(text) {
    const trimmed = (text || input).trim()
    if (!trimmed || isLoading) return
    if (!started) setStarted(true)

    const userMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    const history = updatedMessages.slice(1, -1).slice(-6)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.ok ? data.response : (data.error || 'Something went wrong.') },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong — please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: linear-gradient(135deg, #FFFFFF 0%, #FFFCFA 100%);
          min-height: 100vh;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }

        .msg-in { animation: fadeUp 0.28s ease forwards; }

        .input-field {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          color: #6B4030;
          line-height: 1.5;
        }
        .input-field::placeholder { color: #C9A898; }

        .send-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .send-btn:enabled:hover  { transform: scale(1.05); }
        .send-btn:enabled:active { transform: scale(0.97); }

        .chip {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 12.5px;
          font-family: inherit;
          color: #BD8264;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease, color 0.15s ease;
          box-shadow: inset 0 1px 1px rgba(255,255,255,1), 0 2px 8px rgba(210,180,165,0.10);
        }
        .chip:hover { background: rgba(255,255,255,0.90); color: #6B4030; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(180,140,120,0.2); border-radius: 4px; }
      `}</style>

      {/* Layered background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(120% 90% at 10% 6%,  rgba(255,236,218,0.40), transparent 48%),
          radial-gradient(120% 90% at 94% 90%, rgba(253,231,228,0.35), transparent 50%),
          radial-gradient(90%  80% at 84% 16%, rgba(255,248,240,0.50), transparent 44%),
          radial-gradient(100% 90% at 20% 94%, rgba(253,238,236,0.30), transparent 52%),
          linear-gradient(135deg, #FFFFFF 0%, #FFFCFA 100%)
        `,
      }} />

      {/* Page layout */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
      }}>

        {/* Status pill */}
        <div style={{
          marginBottom: 24,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.95)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: 999,
          padding: '7px 18px',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,1), 0 4px 16px rgba(210,180,165,0.12)',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#82D9A0',
            animation: 'pulse 2.2s ease infinite',
          }} />
          <span style={{ color: '#BD8264', fontSize: 12.5, letterSpacing: '0.01em', fontWeight: 500 }}>
            Jess's AI Assistant
          </span>
        </div>

        {/* Glass chat card */}
        <div style={{
          width: '100%',
          maxWidth: 560,
          height: 580,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.62)',
          backdropFilter: 'blur(20px) saturate(125%)',
          WebkitBackdropFilter: 'blur(20px) saturate(125%)',
          border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 16px 44px rgba(210,180,165,0.13), inset 0 1px 1px rgba(255,255,255,1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 28px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {messages.map((msg, i) => (
              <div key={i} className="msg-in" style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '78%',
                  padding: '11px 16px',
                  borderRadius: msg.role === 'user'
                    ? '18px 18px 5px 18px'
                    : '18px 18px 18px 5px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  ...(msg.role === 'user' ? {
                    background: 'linear-gradient(145deg, #FFF3E6, #FFDBCE)',
                    color: '#6B4030',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 16px rgba(210,160,130,0.14), inset 0 1px 1px rgba(255,255,255,1)',
                  } : {
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    color: '#6B4030',
                    boxShadow: '0 2px 10px rgba(210,180,165,0.10), inset 0 1px 1px rgba(255,255,255,1)',
                  }),
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="msg-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  borderRadius: '18px 18px 18px 5px',
                  padding: '14px 18px',
                  display: 'flex', gap: 5, alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(210,180,165,0.10)',
                }}>
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#C9A898',
                      animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {!started && (
            <div style={{
              padding: '0 28px 16px',
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(210,180,165,0.18)', margin: '0 28px' }} />

          {/* Input row */}
          <div style={{
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <input
              ref={inputRef}
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about Jess..."
              maxLength={500}
              disabled={isLoading}
              autoFocus
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              style={{
                background: isLoading || !input.trim()
                  ? 'rgba(255,255,255,0.72)'
                  : 'linear-gradient(145deg, #FFF3E6, #FFDBCE)',
                color: isLoading || !input.trim() ? '#C9A898' : '#8F5E48',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                border: '1px solid rgba(255,255,255,0.95)',
                boxShadow: !isLoading && input.trim()
                  ? '0 4px 14px rgba(210,160,130,0.20), inset 0 1px 1px rgba(255,255,255,1)'
                  : 'inset 0 1px 1px rgba(255,255,255,1)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <p style={{
          marginTop: 18,
          color: '#C9A898',
          fontSize: 11.5,
          letterSpacing: '0.02em',
        }}>
          Powered by Groq — answers based on Jess's knowledge base
        </p>
      </div>
    </>
  )
}
