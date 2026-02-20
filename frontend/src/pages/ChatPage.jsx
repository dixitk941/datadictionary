import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { sendChatMessage } from '../api/client'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await sendChatMessage(updated)
      setMessages([...updated, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setMessages([
        ...updated,
        { role: 'assistant', content: `Error: ${e.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-container">
      <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          <span className="flex items-center gap-2">
            <Sparkles size={22} style={{ color: 'var(--primary-light)' }} />
            AI Data Assistant
          </span>
        </h1>
        {messages.length > 0 && (
          <button className="btn btn-sm btn-outline" onClick={() => setMessages([])}>
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <Sparkles size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <h3>Ask anything about your data</h3>
            <p className="text-muted text-sm" style={{ maxWidth: 420, margin: '8px auto 0' }}>
              I can help you understand your database schemas, explain table relationships,
              interpret data quality metrics, and generate business-friendly documentation.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              {[
                'What tables store customer data?',
                'Explain the data quality score',
                'How are orders and products related?',
                'Summarize the users table',
              ].map((q) => (
                <button
                  key={q}
                  className="btn btn-sm btn-outline"
                  onClick={() => { setInput(q) }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant">
            <div className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your data..."
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || loading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
