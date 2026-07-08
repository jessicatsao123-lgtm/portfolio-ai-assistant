import { useState, useRef, useEffect } from 'react'
import jessConfig from '../jess.config.js'

const URL_PATTERN = /(https?:\/\/[^\s]+)/g
const PORTFOLIO_ORIGIN = 'https://jess-tsao-creative.vercel.app'
const CHAT_HISTORY_KEY = 'jess-chat-messages'

// Renders a line of text with any http(s) urls turned into real clickable
// links, so a project mention with its url (see jessConfig.projectLinks)
// is clickable straight through to the case study. A same-site project link
// navigates the whole tab (target="_top" breaks out of this iframe) instead
// of opening a new one, so clicking through feels like following a link on
// the site itself rather than leaving a popup open behind a new tab — the
// chat panel and this conversation's history both persist across that
// navigation (see chat-widget.js on the parent page, which owns that
// persistence — and the postMessage handshake below that reports this
// conversation to it). External links (LinkedIn, etc.) still open in a new
// tab so the visitor doesn't lose their place on the portfolio entirely.
function renderLine(line) {
  return line.split(URL_PATTERN).map((part, i) =>
    part.startsWith('http://') || part.startsWith('https://')
      ? <a
          key={i}
          href={part}
          target={part.startsWith(PORTFOLIO_ORIGIN) ? '_top' : '_blank'}
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >{part}</a>
      : part
  )
}

function loadSavedMessages() {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CHAT_HISTORY_KEY))
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export default function Home() {
  const [messages, setMessages] = useState(() => loadSavedMessages() || [{ role: 'assistant', content: jessConfig.greeting }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [started, setStarted] = useState(() => {
    const saved = loadSavedMessages()
    return !!(saved && saved.length > 1)
  })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Persistence lives on the PARENT page (chat-widget.js), not here.
  // This iframe is a third-party embed from the browser's perspective
  // (different Vercel project/origin — Vercel registers *.vercel.app on
  // the public suffix list specifically so projects can't share storage),
  // and browsers increasingly partition or restrict a third-party iframe's
  // OWN sessionStorage, so relying on it alone for cross-page persistence
  // is fragile. Instead: ask the parent for any saved conversation on
  // mount, restore it if one comes back, and report every change to the
  // parent so it can persist it on ITS (first-party, unrestricted) origin.
  // sessionStorage here is kept only as a same-page fallback for when this
  // is visited standalone, outside any iframe (parent === self, so these
  // postMessage calls are harmless no-ops in that case).
  useEffect(() => {
    function handleParentMessage(e) {
      if (e.origin !== PORTFOLIO_ORIGIN) return
      if (e.data?.type === 'jt-chat-restore' && Array.isArray(e.data.messages) && e.data.messages.length > 0) {
        setMessages(e.data.messages)
        setStarted(e.data.messages.length > 1)
      }
    }
    window.addEventListener('message', handleParentMessage)
    try { window.parent.postMessage({ type: 'jt-chat-ready' }, PORTFOLIO_ORIGIN) } catch {}
    return () => window.removeEventListener('message', handleParentMessage)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)) } catch {}
    try { window.parent.postMessage({ type: 'jt-chat-messages', messages }, PORTFOLIO_ORIGIN) } catch {}
  }, [messages])

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
        { role: 'assistant', content: 'Something went wrong, please try again.' },
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

        html, body {
          height: 100%;
          background: linear-gradient(135deg, #FFFFFF 0%, #FFFCFA 100%);
          overflow: hidden;
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

      {/* Full-height chat, no outer chrome — this page is designed to fill
          whatever iframe/panel it's embedded in without needing a page-level
          scroll to reach the input. */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
      }}>

        {/* Header */}
        <div style={{
          flexShrink: 0,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(210,180,165,0.18)',
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

        {/* Messages */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '20px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {messages.map((msg, i) => {
            const lines = msg.content
              .split('\n')
              .map(l => l.trim())
              .filter(l => l.length > 0)

            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 4,
              }}>
                {lines.map((line, j) => (
                  <div key={j} className="msg-in" style={{
                    animationDelay: `${j * 80}ms`,
                    maxWidth: '78%',
                    padding: '10px 15px',
                    borderRadius: msg.role === 'user'
                      ? '18px 18px 5px 18px'
                      : j === 0
                        ? '18px 18px 18px 5px'
                        : '5px 18px 18px 5px',
                    fontSize: 14,
                    lineHeight: 1.5,
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
                    {renderLine(line)}
                  </div>
                ))}
              </div>
            )
          })}

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
            flexShrink: 0,
            padding: '0 24px 16px',
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {jessConfig.suggestions.map((s) => (
              <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ flexShrink: 0, height: 1, background: 'rgba(210,180,165,0.18)', margin: '0 24px' }} />

        {/* Input row */}
        <div style={{
          flexShrink: 0,
          padding: '16px 24px',
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
    </>
  )
}
