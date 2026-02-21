import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Database, Table2, ShieldCheck, MessageCircle, ArrowRight,
  Columns3, Rows3, BarChart3, RefreshCw, Eye
} from 'lucide-react'
import { getConnections, getAnalytics, getTables } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Treemap
} from 'recharts'

const CHART_COLORS = [
  '#10a37f', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 13,
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

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
        if (conns.length > 0) {
          setSelectedConn(conns[0])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedConn) return
    setLoading(true)
    setError(null)
    getAnalytics(selectedConn.id)
      .then((data) => {
        setAnalytics(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [selectedConn])

  const handleRefresh = () => {
    if (!selectedConn) return
    setLoading(true)
    setError(null)
    getAnalytics(selectedConn.id)
      .then(setAnalytics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted text-sm" style={{ marginTop: -20, marginBottom: 0 }}>
            Database analytics &amp; insights
          </p>
        </div>

        {connections.length > 0 && (
          <div className="dash-controls">
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
            <button
              className="btn btn-outline btn-sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards – always show connection count; show DB stats when analytics loaded */}
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(16,163,127,0.12)', color: '#10a37f' }}>
            <Database size={20} />
          </div>
          <div className="stat-value">{connections.length}</div>
          <div className="stat-label">Active Connections</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
            <Table2 size={20} />
          </div>
          <div className="stat-value">
            {analytics ? analytics.total_tables + (analytics.total_views || 0) : '--'}
          </div>
          <div className="stat-label">Tables & Views</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
            <Columns3 size={20} />
          </div>
          <div className="stat-value">
            {analytics ? analytics.total_columns : '--'}
          </div>
          <div className="stat-label">Total Columns</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
            <Rows3 size={20} />
          </div>
          <div className="stat-value">
            {analytics ? formatNumber(analytics.total_rows) : '--'}
          </div>
          <div className="stat-label">Total Rows</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-6">
        <h2 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h2>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <Link to="/connections" className="btn btn-primary">
            <Database size={15} /> Add Connection
          </Link>
          <Link to="/tables" className="btn btn-outline">
            <Table2 size={15} /> Browse Tables
          </Link>
          <Link to="/quality" className="btn btn-outline">
            <ShieldCheck size={15} /> Quality Reports
          </Link>
          <Link to="/chat" className="btn btn-outline">
            <MessageCircle size={15} /> Ask AI
          </Link>
        </div>
      </div>

      {/* No connections state */}
      {connections.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Database size={44} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3>No Connections Yet</h3>
            <p className="text-muted text-sm">
              Connect to a database to start generating your data dictionary.
            </p>
            <Link to="/connections" className="btn btn-primary" style={{ marginTop: 20 }}>
              Add Your First Connection
            </Link>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card">
          <div className="empty-state">
            <RefreshCw size={36} className="spin" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p className="text-muted">Analyzing database...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div className="empty-state">
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      {analytics && !loading && (
        <div className="dash-charts">
          {/* Rows per Table – Bar Chart */}
          {analytics.top_tables_by_rows.length > 0 && (
            <div className="card dash-chart-card dash-chart-wide">
              <h2 className="card-title">
                <BarChart3 size={18} /> Rows per Table
              </h2>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                Top {analytics.top_tables_by_rows.length} tables by row count
              </p>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={analytics.top_tables_by_rows}
                  margin={{ top: 5, right: 20, bottom: 60, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#999', fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    height={70}
                  />
                  <YAxis
                    tick={{ fill: '#999', fontSize: 11 }}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [formatNumber(v), 'Rows']}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Bar dataKey="row_count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {analytics.top_tables_by_rows.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Types Distribution – Pie Chart */}
          {analytics.type_distribution.length > 0 && (
            <div className="card dash-chart-card">
              <h2 className="card-title">
                <Eye size={18} /> Data Type Distribution
              </h2>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                Column types across all tables
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.type_distribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ type, percent }) =>
                      `${type} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                  >
                    {analytics.type_distribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Columns']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Nullable vs Non-nullable – Pie Chart */}
          {(analytics.nullable_stats.nullable > 0 || analytics.nullable_stats.non_nullable > 0) && (
            <div className="card dash-chart-card">
              <h2 className="card-title">
                <ShieldCheck size={18} /> Nullable Columns
              </h2>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                Nullable vs required columns
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Nullable', value: analytics.nullable_stats.nullable },
                      { name: 'Required', value: analytics.nullable_stats.non_nullable },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10a37f" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#999' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Columns per Table – Bar Chart */}
          {analytics.top_tables_by_columns.length > 0 && (
            <div className="card dash-chart-card dash-chart-wide">
              <h2 className="card-title">
                <Columns3 size={18} /> Columns per Table
              </h2>
              <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
                Top {analytics.top_tables_by_columns.length} tables by column count
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.top_tables_by_columns}
                  margin={{ top: 5, right: 20, bottom: 60, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#999', fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    height={70}
                  />
                  <YAxis tick={{ fill: '#999', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Columns']}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Bar dataKey="column_count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {analytics.top_tables_by_columns.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* All Tables Summary */}
          <div className="card dash-chart-card dash-chart-wide">
            <h2 className="card-title" style={{ marginBottom: 16 }}>
              <Table2 size={18} /> All Tables
            </h2>
            <div className="dash-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Columns</th>
                    <th style={{ textAlign: 'right' }}>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.tables
                    .sort((a, b) => b.row_count - a.row_count)
                    .map((t) => (
                      <tr key={t.name}>
                        <td style={{ fontWeight: 500 }}>{t.name}</td>
                        <td>
                          <span className={`badge ${t.type === 'view' ? 'badge-info' : 'badge-success'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{t.column_count}</td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {t.row_count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Active Connections Table (always visible when connections exist) */}
      {connections.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2 className="card-title" style={{ marginBottom: 16 }}>Active Connections</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
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
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <Link to="/tables" className="btn btn-sm btn-ghost">
                      <ArrowRight size={14} />
                    </Link>
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
