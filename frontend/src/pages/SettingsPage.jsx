import { useState, useEffect } from 'react'
import {
  Settings, User, Shield, Brain, Lock, ChevronRight, Check,
  Eye, EyeOff, AlertCircle, Sparkles, FileText, RefreshCw, Sun, Moon, Monitor
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { getUserPreferences, saveUserPreferences } from '../services/firestoreService'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'

/* ── AI Profile Definitions (mirrored from backend) ────── */
const AI_PROFILES = [
  {
    key: 'beginner',
    name: 'Complete Beginner',
    description: 'No technical background — maximum simplification with everyday analogies',
    icon: '🌱',
    color: '#22c55e'
  },
  {
    key: 'business_user',
    name: 'Business User',
    description: 'Business-friendly language with practical implications and workplace analogies',
    icon: '💼',
    color: '#3b82f6'
  },
  {
    key: 'technical',
    name: 'Technical User',
    description: 'Proper technical terminology with implementation details and best practices',
    icon: '⚙️',
    color: '#a855f7'
  },
  {
    key: 'default',
    name: 'Balanced',
    description: 'Friendly, accessible language — avoids jargon but explains terms when needed',
    icon: '⚖️',
    color: '#f59e0b'
  }
]

const INDUSTRIES = [
  { value: '', label: 'None (General)' },
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'saas', label: 'SaaS / Tech' },
  { value: 'retail', label: 'Retail' },
  { value: 'media', label: 'Media & Entertainment' },
]

/* ══════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'ai', label: 'AI Preferences', icon: Brain },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
  ]

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="page-title"><Settings size={22} /> Settings</h1>
      </div>

      <div className="settings-layout">
        {/* Sidebar Nav */}
        <nav className="settings-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <s.icon size={17} />
              <span>{s.label}</span>
              <ChevronRight size={14} className="settings-nav-arrow" />
            </button>
          ))}
        </nav>

        {/* Content Panel */}
        <div className="settings-content">
          {activeSection === 'profile' && <ProfileSection user={user} />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'ai' && <AIPreferencesSection user={user} />}
          {activeSection === 'password' && <ChangePasswordSection user={user} />}
          {activeSection === 'terms' && <TermsSection />}
          {activeSection === 'privacy' && <PrivacySection />}
        </div>
      </div>

      {/* Footer */}
      <footer className="settings-footer">
        <Sparkles size={14} />
        <span>Created by <strong>Team Hakumana</strong></span>
      </footer>
    </div>
  )
}

