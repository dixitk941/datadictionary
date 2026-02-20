import { Routes, Route, NavLink } from 'react-router-dom'
import { Database, LayoutDashboard, Table2, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import ConnectionsPage from './pages/ConnectionsPage'
import TablesPage from './pages/TablesPage'
import TableDetailPage from './pages/TableDetailPage'
import QualityPage from './pages/QualityPage'
import ChatPage from './pages/ChatPage'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connections', icon: Database, label: 'Connections' },
  { to: '/tables', icon: Table2, label: 'Tables' },
  { to: '/quality', icon: ShieldCheck, label: 'Data Quality' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
]

export default function App() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Sparkles size={22} />
          DataDict AI
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Main */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:connId/:table" element={<TableDetailPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </main>
    </div>
  )
}
