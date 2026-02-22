import { lazy, Suspense, memo, useCallback } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Database, LayoutDashboard, Table2, ShieldCheck, Sparkles, MessageCircle, LogOut, User, Building2, Settings } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy-load pages for faster initial load
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'))
const TablesPage = lazy(() => import('./pages/TablesPage'))
const TableDetailPage = lazy(() => import('./pages/TableDetailPage'))
const QualityPage = lazy(() => import('./pages/QualityPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const EnterprisePage = lazy(() => import('./pages/EnterprisePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

const PageLoader = memo(function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Sparkles size={28} style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    </div>
  )
})

// Stable outside component — won't recreate on each render
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connections', icon: Database, label: 'Connections' },
  { to: '/tables', icon: Table2, label: 'Tables' },
  { to: '/quality', icon: ShieldCheck, label: 'Data Quality' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { to: '/enterprise', icon: Building2, label: 'Enterprise' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const navClassName = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`

// Prefetch the JS chunk for a page when the user hovers its nav link
// — same dynamic import path as lazy(), resolves instantly from cache on click
const PAGE_PREFETCH = {
  '/dashboard':   () => import('./pages/DashboardPage'),
  '/connections': () => import('./pages/ConnectionsPage'),
  '/tables':      () => import('./pages/TablesPage'),
  '/quality':     () => import('./pages/QualityPage'),
  '/chat':        () => import('./pages/ChatPage'),
  '/enterprise':  () => import('./pages/EnterprisePage'),
  '/settings':    () => import('./pages/SettingsPage'),
}

// Memoized nav item — only re-renders when its own props change
const SidebarNavItem = memo(function SidebarNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink key={to} to={to} className={navClassName} onMouseEnter={() => PAGE_PREFETCH[to]?.()}>
      <Icon size={17} />
      {label}
    </NavLink>
  )
})

const AppLayout = memo(function AppLayout() {
  const { user, logout } = useAuth()

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }, [logout])

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Sparkles size={20} />
          DataDict AI
        </div>

        <div className="sidebar-section-label">Navigation</div>

        {navItems.map((item) => (
          <SidebarNavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <User size={16} />
            <span>{displayName}</span>
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/tables/:connId/:table" element={<TableDetailPage />} />
            <Route path="/quality" element={<QualityPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/enterprise" element={<EnterprisePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
})

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Public routes that don't need the app layout
  const publicPaths = ['/', '/login', '/signup']
  const isPublicPath = publicPaths.includes(location.pathname)

  if (isPublicPath) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    </Suspense>
  )
}
