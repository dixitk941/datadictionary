import { useState, useRef, useLayoutEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Sparkles, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import gsap from 'gsap'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, loginWithGoogle } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pageRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) return setError('Passwords do not match')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await signup(email, password, name)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to sign up with Google')
    } finally {
      setLoading(false)
    }
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.da-nav', { y: -50, opacity: 0, duration: 0.8, ease: 'power3.out' })
      gsap.from('.da-card', { y: 60, opacity: 0, scale: 0.96, duration: 1, delay: 0.15, ease: 'power4.out' })
      gsap.from('.da-shape', { scale: 0, opacity: 0, stagger: { each: 0.08, from: 'random' }, duration: 0.7, delay: 0.3, ease: 'back.out(2)' })
      gsap.from('.da-card-header', { y: 25, opacity: 0, duration: 0.7, delay: 0.5, ease: 'power3.out' })
      gsap.from('.da-form .form-group', { y: 18, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.65, ease: 'power2.out' })
      gsap.from('.da-card-footer', { y: 15, opacity: 0, duration: 0.5, delay: 0.9, ease: 'power2.out' })
      document.querySelectorAll('.da-shape').forEach((s, i) => {
        const d = i % 2 === 0 ? 1 : -1
        gsap.to(s, { y: `+=${d * (12 + i * 4)}`, x: `+=${-d * (8 + i * 3)}`, rotation: `+=${d * 6}`, duration: 4 + i * 0.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
      })
    }, pageRef)
    return () => ctx.revert()
  }, [])

  return (
    <div className="da-page" ref={pageRef}>
      {/* Floating shapes background */}
      <div className="da-bg-shapes">
        <div className="da-shape da-sh-1" />
        <div className="da-shape da-sh-2" />
        <div className="da-shape da-sh-3" />
        <div className="da-shape da-sh-4" />
        <div className="da-shape da-sh-5" />
      </div>

      {/* Floating nav pill */}
      <nav className="da-nav">
        <Link to="/" className="da-nav-back"><ArrowLeft size={16} /> Home</Link>
        <div className="da-nav-logo"><Sparkles size={18} /> DataDict AI</div>
        <Link to="/login" className="da-nav-link">Sign In</Link>
      </nav>

      {/* Detached card */}
      <div className="da-card">
        <div className="da-card-header">
          <h1>Create your account</h1>
          <p>Start documenting your data with AI</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="da-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="da-form-row">
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
            <div className="form-group">
              <label>Confirm</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
          </div>

          <button type="submit" className="da-btn-accent da-btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="da-divider"><span>or</span></div>

        <button className="da-btn-outline da-btn-full da-btn-google" onClick={handleGoogleSignup} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="da-card-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
