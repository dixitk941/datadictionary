import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Database, Table2, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react'
import { getConnections } from '../api/client'

export default function DashboardPage() {
  const [connections, setConnections] = useState([])

  useEffect(() => {
    getConnections().then(setConnections).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="text-muted text-sm" style={{ marginTop: -20, marginBottom: 28 }}>
        Overview of your data dictionary workspace
      </p>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{connections.length}</div>
          <div className="stat-label">Active Connections</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">--</div>
          <div className="stat-label">Tables Documented</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">--</div>
          <div className="stat-label">Quality Scans</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">--</div>
          <div className="stat-label">AI Summaries</div>
        </div>
      </div>

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

      {connections.length > 0 && (
        <div className="card">
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
    </div>
  )
}
