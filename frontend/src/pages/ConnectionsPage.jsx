import { useEffect, useState, useCallback } from 'react'
import { Trash2, Plus, Database } from 'lucide-react'
import { getConnections, createConnection, deleteConnection } from '../api/client'

const DB_TYPES = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlserver', label: 'SQL Server' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'sqlite', label: 'SQLite' },
]

const EMPTY_FORM = {
  db_type: 'postgresql',
  name: '',
  host: '',
  port: '',
  database: '',
  user: '',
  password: '',
  account: '',
  warehouse: '',
  schema_name: '',
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => getConnections().then(setConnections).catch(() => {}), [])

  useEffect(() => { load() }, [load])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (payload.port) payload.port = parseInt(payload.port, 10)
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k]
      })
      await createConnection(payload)
      setForm({ ...EMPTY_FORM })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [form, load])

  const handleDelete = useCallback(async (id) => {
    // Optimistic remove — UI updates instantly, rolls back on error
    setConnections((prev) => prev.filter((c) => c.id !== id))
    try {
      await deleteConnection(id)
    } catch {
      load() // restore on failure
    }
  }, [load])

  const handleFormChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const toggleForm = useCallback(() => setShowForm((v) => !v), [])

  const isSnowflake = form.db_type === 'snowflake'
  const isSqlite = form.db_type === 'sqlite'

  return (
    <div>
      <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Database Connections</h1>
        <button className="btn btn-primary" onClick={toggleForm}>
          <Plus size={16} /> New Connection
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="card-title">Add Connection</h2>
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Database Type</label>
                <select
                  className="form-select"
                  value={form.db_type}
                  onChange={(e) => setForm({ ...form, db_type: e.target.value })}
                >
                  {DB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Connection Name</label>
                <input
                  className="form-input"
                  placeholder="My Production DB"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {isSnowflake && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Account</label>
                  <input className="form-input" placeholder="xy12345.us-east-1" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse</label>
                  <input className="form-input" placeholder="COMPUTE_WH" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} />
                </div>
              </div>
            )}

            {!isSqlite && !isSnowflake && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Host</label>
                  <input className="form-input" placeholder="localhost" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Port</label>
                  <input className="form-input" placeholder={form.db_type === 'sqlserver' ? '1433' : '5432'} value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{isSqlite ? 'Database File Path' : 'Database'}</label>
                <input className="form-input" placeholder={isSqlite ? '/path/to/db.sqlite' : 'mydb'} value={form.database} onChange={(e) => setForm({ ...form, database: e.target.value })} required />
              </div>
              {!isSqlite && (
                <div className="form-group">
                  <label className="form-label">Schema</label>
                  <input className="form-input" placeholder="public" value={form.schema_name} onChange={(e) => setForm({ ...form, schema_name: e.target.value })} />
                </div>
              )}
            </div>

            {!isSqlite && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">User</label>
                  <input className="form-input" placeholder="username" value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>
            )}

            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {connections.length === 0 && !showForm && (
        <div className="card">
          <div className="empty-state">
            <Database size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3>No connections configured</h3>
            <p className="text-muted text-sm">Click "New Connection" to connect to a database.</p>
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td><span className="badge badge-info">{c.db_type}</span></td>
                  <td>
                    <span className="flex items-center gap-2">
                      <span className="status-dot connected" />
                      Connected
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
