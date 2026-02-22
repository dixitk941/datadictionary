import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { getConnections, getSchemas, getTables, getQualityReport } from '../api/client'
import StageLoader from '../components/StageLoader'

const QUALITY_STAGES = [
  'Connecting to table…',
  'Sampling data…',
  'Checking completeness…',
  'Running quality checks…',
]

export default function QualityPage() {
  const [connections, setConnections] = useState([])
  const [selectedConn, setSelectedConn] = useState('')
  const [schemas, setSchemas] = useState([])
  const [selectedSchema, setSelectedSchema] = useState('')
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getConnections().then((c) => {
      setConnections(c)
      if (c.length) setSelectedConn(c[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedConn) return
    getSchemas(selectedConn).then((s) => {
      setSchemas(s)
      if (s.length) setSelectedSchema(s[0])
    }).catch(() => setSchemas([]))
  }, [selectedConn])

  useEffect(() => {
    if (!selectedConn) return
    getTables(selectedConn, selectedSchema || undefined).then((t) => {
      setTables(t)
      setSelectedTable('')
      setReport(null)
    }).catch(() => setTables([]))
  }, [selectedConn, selectedSchema])

  const runAnalysis = useCallback(async () => {
    if (!selectedTable) return
    setLoading(true)
    setReport(null)
    try {
      const r = await getQualityReport(selectedConn, selectedTable, selectedSchema || undefined)
      setReport(r)
    } catch {
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [selectedConn, selectedTable, selectedSchema])

  const scoreColor = useCallback((v) => {
    if (v >= 90) return 'var(--success)'
    if (v >= 70) return 'var(--warning)'
    return 'var(--danger)'
  }, [])

  return (
    <div>
      <h1 className="page-title">Data Quality Analysis</h1>

      {connections.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <ShieldCheck size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3>No connections</h3>
            <p className="text-muted text-sm">Add a database connection to run quality analysis.</p>
            <Link to="/connections" className="btn btn-primary" style={{ marginTop: 16 }}>Add Connection</Link>
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <>
          <div className="flex gap-4 mb-6" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label">Connection</label>
              <select className="form-select" value={selectedConn} onChange={(e) => setSelectedConn(e.target.value)}>
                {connections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {schemas.length > 0 && (
              <div className="form-group" style={{ minWidth: 160 }}>
                <label className="form-label">Schema</label>
                <select className="form-select" value={selectedSchema} onChange={(e) => setSelectedSchema(e.target.value)}>
                  {schemas.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div className="form-group" style={{ minWidth: 200 }}>
              <label className="form-label">Table</label>
              <select className="form-select" value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
                <option value="">Select a table…</option>
                {tables.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={!selectedTable || loading} style={{ marginBottom: 16 }}>
              <ShieldCheck size={16} /> {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>

          {loading && (
            <div className="card">
              <StageLoader stages={QUALITY_STAGES} />
            </div>
          )}

          {report && !loading && (
            <>
              <div className="stat-grid">
                <div className="stat-box">
                  <div className="stat-value" style={{ color: scoreColor(report.overall_score) }}>
                    {report.overall_score}%
                  </div>
                  <div className="stat-label">Overall Completeness</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{report.row_count.toLocaleString()}</div>
                  <div className="stat-label">Total Rows</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value">{report.columns.length}</div>
                  <div className="stat-label">Columns Analyzed</div>
                </div>
              </div>

              <div className="card">
                <h2 className="card-title" style={{ marginBottom: 16 }}>Column Quality Breakdown</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Completeness</th>
                      <th>Uniqueness</th>
                      <th>Nulls</th>
                      <th>Distinct</th>
                      <th>Statistics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.columns.map((c) => (
                      <tr key={c.column}>
                        <td style={{ fontWeight: 500 }}>{c.column}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="quality-bar-wrap" style={{ width: 80 }}>
                              <div className="quality-bar" style={{ width: `${c.completeness * 100}%`, background: scoreColor(c.completeness * 100) }} />
                            </div>
                            <span className="text-sm">{(c.completeness * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>{(c.uniqueness * 100).toFixed(1)}%</td>
                        <td>{c.null_count.toLocaleString()}</td>
                        <td>{c.distinct_count.toLocaleString()}</td>
                        <td className="text-sm text-muted">
                          {c.stats ? (
                            c.stats.type === 'text_length'
                              ? `len: ${c.stats.min_length}–${c.stats.max_length}`
                              : `min=${c.stats.min} max=${c.stats.max} μ=${c.stats.mean} σ=${c.stats.stddev}`
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
