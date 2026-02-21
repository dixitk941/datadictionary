import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, Trash2, MessageSquare, Plus, Database, Table, ChevronDown, History } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sendChatMessage, getConnections, getSchemas, getTables, getTableDetail } from '../api/client'

// Storage keys
const CHATS_STORAGE_KEY = 'dd_chat_history'
const ACTIVE_CHAT_KEY = 'dd_active_chat'

// Helper to generate chat ID
const generateChatId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Load all chats from localStorage
const loadAllChats = () => {
  try {
    const stored = localStorage.getItem(CHATS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save all chats to localStorage
const saveAllChats = (chats) => {
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
}

export default function ChatPage() {
  // Connection/Table selection
  const [connections, setConnections] = useState([])
  const [selectedConnId, setSelectedConnId] = useState('')
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [tableContext, setTableContext] = useState('')

  // Chat state
  const [allChats, setAllChats] = useState({}) // { chatId: { id, connId, schema, table, title, messages, createdAt } }
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

  const bottomRef = useRef(null)

  // Load connections on mount
  useEffect(() => {
    getConnections().then(setConnections).catch(console.error)
    // Load saved chats
    const saved = loadAllChats()
    setAllChats(saved)
    // Restore active chat
    const lastActive = localStorage.getItem(ACTIVE_CHAT_KEY)
    if (lastActive && saved[lastActive]) {
      const chat = saved[lastActive]
      setActiveChatId(lastActive)
      setMessages(chat.messages || [])
      setSelectedConnId(chat.connId || '')
      setSelectedSchema(chat.schema || '')
      setSelectedTable(chat.table || '')
    }
  }, [])

  // Load schemas when connection changes
  useEffect(() => {
    if (selectedConnId) {
      getSchemas(selectedConnId)
        .then(setSchemas)
        .catch(() => setSchemas([]))
    } else {
      setSchemas([])
    }
    setSelectedSchema('')
    setTables([])
    setSelectedTable('')
  }, [selectedConnId])

  // Load tables when schema changes
  useEffect(() => {
    if (selectedConnId && selectedSchema) {
      getTables(selectedConnId, selectedSchema)
        .then(setTables)
        .catch(() => setTables([]))
    } else if (selectedConnId) {
      getTables(selectedConnId)
        .then(setTables)
        .catch(() => setTables([]))
    } else {
      setTables([])
    }
    setSelectedTable('')
  }, [selectedConnId, selectedSchema])

  // Load table context when table is selected
  useEffect(() => {
    if (selectedConnId && selectedTable) {
      getTableDetail(selectedConnId, selectedTable, selectedSchema)
        .then((detail) => {
          const ctx = `Table: ${selectedTable}\nSchema: ${selectedSchema || 'default'}\nColumns: ${detail.columns?.map(c => `${c.name} (${c.type})`).join(', ') || 'N/A'}\nRow Count: ${detail.row_count || 'unknown'}`
          setTableContext(ctx)
        })
        .catch(() => setTableContext(`Table: ${selectedTable}`))
    } else {
      setTableContext('')
    }
  }, [selectedConnId, selectedTable, selectedSchema])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save chat to storage
  const saveChat = useCallback((chatId, chatMessages) => {
    if (!chatId) return
    const updated = { ...allChats }
    const existing = updated[chatId] || {}
    const firstUserMsg = chatMessages.find(m => m.role === 'user')
    updated[chatId] = {
      ...existing,
      id: chatId,
      connId: selectedConnId,
      schema: selectedSchema,
      table: selectedTable,
      title: existing.title || firstUserMsg?.content?.slice(0, 50) || 'New Chat',
      messages: chatMessages,
      updatedAt: Date.now(),
      createdAt: existing.createdAt || Date.now(),
    }
    setAllChats(updated)
    saveAllChats(updated)
  }, [allChats, selectedConnId, selectedSchema, selectedTable])

  // Create new chat
  const createNewChat = () => {
    const newId = generateChatId()
    setActiveChatId(newId)
    setMessages([])
    localStorage.setItem(ACTIVE_CHAT_KEY, newId)
  }

  // Switch to existing chat
  const switchToChat = (chatId) => {
    const chat = allChats[chatId]
    if (chat) {
      setActiveChatId(chatId)
      setMessages(chat.messages || [])
      setSelectedConnId(chat.connId || '')
      setSelectedSchema(chat.schema || '')
      setSelectedTable(chat.table || '')
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId)
    }
  }

  // Delete a chat
  const deleteChat = (chatId, e) => {
    e.stopPropagation()
    const updated = { ...allChats }
    delete updated[chatId]
    setAllChats(updated)
    saveAllChats(updated)
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setMessages([])
      localStorage.removeItem(ACTIVE_CHAT_KEY)
    }
  }

  // Send message
  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Create new chat if none active
    let chatId = activeChatId
    if (!chatId) {
      chatId = generateChatId()
      setActiveChatId(chatId)
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId)
    }

    const userMsg = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    // Build context string
    let context = tableContext
    if (selectedTable) {
      context = `You are answering questions about the "${selectedTable}" table${selectedSchema ? ` in schema "${selectedSchema}"` : ''}.\n${tableContext}`
    }

    try {
      const res = await sendChatMessage(updated, context)
      const newMessages = [...updated, { role: 'assistant', content: res.reply }]
      setMessages(newMessages)
      saveChat(chatId, newMessages)
    } catch (e) {
      const errorMessages = [...updated, { role: 'assistant', content: `Error: ${e.message}` }]
      setMessages(errorMessages)
      saveChat(chatId, errorMessages)
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

  // Get sorted chat list for current table (or all if no table selected)
  const chatList = Object.values(allChats)
    .filter(c => {
      if (!selectedTable) return true
      return c.connId === selectedConnId && c.schema === selectedSchema && c.table === selectedTable
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  const connName = connections.find(c => c.id === selectedConnId)?.name || ''

  return (
    <div className="chat-page-layout">
      {/* History Sidebar */}
      {showHistory && (
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span className="flex items-center gap-2">
              <History size={16} />
              Chat History
            </span>
            <button className="btn btn-sm btn-primary" onClick={createNewChat} title="New Chat">
              <Plus size={14} />
            </button>
          </div>
          <div className="chat-sidebar-list">
            {chatList.length === 0 && (
              <div className="text-muted text-sm" style={{ padding: '12px', textAlign: 'center' }}>
                No chat history yet
              </div>
            )}
            {chatList.map(chat => (
              <div
                key={chat.id}
                className={`chat-history-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => switchToChat(chat.id)}
              >
                <div className="chat-history-title">
                  <MessageSquare size={14} />
                  <span>{chat.title}</span>
                </div>
                <div className="chat-history-meta">
                  {chat.table && <span className="chat-history-table">{chat.table}</span>}
                  <button
                    className="chat-history-delete"
                    onClick={(e) => deleteChat(chat.id, e)}
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-container">
        {/* Header with selectors */}
        <div className="chat-header">
          <div className="chat-header-left">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowHistory(!showHistory)}
              title={showHistory ? 'Hide history' : 'Show history'}
            >
              <History size={16} />
            </button>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              <span className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: 'var(--primary-light)' }} />
                AI Chat
              </span>
            </h1>
          </div>

          {/* Context Selectors */}
          <div className="chat-selectors">
            <div className="selector-group">
              <Database size={14} />
              <select
                value={selectedConnId}
                onChange={(e) => setSelectedConnId(e.target.value)}
                className="chat-select"
              >
                <option value="">Select Connection</option>
                {connections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {schemas.length > 0 && (
              <div className="selector-group">
                <ChevronDown size={14} />
                <select
                  value={selectedSchema}
                  onChange={(e) => setSelectedSchema(e.target.value)}
                  className="chat-select"
                >
                  <option value="">All Schemas</option>
                  {schemas.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {tables.length > 0 && (
              <div className="selector-group">
                <Table size={14} />
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="chat-select"
                >
                  <option value="">All Tables</option>
                  {tables.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <button className="btn btn-sm btn-outline" onClick={createNewChat}>
              <Plus size={14} /> New
            </button>
          )}
        </div>

        {/* Context indicator */}
        {selectedTable && (
          <div className="chat-context-bar">
            Chatting about <strong>{selectedTable}</strong>
            {selectedSchema && <span> in {selectedSchema}</span>}
            {connName && <span> ({connName})</span>}
          </div>
        )}

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <Sparkles size={44} style={{ margin: '0 auto 16px', opacity: 0.15 }} />
              <h3>Ask anything about your data</h3>
              <p className="text-muted text-sm" style={{ maxWidth: 420, margin: '8px auto 0' }}>
                {selectedTable
                  ? `Ask questions specifically about the "${selectedTable}" table.`
                  : 'Select a connection and table above to chat about specific data, or ask general questions about your databases.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                {(selectedTable ? [
                  `What columns are in ${selectedTable}?`,
                  `Describe the primary key`,
                  `What data types are used?`,
                  `Generate sample queries`,
                ] : [
                  'What tables store customer data?',
                  'Explain the data quality score',
                  'How are orders and products related?',
                  'Summarize my database schema',
                ]).map((q) => (
                  <button
                    key={q}
                    className="btn btn-sm btn-outline"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant">
              <div className="spinner" style={{ width: 18, height: 18 }} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTable ? `Ask about ${selectedTable}...` : 'Ask about your data...'}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() || loading}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
