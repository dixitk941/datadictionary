import { useEffect, useState, useMemo, useCallback, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { Table2, Eye, Search } from 'lucide-react'
import { getConnections, getSchemas, getTables } from '../api/client'
import StageLoader from '../components/StageLoader'

const TABLE_STAGES = [
  'Connecting to database…',
  'Fetching schema info…',
  'Loading tables…',
  'Organizing results…',
]

export default function TablesPage() {
  const [connections, setConnections] = useState([])
  const [selectedConn, setSelectedConn] = useState('')
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [isPending, startTransition] = useTransition()

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
    setSearch('')
    setInputVal('')
    getTables(selectedConn, selectedSchema || undefined)
      .then(setTables)
      .catch(() => setTables([]))
      .finally(() => setLoading(false))
  }, [selectedConn, selectedSchema])

  const handleConnChange = useCallback((e) => setSelectedConn(e.target.value), [])
  const handleSchemaChange = useCallback((e) => setSelectedSchema(e.target.value), [])
  const handleSearch = useCallback((e) => {
    const val = e.target.value
    setInputVal(val)                          // instant — keeps input responsive
    startTransition(() => setSearch(val))     // deferred — won’t block typing
  }, [startTransition])

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tables
    return tables.filter((t) => t.name.toLowerCase().includes(q) || (t.schema && t.schema.toLowerCase().includes(q)))
  }, [tables, search])

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
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label className="form-label">Connection</label>
              <select className="form-select" value={selectedConn} onChange={handleConnChange}>
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {schemas.length > 0 && (
              <div className="form-group" style={{ minWidth: 180 }}>
                <label className="form-label">Schema</label>
                <select className="form-select" value={selectedSchema} onChange={handleSchemaChange}>
                  {schemas.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {tables.length > 0 && (
              <div className="form-group" style={{ minWidth: 220, marginLeft: 'auto' }}>
                <label className="form-label">Search</label>
                <div className="input-with-icon">
                  <Search size={16} />
                  <input
                    className="form-input"
                    placeholder="Filter tables…"
                    value={inputVal}
                    onChange={handleSearch}
                  />
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="card">
              <StageLoader stages={TABLE_STAGES} />
            </div>
          )}

          {!loading && filteredTables.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <h3>{search ? 'No matching tables' : 'No tables found'}</h3>
                <p className="text-muted text-sm">{search ? `No tables match "${search}"` : 'This schema contains no tables or views.'}</p>
              </div>
            </div>
          )}

          {!loading && filteredTables.length > 0 && (
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
                  {filteredTables.map((t) => (
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
