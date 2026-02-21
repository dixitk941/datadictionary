import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Database, LayoutDashboard, Table2, ShieldCheck, Sparkles, MessageCircle, LogOut, User } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import ConnectionsPage from './pages/ConnectionsPage'
import TablesPage from './pages/TablesPage'
import TableDetailPage from './pages/TableDetailPage'
import QualityPage from './pages/QualityPage'
import ChatPage from './pages/ChatPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connections', icon: Database, label: 'Connections' },
  { to: '/tables', icon: Table2, label: 'Tables' },
  { to: '/quality', icon: ShieldCheck, label: 'Data Quality' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
]

function AppLayout() {
  const { user, logout } = useAuth()
  
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Sparkles size={20} />
          DataDict AI
        </div>

        <div className="sidebar-section-label">Navigation</div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <User size={16} />
            <span>{user?.displayName || user?.email?.split('@')[0] || 'User'}</span>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>

        <div className="sidebar-footer">
          Powered by Mistral AI
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
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

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  
  // Public routes that don't need the app layout
  const publicPaths = ['/', '/login', '/signup']
  const isPublicPath = publicPaths.includes(location.pathname)

  if (isPublicPath) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  )
}
