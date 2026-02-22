import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, Table2, ShieldCheck, MessageCircle, ArrowRight, ArrowUpRight,
  Columns3, Rows3, BarChart3, RefreshCw, Eye, Plus, TrendingUp
} from 'lucide-react'
import { getConnections, getAnalytics } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { SkeletonChart } from '../components/Skeleton'

const CHART_COLORS = [
  '#1a7f56', '#2d9e6e', '#3bb87f', '#6fd4a1', '#a8e6c3',
  '#0967d2', '#8b5cf6', '#e5930a', '#dc3545', '#06b6d4',
]

const tooltipStyle = {
  backgroundColor: 'var(--tooltip-bg)',
  border: '1px solid var(--tooltip-border)',
  borderRadius: 10,
  color: 'var(--tooltip-text)',
  fontSize: 13,
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n?.toString() || '0'
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, subtitle, primary, iconBg, iconColor, loading }) {
  return (
    <div className={`stat-box${primary ? ' stat-primary' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="stat-label">{label}</div>
          {loading ? (
            <>
              <div className="skeleton" style={{ height: 26, width: '45%', borderRadius: 6, margin: '10px 0 8px' }} />
              <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
            </>
          ) : (
            <>
              <div className="stat-value">{value}</div>
              {subtitle && <div className="stat-change">{subtitle}</div>}
            </>
          )}
        </div>
        <div className="stat-icon" style={{ background: primary ? 'rgba(255,255,255,0.2)' : iconBg, color: primary ? '#fff' : iconColor }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
})

export default function DashboardPage() {
  const [connections, setConnections] = useState([])
  const [selectedConn, setSelectedConn] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getConnections()
      .then((conns) => {
        setConnections(conns)
        if (conns.length > 0) setSelectedConn(conns[0])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedConn) return
    setLoading(true)
    setError(null)
    getAnalytics(selectedConn.id, null, false)
      .then((data) => { setAnalytics(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [selectedConn])

  const handleRefresh = useCallback(() => {
    if (!selectedConn) return
    setLoading(true)
    setError(null)
    getAnalytics(selectedConn.id, null, true)
      .then(setAnalytics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedConn])

  // Derived / memoised data
  const sortedTables = useMemo(
    () => analytics?.tables?.slice().sort((a, b) => b.row_count - a.row_count) ?? [],
    [analytics]
  )
  const topColumnsTables = useMemo(
    () => analytics?.top_tables_by_columns?.slice(0, 7) ?? [],
    [analytics]
  )
  const nullableData = useMemo(
    () => analytics ? [
      { name: 'Nullable', value: analytics.nullable_stats.nullable },
      { name: 'Required', value: analytics.nullable_stats.non_nullable },
    ] : [],
    [analytics]
  )

  return (
    <div className="dash-page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted text-sm">
            Plan, analyze, and manage your data with ease.
          </p>
        </div>
        <div className="dash-controls">
          {connections.length > 0 && (
            <>
              <select
                className="dash-select"
                value={selectedConn?.id || ''}
                onChange={(e) => {
                  const c = connections.find((x) => x.id === e.target.value)
                  setSelectedConn(c)
                }}
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.db_type})
                  </option>
                ))}
              </select>
              <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </button>
              {analytics?.cached && <span className="badge badge-info" style={{ fontSize: 11 }}>cached</span>}
            </>
          )}
          <Link to="/connections" className="btn btn-primary">
            <Plus size={15} /> Add Connection
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard icon={Database} label="Active Connections" value={connections.length} subtitle="Databases linked" primary iconBg="rgba(26,127,86,0.12)" iconColor="#1a7f56" />
        <StatCard loading={loading && !analytics} icon={Table2} label="Tables & Views" value={analytics ? analytics.total_tables + (analytics.total_views || 0) : '--'} subtitle={analytics ? `${analytics.total_tables} tables, ${analytics.total_views || 0} views` : ''} iconBg="rgba(9,103,210,0.10)" iconColor="#0967d2" />
        <StatCard loading={loading && !analytics} icon={Columns3} label="Total Columns" value={analytics ? formatNumber(analytics.total_columns) : '--'} subtitle="Across all tables" iconBg="rgba(139,92,246,0.10)" iconColor="#8b5cf6" />
        <StatCard loading={loading && !analytics} icon={Rows3} label="Total Rows" value={analytics ? formatNumber(analytics.total_rows) : '--'} subtitle="Records stored" iconBg="rgba(229,147,10,0.10)" iconColor="#e5930a" />
      </div>

      {/* No connections */}
      {connections.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Database size={44} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3>No Connections Yet</h3>
            <p className="text-muted text-sm">Connect to a database to start generating your data dictionary.</p>
            <Link to="/connections" className="btn btn-primary" style={{ marginTop: 20 }}>Add Your First Connection</Link>
          </div>
        </div>
      )}

      {/* Skeleton charts while analytics loads */}
      {loading && (
        <div className="dash-grid-3">
          <div className="dash-col-2"><SkeletonChart height={280} /></div>
          <SkeletonChart height={280} />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card" style={{ borderColor: 'rgba(220,53,69,0.3)' }}>
          <div className="empty-state">
            <p style={{ color: 'var(--danger)' }}>{error}</p>
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={handleRefresh}>Retry</button>
          </div>
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Main Charts Row */}
          <div className="dash-grid-3">
            {analytics.top_tables_by_rows.length > 0 && (
              <div className="card dash-col-2">
                <div className="card-header">
                  <h2 className="card-title"><BarChart3 size={18} /> Database Analytics</h2>
                  <span className="text-muted text-sm">Top tables by row count</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.top_tables_by_rows} margin={{ top: 5, right: 10, bottom: 50, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} height={60} />
                    <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 11 }} tickFormatter={formatNumber} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatNumber(v), 'Rows']} labelStyle={{ fontWeight: 600 }} />
                    <Bar dataKey="row_count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {analytics.top_tables_by_rows.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {analytics.type_distribution.length > 0 && (
              <div className="card">
                <div className="card-header"><h2 className="card-title"><Eye size={18} /> Data Types</h2></div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={analytics.type_distribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={2}
                      label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-muted)' }}>
                      {analytics.type_distribution.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Columns']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Second Row */}
          <div className="dash-grid-3" style={{ marginTop: 'var(--gap)' }}>
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
              <div className="dash-actions-list">
                <Link to="/tables" className="dash-action-item">
                  <div className="dash-action-icon" style={{ background: 'rgba(9,103,210,0.10)', color: '#0967d2' }}><Table2 size={18} /></div>
                  <div className="dash-action-text"><span className="dash-action-name">Browse Tables</span><span className="dash-action-desc">Explore all database tables</span></div>
                  <ArrowRight size={16} className="dash-action-arrow" />
                </Link>
                <Link to="/quality" className="dash-action-item">
                  <div className="dash-action-icon" style={{ background: 'rgba(139,92,246,0.10)', color: '#8b5cf6' }}><ShieldCheck size={18} /></div>
                  <div className="dash-action-text"><span className="dash-action-name">Data Quality</span><span className="dash-action-desc">Run quality analysis</span></div>
                  <ArrowRight size={16} className="dash-action-arrow" />
                </Link>
                <Link to="/chat" className="dash-action-item">
                  <div className="dash-action-icon" style={{ background: 'rgba(26,127,86,0.10)', color: '#1a7f56' }}><MessageCircle size={18} /></div>
                  <div className="dash-action-text"><span className="dash-action-name">Ask AI</span><span className="dash-action-desc">Chat about your data</span></div>
                  <ArrowRight size={16} className="dash-action-arrow" />
                </Link>
                <Link to="/enterprise" className="dash-action-item">
                  <div className="dash-action-icon" style={{ background: 'rgba(229,147,10,0.10)', color: '#e5930a' }}><TrendingUp size={18} /></div>
                  <div className="dash-action-text"><span className="dash-action-name">Enterprise Hub</span><span className="dash-action-desc">Pipelines & automation</span></div>
                  <ArrowRight size={16} className="dash-action-arrow" />
                </Link>
              </div>
            </div>

            {(analytics.nullable_stats.nullable > 0 || analytics.nullable_stats.non_nullable > 0) && (
              <div className="card">
                <div className="card-header"><h2 className="card-title"><ShieldCheck size={18} /> Column Health</h2></div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={nullableData}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'var(--text-muted)' }}>
                      <Cell fill="#e5930a" /><Cell fill="#1a7f56" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {analytics.top_tables_by_columns.length > 0 && (
              <div className="card">
                <div className="card-header"><h2 className="card-title"><Columns3 size={18} /> Columns/Table</h2></div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.top_tables_by_columns.slice(0, 7)} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={50} />
                    <YAxis tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Columns']} />
                    <Bar dataKey="column_count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {topColumnsTables.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* All Tables */}
          <div className="card" style={{ marginTop: 'var(--gap)' }}>
            <div className="card-header">
              <h2 className="card-title"><Table2 size={18} /> All Tables</h2>
              <span className="badge badge-info">{analytics.tables.length} total</span>
            </div>
            <div className="dash-table-scroll">
              <table className="data-table">
                <thead><tr><th>Table</th><th>Type</th><th style={{ textAlign: 'right' }}>Columns</th><th style={{ textAlign: 'right' }}>Rows</th><th></th></tr></thead>
                <tbody>
                  {sortedTables.map((t) => (
                    <tr key={t.name}>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td><span className={`badge ${t.type === 'view' ? 'badge-info' : 'badge-success'}`}>{t.type}</span></td>
                      <td style={{ textAlign: 'right' }}>{t.column_count}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.row_count.toLocaleString()}</td>
                      <td><Link to={`/tables/${selectedConn?.id}/${t.name}`} className="btn btn-sm btn-ghost"><ArrowUpRight size={14} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Active Connections */}
      {connections.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--gap)' }}>
          <div className="card-header"><h2 className="card-title"><Database size={18} /> Active Connections</h2></div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {connections.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td><span className="badge badge-info">{c.db_type}</span></td>
                  <td><span className="flex items-center gap-2"><span className="status-dot connected" />{c.status}</span></td>
                  <td><Link to="/tables" className="btn btn-sm btn-ghost"><ArrowRight size={14} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
