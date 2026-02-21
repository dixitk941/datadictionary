import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle, Database, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import gsap from 'gsap'

// Typewriter component
function Typewriter({ texts, speed = 80, deleteSpeed = 40, pauseDuration = 2000 }) {
  const [displayText, setDisplayText] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[textIndex]
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1))
          setCharIndex(charIndex + 1)
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration)
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1))
          setCharIndex(charIndex - 1)
        } else {
          setIsDeleting(false)
          setTextIndex((textIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, textIndex, texts, speed, deleteSpeed, pauseDuration])

  return (
    <span className="typewriter-text">
      {displayText}
      <span className="typewriter-cursor">|</span>
    </span>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const welcomeTexts = [
    'Namaste! Welcome back 🙏',
    'Explore your data with AI',
    'Transform databases into insights',
    'Your data journey starts here',
  ]
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    
    try {
      await loginWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message?.replace('Firebase: ', '') || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }
  
  const pageRef = useRef()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-info-panel', { x: -60, opacity: 0, duration: 0.9, ease: 'power3.out' })
      gsap.from('.auth-brand', { y: -20, opacity: 0, duration: 0.7, delay: 0.3, ease: 'power2.out' })
      gsap.from('.auth-welcome h1', { y: 30, opacity: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' })
      gsap.from('.auth-tagline', { y: 20, opacity: 0, duration: 0.6, delay: 0.7, ease: 'power2.out' })
      gsap.from('.auth-feature', { x: -20, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.9, ease: 'power2.out' })
      gsap.from('.auth-form-panel', { x: 60, opacity: 0, duration: 0.9, delay: 0.2, ease: 'power3.out' })
      gsap.from('.auth-form-header', { y: 20, opacity: 0, duration: 0.6, delay: 0.6, ease: 'power2.out' })
      gsap.from('.form-group', { y: 15, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.8, ease: 'power2.out' })
    }, pageRef)
    return () => ctx.revert()
  }, [])

  return (
    <div className="auth-split-page" ref={pageRef}>
      {/* Left Side - Info Panel */}
      <div className="auth-info-panel">
        <div className="auth-bg-anim"><div className="auth-bg-orb auth-bg-orb-1"></div><div className="auth-bg-orb auth-bg-orb-2"></div><div className="auth-bg-orb auth-bg-orb-3"></div></div>
        <div className="auth-info-content">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-icon">
              <Sparkles size={32} />
            </div>
            <span>DataDict AI</span>
          </Link>
          
          <div className="auth-welcome">
            <h1>
              <Typewriter texts={welcomeTexts} speed={70} deleteSpeed={30} pauseDuration={2500} />
            </h1>
            <p className="auth-tagline">
              Unlock the power of your enterprise data with AI-driven insights and documentation.
            </p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <Database size={20} />
              <span>Multi-database connectivity</span>
            </div>
            <div className="auth-feature">
              <Shield size={20} />
              <span>Enterprise-grade security</span>
            </div>
            <div className="auth-feature">
              <MessageCircle size={20} />
              <span>AI-powered chat assistant</span>
            </div>
          </div>

          <div className="auth-indian-pattern"></div>
        </div>
      </div>

      {/* Right Side - Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to access your account</p>
          </div>
          
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          
          <button
            className="btn btn-outline btn-lg btn-full btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
