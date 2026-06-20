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
        body { background: #06081a; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.08); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.05); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .msg-in { animation: fadeUp 0.3s ease forwards; }

        .input-field {
          background: transparent;
          border: none;
          outline: none;
          flex: 1;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.5;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.35); }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .send-btn:enabled:hover { transform: scale(1.05); }
        .send-btn:enabled:active { transform: scale(0.97); }

        .suggestion-chip {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          padding: 6px 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .suggestion-chip:hover {
          background: rgba(255,255,255,0.13);
          color: #fff;
          border-color: rgba(255,255,255,0.25);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: '#06081a', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 700, height: 700,
          borderRadius: '50%', top: '-15%', left: '-10%',
          background: 'radial-gradient(circle, rgba(5,55,181,0.45) 0%, transparent 70%)',
          animation: 'float1 12s ease-in-out infinite',
          filter: 'blur(10px)',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%', bottom: '-10%', right: '-5%',
          background: 'radial-gradient(circle, rgba(253,94,205,0.35) 0%, transparent 70%)',
          animation: 'float2 15s ease-in-out infinite',
          filter: 'blur(10px)',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '50%', top: '40%', right: '20%',
          background: 'radial-gradient(circle, rgba(5,55,181,0.2) 0%, transparent 70%)',
          animation: 'float1 9s ease-in-out infinite reverse',
          filter: 'blur(8px)',
        }} />
      </div>

      {/* Page */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
      }}>
        {/* Label */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999, padding: '6px 14px',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: '#4ade80',
              animation: 'pulse 2s ease infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: '0.02em' }}>
              Jess's AI Assistant
            </span>
          </div>
        </div>

        {/* Glass chat card */}
        <div style={{
          width: '100%',
          maxWidth: 560,
          height: 560,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 32px 80px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Messages area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px 12px',
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
                  padding: '10px 15px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  ...(msg.role === 'user' ? {
                    background: '#0537B5',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(5,55,181,0.4)',
                  } : {
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.9)',
                  }),
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="msg-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '13px 18px',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (shown before first message) */}
          {!started && (
            <div style={{
              padding: '0 20px 14px',
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 20px' }} />

          {/* Input row */}
          <div style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
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
                  ? 'rgba(255,255,255,0.08)'
                  : '#0537B5',
                color: isLoading || !input.trim()
                  ? 'rgba(255,255,255,0.3)'
                  : '#fff',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !isLoading && input.trim() ? '0 4px 12px rgba(5,55,181,0.5)' : 'none',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.02em' }}>
          Powered by Gemini — answers based on Jess's knowledge base
        </p>
      </div>
    </>
  )
}
