import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Network, ArrowRightLeft, BarChart3, Workflow, Lightbulb,
  RefreshCw, Database, Play, Trash2, Plus, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Zap, ArrowRight, Code2, Settings2, ToggleLeft, ToggleRight
} from 'lucide-react'
import {
  getConnections, discoverSystems, crossMapConnections,
  listPipelines, createPipeline, runPipeline, deletePipeline,
  listWorkflows, createWorkflow, runWorkflow, toggleWorkflow, deleteWorkflow,
  getBusinessInsights, getTables
} from '../api/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Treemap
} from 'recharts'

const TABS = [
  { id: 'discover', icon: Building2, label: 'System Discovery' },
  { id: 'connect', icon: Network, label: 'Cross-DB Mapping' },
  { id: 'etl', icon: ArrowRightLeft, label: 'Data Pipelines' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'workflows', icon: Workflow, label: 'Workflows' },
  { id: 'insights', icon: Lightbulb, label: 'Business Insights' },
]

const CHART_COLORS = ['#1a7f56', '#2d9e6e', '#3bb87f', '#6fd4a1', '#a8e6c3', '#0967d2', '#8b5cf6', '#e5930a']
const tooltipStyle = { backgroundColor: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 10, color: 'var(--tooltip-text)', fontSize: 13, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10a37f' }
const CATEGORY_ICONS = {
  Revenue: '💰', Operations: '⚙️', Customer: '👥',
  Risk: '⚠️', Growth: '📈', Efficiency: '🚀', General: '📊'
}

export default function EnterprisePage() {
  const [activeTab, setActiveTab] = useState('discover')
  const [connections, setConnections] = useState([])
  const [selectedConn, setSelectedConn] = useState(null)

  useEffect(() => {
    getConnections().then((conns) => {
      setConnections(conns)
      if (conns.length > 0) setSelectedConn(conns[0])
    }).catch(() => {})
  }, [])

  return (
    <div className="ent-page">
      <div className="ent-header">
        <div>
          <h1 className="page-title">
            <Building2 size={22} style={{ color: 'var(--accent)' }} /> Enterprise Hub
          </h1>
          <p className="text-muted text-sm" style={{ marginTop: -18 }}>
            System discovery, data integration, pipelines &amp; insights
          </p>
        </div>
        {connections.length > 0 && (
          <select
            className="dash-select"
            value={selectedConn?.id || ''}
            onChange={(e) => setSelectedConn(connections.find(c => c.id === e.target.value))}
          >
            {connections.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>
            ))}
          </select>
        )}
      </div>

      {/* Tab Bar */}
      <div className="ent-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ent-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* No connections */}
      {connections.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Database size={44} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3>No Connections Yet</h3>
            <p className="text-muted text-sm">Connect a database to start exploring enterprise features.</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {connections.length > 0 && selectedConn && (
        <div className="ent-content">
          {activeTab === 'discover' && <DiscoverTab connId={selectedConn.id} connName={selectedConn.name} />}
          {activeTab === 'connect' && <CrossMapTab />}
          {activeTab === 'etl' && <PipelinesTab connections={connections} selectedConn={selectedConn} />}
          {activeTab === 'analytics' && <AnalyticsTab connections={connections} selectedConn={selectedConn} />}
          {activeTab === 'workflows' && <WorkflowsTab connections={connections} selectedConn={selectedConn} />}
          {activeTab === 'insights' && <InsightsTab connId={selectedConn.id} connName={selectedConn.name} />}
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   1. SYSTEM DISCOVERY TAB
   ═══════════════════════════════════════════════════ */
function DiscoverTab({ connId, connName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    discoverSystems(connId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [connId])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingState text="Scanning database systems..." />
  if (!data) return <ErrorState onRetry={load} />

  const treemapData = data.systems.filter(s => s.tables > 0).map((s, i) => ({
    name: s.name, size: s.tables, fill: s.color || CHART_COLORS[i % CHART_COLORS.length]
  }))

  return (
    <div>
      {/* Stats Bar */}
      <div className="ent-stat-row">
        <div className="ent-mini-stat">
          <span className="ent-mini-val">{data.total_tables}</span>
          <span className="ent-mini-label">Tables</span>
        </div>
        <div className="ent-mini-stat">
          <span className="ent-mini-val">{data.total_views}</span>
          <span className="ent-mini-label">Views</span>
        </div>
        <div className="ent-mini-stat">
          <span className="ent-mini-val">{data.systems.length}</span>
          <span className="ent-mini-label">Systems Found</span>
        </div>
      </div>

      {/* System Map (Treemap) */}
      {treemapData.length > 0 && (
        <div className="card mb-6">
          <h3 className="card-title" style={{ marginBottom: 16 }}>System Map — {connName}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              stroke="var(--border)"
              content={({ x, y, width, height, name, fill }) => (
                width > 50 && height > 30 ? (
                  <g>
                    <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} opacity={0.85} />
                    <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={600}>{name}</text>
                    <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>
                      {treemapData.find(d => d.name === name)?.size} tables
                    </text>
                  </g>
                ) : (
                  <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} opacity={0.7} />
                )
              )}
            />
          </ResponsiveContainer>
        </div>
      )}

      {/* System Cards */}
      <div className="ent-system-grid">
        {data.systems.map(sys => (
          <div key={sys.name} className="card ent-system-card" onClick={() => setExpanded(expanded === sys.name ? null : sys.name)}>
            <div className="ent-system-header">
              <div className="ent-system-dot" style={{ background: sys.color }} />
              <div>
                <h4 className="ent-system-name">{sys.name}</h4>
                <p className="text-muted text-sm">{sys.description}</p>
              </div>
              <ChevronRight size={16} className={`ent-chevron ${expanded === sys.name ? 'open' : ''}`} />
            </div>
            <div className="ent-system-stats">
              <span>{sys.tables} tables</span>
              <span>{sys.total_columns} columns</span>
              <span>{sys.total_rows.toLocaleString()} rows</span>
            </div>
            {expanded === sys.name && (
              <div className="ent-system-tables">
                {sys.table_list.map(t => (
                  <span key={t} className="badge badge-info">{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   2. CROSS-DB MAPPING TAB
   ═══════════════════════════════════════════════════ */
function CrossMapTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    crossMapConnections()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingState text="Analyzing cross-database relationships..." />
  if (!data) return <ErrorState onRetry={load} />

  return (
    <div>
      <div className="ent-stat-row">
        <div className="ent-mini-stat">
          <span className="ent-mini-val">{data.connections?.length || 0}</span>
          <span className="ent-mini-label">Connections</span>
        </div>
        <div className="ent-mini-stat">
          <span className="ent-mini-val">{data.total_found || 0}</span>
          <span className="ent-mini-label">Mappings Found</span>
        </div>
      </div>

      {data.message && (
        <div className="card">
          <div className="empty-state">
            <Network size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p className="text-muted">{data.message}</p>
          </div>
        </div>
      )}

      {data.mappings?.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Discovered Relationships</h3>
          <div className="ent-mapping-list">
            {data.mappings.map((m, i) => (
              <div key={i} className="ent-mapping-item">
                <div className="ent-mapping-pair">
                  <div className="ent-mapping-node">
                    <Database size={14} />
                    <span className="ent-mapping-db">{m.source_db}</span>
                    <span className="badge badge-info">{m.source_table}</span>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div className="ent-mapping-node">
                    <Database size={14} />
                    <span className="ent-mapping-db">{m.target_db}</span>
                    <span className="badge badge-info">{m.target_table}</span>
                  </div>
                </div>
                <div className="ent-mapping-cols">
                  <span className="text-muted text-sm">Shared:</span>
                  {m.shared_columns.map(c => (
                    <code key={c} className="ent-col-badge">{c}</code>
                  ))}
                </div>
                <div className="ent-confidence">
                  <div className="ent-confidence-bar" style={{ width: `${m.confidence * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   3. DATA PIPELINES TAB (Analytics Pipelines)
   ═══════════════════════════════════════════════════ */
function PipelinesTab({ connections, selectedConn }) {
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', query: '', description: '', conn_id: '' })
  const [runResult, setRunResult] = useState(null)
  const [runningId, setRunningId] = useState(null)

  useEffect(() => {
    listPipelines().then(setPipelines).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!form.name || !form.query) return
    try {
      const p = await createPipeline({
        ...form,
        conn_id: form.conn_id || selectedConn.id
      })
      setPipelines(prev => [p, ...prev])
      setForm({ name: '', query: '', description: '', conn_id: '' })
      setShowForm(false)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleRun = async (id) => {
    setRunningId(id)
    setRunResult(null)
    try {
      const result = await runPipeline(id)
      setRunResult({ id, ...result })
      setPipelines(prev => prev.map(p => p.id === id ? { ...p, status: 'success', last_run: Date.now() / 1000 } : p))
    } catch (e) {
      setRunResult({ id, error: e.message })
    } finally {
      setRunningId(null)
    }
  }

  const handleDelete = async (id) => {
    await deletePipeline(id)
    setPipelines(prev => prev.filter(p => p.id !== id))
    if (runResult?.id === id) setRunResult(null)
  }

  return (
    <div>
      <div className="ent-section-bar">
        <h3 className="card-title">Analytics Pipelines</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Pipeline
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 ent-form">
          <div className="ent-form-row">
            <input placeholder="Pipeline name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="ent-input" />
            <select value={form.conn_id || selectedConn?.id} onChange={e => setForm({ ...form, conn_id: e.target.value })} className="dash-select" style={{ minWidth: 160 }}>
              {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <textarea
            placeholder="SELECT column1, COUNT(*) as total FROM table GROUP BY column1"
            value={form.query}
            onChange={e => setForm({ ...form, query: e.target.value })}
            className="ent-textarea"
            rows={3}
          />
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="ent-input" />
          <div className="flex gap-3" style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>Create Pipeline</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {pipelines.length === 0 && !showForm && (
        <div className="card">
          <div className="empty-state">
            <BarChart3 size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p className="text-muted">No pipelines yet. Create one to run custom analytics queries.</p>
          </div>
        </div>
      )}

      {pipelines.map(p => (
        <div key={p.id} className="card mb-4 ent-pipeline-card">
          <div className="ent-pipeline-header">
            <div>
              <h4 className="ent-pipeline-name">{p.name}</h4>
              {p.description && <p className="text-muted text-sm">{p.description}</p>}
            </div>
            <div className="flex gap-2 items-center">
              {p.status === 'success' && <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
              {p.status === 'error' && <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />}
              <button className="btn btn-sm btn-primary" onClick={() => handleRun(p.id)} disabled={runningId === p.id}>
                {runningId === p.id ? <RefreshCw size={13} className="spin" /> : <Play size={13} />} Run
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(p.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <pre className="ent-sql-preview">{p.query}</pre>

          {/* Run Results */}
          {runResult?.id === p.id && !runResult.error && (
            <div className="ent-run-result">
              <div className="text-sm" style={{ color: 'var(--success)', marginBottom: 8 }}>
                ✓ {runResult.total_rows} rows returned
              </div>
              {runResult.rows?.length > 0 && (
                <div className="dash-table-scroll" style={{ maxHeight: 260 }}>
                  <table className="data-table">
                    <thead>
                      <tr>{runResult.columns.map(c => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {runResult.rows.slice(0, 20).map((row, i) => (
                        <tr key={i}>
                          {runResult.columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {runResult?.id === p.id && runResult.error && (
            <div className="ent-run-result" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={14} /> {runResult.error}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   4. ANALYTICS TAB — table-level charts from pipelines
   ═══════════════════════════════════════════════════ */
function AnalyticsTab({ connections, selectedConn }) {
  const [pipelines, setPipelines] = useState([])
  const [chartData, setChartData] = useState(null)
  const [selectedPipeline, setSelectedPipeline] = useState(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    listPipelines().then(setPipelines).catch(() => {})
  }, [])

  const handleVisualize = async (p) => {
    setSelectedPipeline(p)
    setRunning(true)
    try {
      const result = await runPipeline(p.id)
      setChartData(result)
    } catch (e) {
      setChartData({ error: e.message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <h3 className="card-title" style={{ marginBottom: 16 }}>Visual Analytics</h3>

      {pipelines.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <BarChart3 size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p className="text-muted">Create a pipeline in the "Data Pipelines" tab first, then visualize results here.</p>
          </div>
        </div>
      )}

      {pipelines.length > 0 && (
        <div className="ent-analytics-grid">
          <div className="card">
            <h4 className="card-title" style={{ marginBottom: 12 }}>Your Pipelines</h4>
            {pipelines.map(p => (
              <div
                key={p.id}
                className={`ent-analytics-item ${selectedPipeline?.id === p.id ? 'active' : ''}`}
                onClick={() => handleVisualize(p)}
              >
                <BarChart3 size={14} />
                <span>{p.name}</span>
                <Play size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </div>
            ))}
          </div>

          <div className="card" style={{ flex: 2 }}>
            {running && <LoadingState text="Running pipeline..." />}
            {!running && !chartData && (
              <div className="empty-state">
                <p className="text-muted">Select a pipeline to visualize</p>
              </div>
            )}
            {!running && chartData?.error && (
              <div className="empty-state" style={{ color: 'var(--danger)' }}>
                <AlertTriangle size={20} style={{ margin: '0 auto 8px' }} />
                <p>{chartData.error}</p>
              </div>
            )}
            {!running && chartData?.rows && (
              <>
                <h4 className="card-title">{selectedPipeline?.name}</h4>
                <p className="text-muted text-sm" style={{ marginBottom: 16 }}>{chartData.total_rows} results</p>
                {chartData.columns.length >= 2 && chartData.rows.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.rows.slice(0, 20)} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey={chartData.columns[0]} tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} height={70} />
                      <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {chartData.columns.slice(1).map((col, i) => (
                        <Bar key={col} dataKey={col} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="dash-table-scroll" style={{ maxHeight: 200, marginTop: 16 }}>
                  <table className="data-table">
                    <thead>
                      <tr>{chartData.columns.map(c => <th key={c}>{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {chartData.rows.slice(0, 15).map((row, i) => (
                        <tr key={i}>
                          {chartData.columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   5. WORKFLOWS TAB
   ═══════════════════════════════════════════════════ */
function WorkflowsTab({ connections, selectedConn }) {
  const [workflows, setWorkflows] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', trigger: 'manual', description: '' })
  const [actions, setActions] = useState([])
  const [tables, setTables] = useState([])
  const [runningId, setRunningId] = useState(null)
  const [runResults, setRunResults] = useState({})

  useEffect(() => { listWorkflows().then(setWorkflows).catch(() => {}) }, [])
  useEffect(() => {
    if (selectedConn) getTables(selectedConn.id).then(setTables).catch(() => setTables([]))
  }, [selectedConn])

  const addAction = (type) => {
    setActions(prev => [...prev, { type, config: { conn_id: selectedConn?.id || '', table: '' } }])
  }

  const updateAction = (i, field, value) => {
    setActions(prev => prev.map((a, idx) => idx === i ? { ...a, config: { ...a.config, [field]: value } } : a))
  }

  const removeAction = (i) => setActions(prev => prev.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    if (!form.name || actions.length === 0) return
    try {
      const w = await createWorkflow({ ...form, actions })
      setWorkflows(prev => [w, ...prev])
      setForm({ name: '', trigger: 'manual', description: '' })
      setActions([])
      setShowForm(false)
    } catch (e) { alert(e.message) }
  }

  const handleRun = async (id) => {
    setRunningId(id)
    try {
      const result = await runWorkflow(id)
      setRunResults(prev => ({ ...prev, [id]: result }))
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'completed', run_count: (w.run_count || 0) + 1 } : w))
    } catch (e) {
      setRunResults(prev => ({ ...prev, [id]: { error: e.message } }))
    } finally { setRunningId(null) }
  }

  const handleToggle = async (id) => {
    try {
      const w = await toggleWorkflow(id)
      setWorkflows(prev => prev.map(p => p.id === id ? w : p))
    } catch (e) { /* ignore */ }
  }

  const handleDelete = async (id) => {
    await deleteWorkflow(id)
    setWorkflows(prev => prev.filter(w => w.id !== id))
  }

  const ACTION_LABELS = { quality_scan: 'Quality Scan', ai_summary: 'AI Summary', run_pipeline: 'Run Pipeline', notify: 'Notification' }

  return (
    <div>
      <div className="ent-section-bar">
        <h3 className="card-title">Workflow Automation</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Workflow
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 ent-form">
          <div className="ent-form-row">
            <input placeholder="Workflow name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="ent-input" />
            <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} className="dash-select" style={{ minWidth: 140 }}>
              <option value="manual">Manual</option>
              <option value="on_connect">On Connect</option>
              <option value="on_schedule">Scheduled</option>
            </select>
          </div>
          <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="ent-input" />

          <div style={{ marginTop: 12 }}>
            <p className="text-sm text-muted" style={{ marginBottom: 8 }}>Actions (executed in order):</p>
            {actions.map((a, i) => (
              <div key={i} className="ent-action-row">
                <span className="ent-action-num">{i + 1}</span>
                <span className="badge badge-info">{ACTION_LABELS[a.type] || a.type}</span>
                {(a.type === 'quality_scan' || a.type === 'ai_summary') && (
                  <select value={a.config.table} onChange={e => updateAction(i, 'table', e.target.value)} className="dash-select" style={{ minWidth: 130, fontSize: 12, padding: '4px 8px' }}>
                    <option value="">Select table</option>
                    {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                )}
                {a.type === 'notify' && (
                  <input placeholder="Message" value={a.config.message || ''} onChange={e => updateAction(i, 'message', e.target.value)} className="ent-input" style={{ flex: 1, fontSize: 12 }} />
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => removeAction(i)}><Trash2 size={12} /></button>
              </div>
            ))}
            <div className="flex gap-2" style={{ marginTop: 8 }}>
              <button className="btn btn-sm btn-outline" onClick={() => addAction('quality_scan')}>+ Quality Scan</button>
              <button className="btn btn-sm btn-outline" onClick={() => addAction('ai_summary')}>+ AI Summary</button>
              <button className="btn btn-sm btn-outline" onClick={() => addAction('notify')}>+ Notification</button>
            </div>
          </div>

          <div className="flex gap-3" style={{ marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!form.name || actions.length === 0}>Create Workflow</button>
            <button className="btn btn-outline btn-sm" onClick={() => { setShowForm(false); setActions([]) }}>Cancel</button>
          </div>
        </div>
      )}

      {workflows.length === 0 && !showForm && (
        <div className="card">
          <div className="empty-state">
            <Workflow size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
            <p className="text-muted">No workflows yet. Automate quality scans, AI summaries, and more.</p>
          </div>
        </div>
      )}

      {workflows.map(w => (
        <div key={w.id} className="card mb-4 ent-pipeline-card">
          <div className="ent-pipeline-header">
            <div>
              <h4 className="ent-pipeline-name">{w.name}</h4>
              <div className="flex gap-3 items-center" style={{ marginTop: 4 }}>
                <span className="badge badge-info">{w.trigger}</span>
                {w.description && <span className="text-muted text-sm">{w.description}</span>}
                <span className="text-muted text-sm">Runs: {w.run_count || 0}</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button className="btn btn-sm btn-ghost" onClick={() => handleToggle(w.id)} title={w.enabled ? 'Disable' : 'Enable'}>
                {w.enabled ? <ToggleRight size={18} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => handleRun(w.id)} disabled={runningId === w.id}>
                {runningId === w.id ? <RefreshCw size={13} className="spin" /> : <Play size={13} />} Run
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(w.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="ent-workflow-actions">
            {w.actions?.map((a, i) => (
              <span key={i} className="ent-workflow-step">
                {i > 0 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
                <span className="badge">{ACTION_LABELS[a.type] || a.type}</span>
              </span>
            ))}
          </div>

          {runResults[w.id] && !runResults[w.id].error && (
            <div className="ent-run-result">
              {runResults[w.id].results?.map((r, i) => (
                <div key={i} className="ent-wf-result-row">
                  {r.status === 'success' ? <CheckCircle2 size={13} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={13} style={{ color: 'var(--danger)' }} />}
                  <span>{r.action}</span>
                  {r.score !== undefined && <span className="text-muted text-sm">Score: {r.score}%</span>}
                  {r.rows !== undefined && <span className="text-muted text-sm">{r.rows} rows</span>}
                  {r.message && <span className="text-muted text-sm">{r.message}</span>}
                  {r.error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{r.error}</span>}
                </div>
              ))}
            </div>
          )}
          {runResults[w.id]?.error && (
            <div className="ent-run-result" style={{ color: 'var(--danger)' }}>
              <AlertTriangle size={14} /> {runResults[w.id].error}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   6. BUSINESS INSIGHTS TAB (AI)
   ═══════════════════════════════════════════════════ */
function InsightsTab({ connId, connName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((refresh = false) => {
    setLoading(true)
    getBusinessInsights(connId, null, refresh)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [connId])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingState text="Generating AI business insights..." />
  if (!data) return <ErrorState onRetry={() => load(true)} />

  return (
    <div>
      <div className="ent-section-bar">
        <div>
          <h3 className="card-title">AI Business Insights — {connName}</h3>
          <p className="text-muted text-sm">{data.tables_analyzed} tables analyzed</p>
        </div>
        <div className="flex gap-2 items-center">
          {data.cached && <span className="badge badge-info" style={{ fontSize: 11 }}>cached</span>}
          <button className="btn btn-outline btn-sm" onClick={() => load(true)}>
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      </div>

      <div className="ent-insights-grid">
        {data.insights?.map((insight, i) => (
          <div key={i} className="card ent-insight-card">
            <div className="ent-insight-top">
              <span className="ent-insight-cat">
                {CATEGORY_ICONS[insight.category] || '📊'} {insight.category}
              </span>
              <span className="ent-insight-priority" style={{ color: PRIORITY_COLORS[insight.priority] || '#999' }}>
                {insight.priority}
              </span>
            </div>
            <h4 className="ent-insight-title">{insight.title}</h4>
            <p className="ent-insight-body">{insight.insight}</p>
            <div className="ent-insight-rec">
              <Lightbulb size={14} />
              <span>{insight.recommendation}</span>
            </div>
            {insight.sql && (
              <details className="ent-insight-sql">
                <summary className="text-sm flex items-center gap-2" style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Code2 size={13} /> View SQL
                </summary>
                <pre className="ent-sql-preview">{insight.sql}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   SHARED UTILITY COMPONENTS
   ═══════════════════════════════════════════════════ */
function LoadingState({ text }) {
  return (
    <div className="card">
      <div className="empty-state">
        <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p className="text-muted">{text || 'Loading...'}</p>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="card">
      <div className="empty-state">
        <AlertTriangle size={28} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
        <p className="text-muted">Something went wrong</p>
        {onRetry && <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={onRetry}>Retry</button>}
      </div>
    </div>
  )
}
