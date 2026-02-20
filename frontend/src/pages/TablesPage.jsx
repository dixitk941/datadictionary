import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table2, Eye, ChevronRight } from 'lucide-react'
import { getConnections, getSchemas, getTables } from '../api/client'

export default function TablesPage() {
  const [connections, setConnections] = useState([])
  const [selectedConn, setSelectedConn] = useState('')
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getConnections().then((conns) => {
      setConnections(conns)
      if (conns.length > 0) setSelectedConn(conns[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedConn) return
    getSchemas(selectedConn).then((s) => {
      setSchemas(s)
      if (s.length > 0) setSelectedSchema(s[0])
    }).catch(() => setSchemas([]))
  }, [selectedConn])

  useEffect(() => {
    if (!selectedConn) return
    setLoading(true)
    getTables(selectedConn, selectedSchema || undefined)
      .then(setTables)
      .catch(() => setTables([]))
      .finally(() => setLoading(false))
  }, [selectedConn, selectedSchema])

  return (
    <div>
      <h1 className="page-title">Tables & Views</h1>

      {connections.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Table2 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3>No connections</h3>
            <p className="text-muted text-sm">Add a database connection first to browse tables.</p>
            <Link to="/connections" className="btn btn-primary" style={{ marginTop: 16 }}>
              Add Connection
            </Link>
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <>
          <div className="flex gap-4 mb-6">
            <div className="form-group" style={{ minWidth: 220 }}>
              <label className="form-label">Connection</label>
              <select className="form-select" value={selectedConn} onChange={(e) => setSelectedConn(e.target.value)}>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {schemas.length > 0 && (
              <div className="form-group" style={{ minWidth: 180 }}>
                <label className="form-label">Schema</label>
                <select className="form-select" value={selectedSchema} onChange={(e) => setSelectedSchema(e.target.value)}>
                  {schemas.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading && (
            <div className="loading-overlay"><div className="spinner" /></div>
          )}

          {!loading && tables.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <h3>No tables found</h3>
                <p className="text-muted text-sm">This schema contains no tables or views.</p>
              </div>
            </div>
          )}

          {!loading && tables.length > 0 && (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Schema</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => (
                    <tr key={t.name}>
                      <td style={{ fontWeight: 500 }}>
                        <span className="flex items-center gap-2">
                          <Table2 size={15} style={{ color: 'var(--primary-light)' }} />
                          {t.name}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.type === 'table' ? 'badge-success' : 'badge-warning'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="text-muted">{t.schema || '—'}</td>
                      <td>
                        <Link
                          to={`/tables/${selectedConn}/${encodeURIComponent(t.name)}${selectedSchema ? `?schema=${encodeURIComponent(selectedSchema)}` : ''}`}
                          className="btn btn-sm btn-outline"
                        >
                          <Eye size={14} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