/* ── Appearance / Theme Section ────────────────────────────── */
function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light', label: 'Light', icon: Sun, description: 'Clean, bright interface' },
    { key: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  ]

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Appearance</h2>
      <p className="text-muted text-sm" style={{ marginBottom: 20 }}>Choose your preferred theme for the interface.</p>

      <div className="theme-options">
        {themes.map(t => {
          const Icon = t.icon
          const active = theme === t.key
          return (
            <button
              key={t.key}
              className={`theme-option${active ? ' active' : ''}`}
              onClick={() => setTheme(t.key)}
            >
              <div className="theme-option-icon">
                <Icon size={22} />
              </div>
              <span className="theme-option-label">{t.label}</span>
              <span className="theme-option-desc">{t.description}</span>
              {active && <Check size={16} className="theme-option-check" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Profile Section ─────────────────────────────────────── */
function ProfileSection({ user }) {
  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : 'N/A'

  const lastLogin = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'N/A'

  const providerMap = {
    'password': 'Email & Password',
    'google.com': 'Google',
  }
  const provider = user?.providerData?.[0]?.providerId
  const providerLabel = providerMap[provider] || provider || 'Unknown'

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Your Profile</h2>

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-fallback">
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-row">
            <span className="profile-label">Name</span>
            <span className="profile-value">{user?.displayName || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Sign-in Method</span>
            <span className="profile-value">{providerLabel}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Member Since</span>
            <span className="profile-value">{createdAt}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Last Login</span>
            <span className="profile-value">{lastLogin}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">UID</span>
            <span className="profile-value text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
              {user?.uid || '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── AI Preferences Section ──────────────────────────────── */
function AIPreferencesSection({ user }) {
  const [profile, setProfile] = useState('beginner')
  const [industry, setIndustry] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    getUserPreferences(user.uid).then(prefs => {
      if (prefs.aiProfile) setProfile(prefs.aiProfile)
      if (prefs.industry) setIndustry(prefs.industry)
      if (prefs.customInstructions) setCustomInstructions(prefs.customInstructions)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.uid])

  const handleSave = async () => {
    if (!user?.uid) return
    setSaving(true)
    setSaved(false)
    try {
      await saveUserPreferences(user.uid, {
        aiProfile: profile,
        industry,
        customInstructions,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save preferences', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-section">
        <h2 className="settings-section-title">AI Response Preferences</h2>
        <div className="empty-state"><RefreshCw size={20} className="spin" /> Loading preferences…</div>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">AI Response Preferences</h2>
      <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
        Choose how the AI explains data to you. This affects all AI summaries, chat responses, and insights.
      </p>

      {/* Profile Cards */}
      <div className="ai-profile-grid">
        {AI_PROFILES.map(p => (
          <button
            key={p.key}
            className={`ai-profile-card ${profile === p.key ? 'active' : ''}`}
            onClick={() => setProfile(p.key)}
            style={{ '--profile-color': p.color }}
          >
            <div className="ai-profile-top">
              <span className="ai-profile-icon">{p.icon}</span>
              {profile === p.key && <Check size={16} className="ai-profile-check" />}
            </div>
            <h4 className="ai-profile-name">{p.name}</h4>
            <p className="ai-profile-desc">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Industry */}
      <div className="settings-field">
        <label className="settings-label">Industry Context</label>
        <p className="settings-hint">The AI will use industry-specific examples and terminology</p>
        <select className="settings-select" value={industry} onChange={e => setIndustry(e.target.value)}>
          {INDUSTRIES.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
      </div>

      {/* Custom Instructions */}
      <div className="settings-field">
        <label className="settings-label">Custom Instructions</label>
        <p className="settings-hint">Add specific instructions the AI should always follow (optional)</p>
        <textarea
          className="settings-textarea"
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder="e.g., Always include SQL examples, focus on data governance, explain in Hindi..."
          rows={3}
        />
      </div>

      {/* Save Button */}
      <div className="settings-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><RefreshCw size={15} className="spin" /> Saving…</> :
           saved ? <><Check size={15} /> Saved!</> :
           'Save Preferences'}
        </button>
        {saved && <span className="text-success" style={{ fontSize: '0.82rem' }}>Your AI preferences have been updated</span>}
      </div>
    </div>
  )
}

/* ── Change Password Section ─────────────────────────────── */
function ChangePasswordSection({ user }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com'

  const validate = () => {
    if (!currentPw) return 'Current password is required'
    if (newPw.length < 6) return 'New password must be at least 6 characters'
    if (newPw !== confirmPw) return 'Passwords do not match'
    if (currentPw === newPw) return 'New password must be different from current'
    return null
  }

  const handleChange = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPw)

      setSuccess('Password changed successfully!')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      const msg = {
        'auth/wrong-password': 'Current password is incorrect',
        'auth/invalid-credential': 'Current password is incorrect',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters',
        'auth/requires-recent-login': 'Please log out and log back in, then try again',
      }
      setError(msg[err.code] || err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (isGoogleUser) {
    return (
      <div className="settings-section">
        <h2 className="settings-section-title">Change Password</h2>
        <div className="settings-notice">
          <AlertCircle size={18} />
          <div>
            <strong>Google Sign-In</strong>
            <p>You signed in with Google. Password is managed through your Google account settings.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Change Password</h2>
      <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
        Update your account password. You'll need to enter your current password first.
      </p>

      <form onSubmit={handleChange} className="pw-form">
        {error && (
          <div className="pw-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="pw-success">
            <Check size={15} /> {success}
          </div>
        )}

        <div className="settings-field">
          <label className="settings-label">Current Password</label>
          <div className="pw-input-wrap">
            <input
              type={showCurrent ? 'text' : 'password'}
              className="settings-input"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button type="button" className="pw-toggle" onClick={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-label">New Password</label>
          <div className="pw-input-wrap">
            <input
              type={showNew ? 'text' : 'password'}
              className="settings-input"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              autoComplete="new-password"
            />
            <button type="button" className="pw-toggle" onClick={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength indicator */}
          {newPw && (
            <div className="pw-strength">
              <div className="pw-strength-bar">
                <div
                  className="pw-strength-fill"
                  style={{
                    width: newPw.length < 6 ? '25%' : newPw.length < 10 ? '50%' : newPw.length < 14 ? '75%' : '100%',
                    background: newPw.length < 6 ? '#ef4444' : newPw.length < 10 ? '#f59e0b' : '#10a37f'
                  }}
                />
              </div>
              <span className="pw-strength-label">
                {newPw.length < 6 ? 'Too short' : newPw.length < 10 ? 'Fair' : newPw.length < 14 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}
        </div>

        <div className="settings-field">
          <label className="settings-label">Confirm New Password</label>
          <input
            type="password"
            className="settings-input"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
          {confirmPw && confirmPw !== newPw && (
            <span className="pw-mismatch">Passwords do not match</span>
          )}
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <><RefreshCw size={15} className="spin" /> Updating…</> : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Terms & Conditions Section ──────────────────────────── */
function TermsSection() {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Terms & Conditions</h2>
      <div className="legal-content">
        <p className="legal-updated">Last updated: February 2026</p>

        <h3>1. Acceptance of Terms</h3>
        <p>By accessing or using DataDict AI ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.</p>

        <h3>2. Description of Service</h3>
        <p>DataDict AI is an enterprise data dictionary platform that provides AI-powered database analysis, data quality assessment, system discovery, analytics pipelines, and workflow automation. The Service connects to your databases and uses artificial intelligence to generate insights and documentation.</p>

        <h3>3. User Accounts</h3>
        <p>You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.</p>

        <h3>4. Acceptable Use</h3>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Attempt to gain unauthorized access to other users' data or accounts</li>
          <li>Upload malicious code or attempt to compromise the Service's infrastructure</li>
          <li>Share database credentials that you are not authorized to use</li>
          <li>Use the Service to process data in violation of applicable data protection laws</li>
        </ul>

        <h3>5. Data & Privacy</h3>
        <p>We analyze your database metadata (table names, column names, data types, row counts) to provide our services. We do not store your actual data — only metadata and AI-generated summaries. See our Privacy Policy for full details.</p>

        <h3>6. AI-Generated Content</h3>
        <p>The Service uses Mistral AI to generate summaries, insights, and recommendations. AI outputs are provided "as is" and may contain inaccuracies. You should verify AI-generated content before making business decisions based on it.</p>

        <h3>7. Intellectual Property</h3>
        <p>The Service is owned and operated by Team Hakumana. All intellectual property rights in the Service remain with us. Your data remains your property.</p>

        <h3>8. Limitation of Liability</h3>
        <p>The Service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to data loss, service interruptions, or inaccuracies in AI-generated content.</p>

        <h3>9. Termination</h3>
        <p>We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time. Upon termination, your stored preferences and chat history will be deleted.</p>

        <h3>10. Changes to Terms</h3>
        <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>

        <h3>11. Contact</h3>
        <p>For questions about these Terms, contact Team Hakumana through the platform.</p>
      </div>
    </div>
  )
}

/* ── Privacy Policy Section ──────────────────────────────── */
function PrivacySection() {
  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Privacy Policy</h2>
      <div className="legal-content">
        <p className="legal-updated">Last updated: February 2026</p>

        <h3>1. Information We Collect</h3>
        <p><strong>Account Information:</strong> Your email address, display name, and authentication provider (email or Google).</p>
        <p><strong>Database Metadata:</strong> Table names, column names, data types, relationship mappings, and row counts from your connected databases. We do NOT collect or store your actual data rows.</p>
        <p><strong>Usage Data:</strong> Chat history, AI preferences, saved pipelines, workflows, and analytics queries.</p>

        <h3>2. How We Use Your Information</h3>
        <ul>
          <li>To provide and maintain the Service</li>
          <li>To generate AI-powered summaries and insights</li>
          <li>To personalize your experience based on your AI preferences</li>
          <li>To store your chat history and saved configurations</li>
          <li>To improve the Service's functionality and performance</li>
        </ul>

        <h3>3. Data Storage</h3>
        <p>Your account data and preferences are stored in Google Firebase (Firestore). Database connection details are stored on the backend server during your session. We use industry-standard security measures to protect your data.</p>

        <h3>4. Third-Party Services</h3>
        <p>We use the following third-party services:</p>
        <ul>
          <li><strong>Firebase (Google):</strong> Authentication and data storage</li>
          <li><strong>Mistral AI:</strong> AI-powered analysis and chat. Database metadata (table/column names, not actual data) may be sent to Mistral AI for processing</li>
        </ul>

        <h3>5. Data Sharing</h3>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties. Database metadata is shared with Mistral AI solely for the purpose of generating summaries and insights.</p>

        <h3>6. Data Retention</h3>
        <p>Your data is retained as long as your account is active. You may delete your chat history at any time. Upon account deletion, all associated data will be removed within 30 days.</p>

        <h3>7. Your Rights</h3>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your chat history and preferences</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h3>8. Security</h3>
        <p>We implement appropriate technical and organizational measures to protect your data, including encrypted connections (HTTPS), Firebase security rules, and secure authentication.</p>

        <h3>9. Cookies</h3>
        <p>We use minimal cookies required for authentication and session management. No tracking or advertising cookies are used.</p>

        <h3>10. Changes to This Policy</h3>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via the Service.</p>

        <h3>11. Contact</h3>
        <p>For privacy-related inquiries, contact Team Hakumana through the platform.</p>
      </div>
    </div>
  )
}
