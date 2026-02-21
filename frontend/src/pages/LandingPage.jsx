import { useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database, Sparkles, Shield, MessageCircle, Lock, Zap,
  ArrowRight, ArrowUpRight, ChevronDown,
  BarChart3, Layers, Brain, Workflow, Table2
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

gsap.registerPlugin(ScrollTrigger)

/* ── Animated counter ── */
function Counter({ end, suffix = '' }) {
  const ref = useRef()
  const numRef = useRef({ val: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(numRef.current, {
          val: end,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = Math.round(numRef.current.val) + suffix
          },
        })
      },
    })
    return () => st.kill()
  }, [end, suffix])

  return <span ref={ref} className="tg-counter">0{suffix}</span>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const mainRef = useRef()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      /* NAV — slide down + fade in from above */
      gsap.from('.tg-nav', { y: -60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.1 })

      /* HERO CARD — cinematic entrance ── */
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .from('.tg-hero-card', {
          y: 80, opacity: 0, scale: 0.92, rotateX: 6,
          duration: 1.3, ease: 'power4.out',
        })
        .from('.tg-hero-grid', { opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.tg-hero-title', {
          y: 50, opacity: 0, duration: 0.9,
          ease: 'power3.out',
        }, '-=0.5')
        .from('.tg-hero-sub', {
          y: 35, opacity: 0, duration: 0.8,
          ease: 'power2.out',
        }, '-=0.4')
        .from('.tg-hero-actions', {
          y: 25, opacity: 0, scale: 0.95, duration: 0.7,
        }, '-=0.3')
        .from('.tg-hero-lottie', {
          y: 60, opacity: 0, scale: 0.85,
          duration: 1.1, ease: 'power4.out',
        }, '-=0.6')

      /* HERO SHAPES — stagger pop-in with spring */
      gsap.from('.tg-shape', {
        scale: 0, opacity: 0, rotation: -30,
        stagger: { each: 0.12, from: 'random' },
        duration: 0.9,
        ease: 'back.out(2)',
        delay: 0.6,
      })

      /* HERO SHAPES — infinite floating drift */
      document.querySelectorAll('.tg-shape').forEach((shape, i) => {
        const dir = i % 2 === 0 ? 1 : -1
        gsap.to(shape, {
          y: `+=${dir * (15 + i * 5)}`,
          x: `+=${-dir * (10 + i * 3)}`,
          rotation: `+=${dir * 8}`,
          duration: 4 + i * 0.7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
      })

      /* HERO GRID — subtle parallax on scroll */
      gsap.to('.tg-hero-grid', {
        backgroundPosition: '25px 25px',
        ease: 'none',
        scrollTrigger: {
          trigger: '.tg-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      })

      /* SCROLL HINT — pulse + fade as you scroll */
      gsap.to('.tg-scroll-hint', {
        opacity: 0,
        y: 20,
        scrollTrigger: {
          trigger: '.tg-hero',
          start: '80% top',
          end: 'bottom top',
          scrub: true,
        },
      })

      /* STATS */
      const statsTl = gsap.timeline({
        scrollTrigger: { trigger: '.tg-stats', start: 'top 85%', once: true },
      })
      statsTl
        .from('.tg-stats-heading', { y: 40, opacity: 0, duration: 0.8 })
        .from('.tg-stat-card', { y: 50, opacity: 0, scale: 0.95, stagger: 0.15, duration: 0.7 }, '-=0.4')

      /* FEATURES (alternating rows) */
      document.querySelectorAll('.tg-feature-row').forEach((row) => {
        gsap.from(row.querySelectorAll('.tg-feat-text, .tg-feat-visual'), {
          y: 50, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 85%', once: true },
        })
      })

      /* FEATURE GRID */
      const gridTl = gsap.timeline({
        scrollTrigger: { trigger: '.tg-grid-section', start: 'top 85%', once: true },
      })
      gridTl
        .from('.tg-grid-section .tg-section-heading', { y: 40, opacity: 0, duration: 0.8 })
        .from('.tg-feature-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'back.out(1.2)' }, '-=0.3')

      /* HOW IT WORKS */
      const stepsTl = gsap.timeline({
        scrollTrigger: { trigger: '.tg-steps-section', start: 'top 85%', once: true },
      })
      stepsTl
        .from('.tg-steps-section .tg-section-heading', { y: 40, opacity: 0, duration: 0.8 })
        .from('.tg-step', { x: -40, opacity: 0, stagger: 0.2, duration: 0.7, ease: 'power3.out' }, '-=0.3')

      /* CTA */
      gsap.from('.tg-cta-inner', {
        scale: 0.92, opacity: 0, y: 40, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.tg-cta', start: 'top 85%', once: true },
      })

      /* FOOTER */
      gsap.from('.tg-footer-inner', {
        y: 20, opacity: 0, duration: 0.6,
        scrollTrigger: { trigger: '.tg-footer', start: 'top 95%', once: true },
      })
    }, mainRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="tg-landing" ref={mainRef}>

      {/* ── Navbar ──────────────────────────────── */}
      <nav className="tg-nav">
        <div className="tg-nav-inner">
          <div className="tg-nav-logo" onClick={() => navigate('/')}>
            <Sparkles size={22} /> DataDict AI
          </div>
          <div className="tg-nav-links">
            <a href="#features">Features</a>
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <div className="tg-nav-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="tg-nav-cta" onClick={() => navigate('/signup')}>
              Get Started <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────── */}
      <section className="tg-hero">
        <div className="tg-hero-card">
          {/* Grid pattern overlay */}
          <div className="tg-hero-grid" />
          {/* Geometric shapes */}
          <div className="tg-hero-shapes">
            <div className="tg-shape tg-shape-1" />
            <div className="tg-shape tg-shape-2" />
            <div className="tg-shape tg-shape-3" />
            <div className="tg-shape tg-shape-4" />
            <div className="tg-shape tg-shape-5" />
            <div className="tg-shape tg-shape-6" />
          </div>
          <div className="tg-hero-body">
            <div className="tg-hero-content">
              <h1 className="tg-hero-title">
                The AI-Powered<br />Data Dictionary
              </h1>
              <p className="tg-hero-sub">
                Our platform connects to your databases, extracts schemas<br className="hide-mobile" />
                automatically, and generates intelligent documentation<br className="hide-mobile" />
                with AI agents and human collaboration.
              </p>
              <div className="tg-hero-actions">
                <button className="tg-btn-accent" onClick={() => navigate('/signup')}>
                  Get Started Free <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="tg-hero-lottie">
              <DotLottieReact
                src="https://lottie.host/a6389e90-a40d-4b1b-8838-e4a61e250fe7/dtGPRnFA0p.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
        <div className="tg-scroll-hint">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ── Stats ──────────────────────────────── */}
      <section className="tg-stats">
        <h2 className="tg-stats-heading">
          Real outcomes at<br />breakthrough speed.
        </h2>
        <div className="tg-stats-grid">
          <div className="tg-stat-card tg-stat-light">
            <div className="tg-stat-bars">
              <div className="tg-stat-bar-row">
                <span className="tg-stat-bar-label">TRADITIONAL</span>
                <span className="tg-stat-bar-label">WEEKS</span>
              </div>
              <div className="tg-stat-bar tg-stat-bar-dark" style={{ width: '85%' }} />
              <div className="tg-stat-bar-row">
                <span className="tg-stat-bar-label">DATADICT AI</span>
                <span className="tg-stat-bar-label">MINUTES</span>
              </div>
              <div className="tg-stat-bar tg-stat-bar-accent" style={{ width: '25%' }} />
            </div>
            <div className="tg-stat-big">
              <Counter end={10} suffix="x" />
              <span>Faster Documentation</span>
            </div>
          </div>
          <div className="tg-stat-card tg-stat-dark">
            <div className="tg-stat-dots">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`tg-dot ${i < 15 ? 'active' : ''}`} />
              ))}
            </div>
            <div className="tg-stat-big">
              <Counter end={99} suffix="%" />
              <span>Schema Accuracy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Features (alternating Turgon-style) ── */}
      <section className="tg-platform" id="platform">
        <h2 className="tg-section-heading tg-section-heading-center">
          Meet Your Data Intelligence Platform
        </h2>

        {/* Feature 1: AI Documentation */}
        <div className="tg-feature-row">
          <div className="tg-feat-text">
            <div className="tg-feat-icon-circle">
              <Brain size={24} />
            </div>
            <span className="tg-badge">AI DOCUMENTATION</span>
            <h3>Don't just store your schema.<br />Understand it.</h3>
            <p>
              Our AI agents analyze your database structure and generate business-friendly
              documentation automatically — explaining tables, columns, and relationships
              in plain language.
            </p>
            <ul className="tg-feat-list">
              <li><strong>4 AI Profiles:</strong> Beginner, Business, Technical & Balanced explanations</li>
              <li><strong>Industry Context:</strong> E-commerce, healthcare, finance and more</li>
            </ul>
          </div>
          <div className="tg-feat-visual">
            <div className="tg-feat-preview">
              <div className="tg-preview-header">
                <Database size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <strong>Data Dictionary Assistant</strong>
                  <span className="text-muted text-sm">AI Assistant for your database</span>
                </div>
              </div>
              <div className="tg-preview-chat">
                <div className="tg-preview-msg tg-preview-msg-ai">
                  <Sparkles size={14} /> Hello! I'm your Data Dictionary Assistant. I can help you understand your data structure and answer questions.
                </div>
                <div className="tg-preview-chip">Where can I find info for sales by region?</div>
                <div className="tg-preview-msg tg-preview-msg-ai">
                  <Sparkles size={14} /> To find information about sales by region, check these tables: <strong>IN692W1</strong> — detailed sales by region, store, and product.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Data Quality */}
        <div className="tg-feature-row tg-row-reverse">
          <div className="tg-feat-text">
            <div className="tg-feat-icon-circle">
              <Shield size={24} />
            </div>
            <span className="tg-badge">DATA QUALITY</span>
            <h3>Don't let bad data drive<br />your business decisions.</h3>
            <p>
              We analyze completeness, uniqueness, and statistical distributions across
              every column — turning raw schemas into actionable quality insights.
            </p>
            <ul className="tg-feat-list">
              <li><strong>Completeness:</strong> Null detection and fill-rate scoring per column</li>
              <li><strong>Statistics:</strong> Mean, stddev, min/max, and distribution analysis</li>
            </ul>
          </div>
          <div className="tg-feat-visual">
            <div className="tg-feat-quality-demo">
              <div className="tg-quality-header">
                <Shield size={18} /> Data Quality Report
              </div>
              <div className="tg-quality-bars">
                {[
                  { name: 'Completeness', val: 96 },
                  { name: 'Uniqueness', val: 82 },
                  { name: 'Validity', val: 91 },
                  { name: 'Consistency', val: 88 },
                ].map(({ name, val }) => (
                  <div key={name} className="tg-qbar-row">
                    <span>{name}</span>
                    <div className="tg-qbar-track">
                      <div className="tg-qbar-fill" style={{ width: `${val}%` }} />
                    </div>
                    <span className="tg-qbar-val">{val}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Multi-DB */}
        <div className="tg-feature-row">
          <div className="tg-feat-text">
            <div className="tg-feat-icon-circle">
              <Layers size={24} />
            </div>
            <span className="tg-badge">MULTI-DATABASE</span>
            <h3>Connect once.<br />Document everything.</h3>
            <p>
              Support for PostgreSQL, SQL Server, Snowflake, and SQLite — with secure credential
              management and real-time connection testing built in.
            </p>
            <ul className="tg-feat-list">
              <li><strong>Auto-discovery:</strong> Tables, views, columns, keys, indexes, and constraints</li>
              <li><strong>Relationships:</strong> Foreign key mapping and dependency graphs</li>
            </ul>
          </div>
          <div className="tg-feat-visual">
            <div className="tg-feat-db-grid">
              {[
                { name: 'PostgreSQL', icon: '🐘' },
                { name: 'SQL Server', icon: '📊' },
                { name: 'Snowflake', icon: '❄️' },
                { name: 'SQLite', icon: '💾' },
              ].map(db => (
                <div key={db.name} className="tg-db-card">
                  <span className="tg-db-icon">{db.icon}</span>
                  <span className="tg-db-name">{db.name}</span>
                </div>
              ))}
              <div className="tg-db-center">
                <Sparkles size={28} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────── */}
      <section className="tg-grid-section" id="features">
        <h2 className="tg-section-heading tg-section-heading-center">
          Everything You Need
        </h2>
        <div className="tg-features-grid">
          {[
            { icon: Database, title: 'Multi-Database Connectivity', desc: 'PostgreSQL, SQL Server, Snowflake, SQLite — connect and document securely.' },
            { icon: Zap, title: 'Auto Schema Extraction', desc: 'Tables, views, columns, keys, indexes, constraints — all discovered automatically.' },
            { icon: Shield, title: 'Data Quality Analysis', desc: 'Completeness, uniqueness, statistical summaries, and quality scores per table.' },
            { icon: Sparkles, title: 'AI Documentation', desc: 'Mistral AI generates personalized documentation with 4 user profiles.' },
            { icon: MessageCircle, title: 'Interactive AI Chat', desc: 'Natural language Q&A with context-aware, multi-turn conversations.' },
            { icon: Lock, title: 'Enterprise Security', desc: 'Firebase Auth with email/password and Google OAuth for enterprise-grade access.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div className="tg-feature-card" key={title}>
              <div className="tg-feature-card-icon"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────── */}
      <section className="tg-steps-section" id="how-it-works">
        <h2 className="tg-section-heading tg-section-heading-center">
          How It Works
        </h2>
        <div className="tg-steps">
          {[
            { num: '1', icon: Database, h: 'Connect Your Database', p: 'Add credentials securely. We support all major SQL databases with encrypted storage.' },
            { num: '2', icon: BarChart3, h: 'Analyze & Extract', p: 'We automatically scan your schema, profile data quality, and map relationships.' },
            { num: '3', icon: Brain, h: 'Chat & Document', p: 'Ask questions in plain language, generate docs, and share insights with your team.' },
          ].map(({ num, icon: Icon, h, p: desc }) => (
            <div className="tg-step" key={num}>
              <div className="tg-step-num">{num}</div>
              <div className="tg-step-icon"><Icon size={22} /></div>
              <h3>{h}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────── */}
      <section className="tg-cta">
        <div className="tg-cta-inner">
          <h2>Ready to understand your data?</h2>
          <p>Start documenting your databases with AI — no credit card required.</p>
          <div className="tg-cta-buttons">
            <button className="tg-btn-accent tg-btn-lg" onClick={() => navigate('/signup')}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button className="tg-btn-outline-dark tg-btn-lg" onClick={() => navigate('/login')}>
              Sign In <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="tg-footer">
        <div className="tg-footer-inner">
          <div className="tg-footer-logo"><Sparkles size={18} /> DataDict AI</div>
          <p>© 2026 DataDict AI. Developed and created by team Hackunama.</p>
        </div>
      </footer>
    </div>
  )
}
