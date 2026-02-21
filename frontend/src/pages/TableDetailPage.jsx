import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Key, Link as LinkIcon, Sparkles, ShieldCheck, BarChart3 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getTableDetail, getQualityReport, getAISummary } from '../api/client'

export default function TableDetailPage() {
  const { connId, table } = useParams()
  const [searchParams] = useSearchParams()
  const schema = searchParams.get('schema') || undefined

  const [tab, setTab] = useState('columns')
  const [meta, setMeta] = useState(null)
  const [quality, setQuality] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTableDetail(connId, table, schema),
      getQualityReport(connId, table, schema),
    ])
      .then(([m, q]) => {
        setMeta(m)
        setQuality(q)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [connId, table, schema])

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    try {
      const res = await getAISummary(connId, table, schema)
      setSummary(res.summary)
      setTab('ai')
    } catch (e) {
      setSummary('Error generating summary: ' + e.message)
    } finally {
      setSummaryLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>
  }

  const qualityColor = (score) => {
    if (score >= 90) return 'var(--success)'
    if (score >= 70) return 'var(--warning)'
    return 'var(--danger)'
  }

  return (
    <div>
      <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>{decodeURIComponent(table)}</h1>
          <p className="text-muted text-sm">
            {schema && `Schema: ${schema} · `}
            {meta?.row_count?.toLocaleString() || 0} rows · {meta?.columns?.length || 0} columns
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerateSummary} disabled={summaryLoading}>
          <Sparkles size={16} />
          {summaryLoading ? 'Generating...' : 'AI Summary'}
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{meta?.columns?.length || 0}</div>
          <div className="stat-label">Columns</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{meta?.row_count?.toLocaleString() || 0}</div>
          <div className="stat-label">Rows</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{meta?.relationships?.length || 0}</div>
          <div className="stat-label">Foreign Keys</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: qualityColor(quality?.overall_score || 0) }}>
            {quality?.overall_score ?? '—'}%
          </div>
          <div className="stat-label">Quality Score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'columns', label: 'Columns' },
          { id: 'quality', label: 'Quality' },
          { id: 'relationships', label: 'Relationships' },
          { id: 'indexes', label: 'Indexes' },
          { id: 'ai', label: 'AI Summary' },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Columns */}
      {tab === 'columns' && meta && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Nullable</th>
                <th>PK</th>
                <th>Default</th>
              </tr>
            </thead>
            <tbody>
              {meta.columns.map((c) => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 500 }}>
                    <span className="flex items-center gap-2">
                      {c.primary_key && <Key size={13} style={{ color: 'var(--warning)' }} />}
                      {c.name}
                    </span>
                  </td>
                  <td><code style={{ fontSize: '0.8rem' }}>{c.type}</code></td>
                  <td>{c.nullable ? 'Yes' : 'No'}</td>
                  <td>{c.primary_key ? <span className="badge badge-warning">PK</span> : '—'}</td>
                  <td className="text-muted">{c.default || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Quality */}
      {tab === 'quality' && quality && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Completeness</th>
                <th>Uniqueness</th>
                <th>Nulls</th>
                <th>Distinct</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {quality.columns.map((c) => (
                <tr key={c.column}>
                  <td style={{ fontWeight: 500 }}>{c.column}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="quality-bar-wrap" style={{ width: 80 }}>
                        <div
                          className="quality-bar"
                          style={{
                            width: `${c.completeness * 100}%`,
                            background: qualityColor(c.completeness * 100),
                          }}
                        />
                      </div>
                      <span className="text-sm">{(c.completeness * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{(c.uniqueness * 100).toFixed(1)}%</td>
                  <td>{c.null_count.toLocaleString()}</td>
                  <td>{c.distinct_count.toLocaleString()}</td>
                  <td className="text-sm text-muted">
                    {c.stats ? (
                      c.stats.type === 'text_length' ? (
                        `len: ${c.stats.min_length}–${c.stats.max_length} (avg ${c.stats.avg_length})`
                      ) : (
                        `μ=${c.stats.mean} σ=${c.stats.stddev}`
                      )
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Relationships */}
      {tab === 'relationships' && meta && (
        <div className="card">
          {meta.relationships.length === 0 ? (
            <div className="empty-state">
              <LinkIcon size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <h3>No foreign keys</h3>
              <p className="text-muted text-sm">This table has no foreign key constraints.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Columns</th>
                  <th>References</th>
                </tr>
              </thead>
              <tbody>
                {meta.relationships.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name || '—'}</td>
                    <td>{r.constrained_columns.join(', ')}</td>
                    <td>
                      {r.referred_schema ? `${r.referred_schema}.` : ''}{r.referred_table}
                      ({r.referred_columns.join(', ')})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Indexes */}
      {tab === 'indexes' && meta && (
        <div className="card">
          {meta.indexes.length === 0 ? (
            <div className="empty-state">
              <BarChart3 size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <h3>No indexes</h3>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Columns</th>
                  <th>Unique</th>
                </tr>
              </thead>
              <tbody>
                {meta.indexes.map((idx, i) => (
                  <tr key={i}>
                    <td>{idx.name || '—'}</td>
                    <td>{idx.columns.join(', ')}</td>
                    <td>{idx.unique ? <span className="badge badge-success">Unique</span> : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: AI Summary */}
      {tab === 'ai' && (
        <div className="card">
          {summary ? (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="empty-state">
              <Sparkles size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <h3>No AI summary yet</h3>
              <p className="text-muted text-sm">Click "AI Summary" to generate a business-friendly description.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
