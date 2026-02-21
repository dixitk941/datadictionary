import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Sparkles, Shield, MessageCircle, Lock, Zap, ArrowRight, ChevronDown, Play } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroIllustration from '../components/HeroIllustration'

gsap.registerPlugin(ScrollTrigger)

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSAP Cinematic Landing — cinematography-style scroll
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Animated counter (GSAP-powered)
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

  return <span ref={ref} className="cin-counter">0{suffix}</span>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const mainRef = useRef()

  /* ── Master GSAP timeline on mount ── */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {

      /* HERO intro — staggered entrance like a film title sequence */
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .from('.cin-hero .landing-nav', { y: -60, opacity: 0, duration: 0.8 })
        .from('.landing-hero-badge', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.cin-hero-title', { y: 50, opacity: 0, duration: 0.9, scale: 0.97 }, '-=0.4')
        .from('.landing-hero-subtitle', { y: 30, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.landing-hero-actions', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.cin-stats', { y: 30, opacity: 0, duration: 0.7 }, '-=0.2')
        .from('.hero-illustration', { x: 80, opacity: 0, scale: 0.9, duration: 1.1, ease: 'power2.out' }, '-=1.2')
        .from('.landing-scroll-indicator', { opacity: 0, duration: 0.6 }, '-=0.1')

      /* Background glows — slow parallax float */
      gsap.to('.cin-bg-glow-1', {
        y: -120, x: 60,
        scrollTrigger: { trigger: '.landing-page', start: 'top top', end: 'bottom bottom', scrub: 1 },
      })
      gsap.to('.cin-bg-glow-2', {
        y: -80, x: -40,
        scrollTrigger: { trigger: '.landing-page', start: 'top top', end: 'bottom bottom', scrub: 1.5 },
      })
      gsap.to('.cin-bg-glow-3', {
        y: -160, x: 30,
        scrollTrigger: { trigger: '.landing-page', start: 'top top', end: 'bottom bottom', scrub: 2 },
      })

      /* PRODUCT PREVIEW — cinematic scale-up from distance */
      const previewTl = gsap.timeline({
        scrollTrigger: { trigger: '.cin-preview-section', start: 'top 80%', once: true },
      })
      previewTl.fromTo('.cin-preview-window',
        { scale: 0.85, opacity: 0, y: 80, rotateX: 8 },
        { scale: 1, opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: 'power2.out' },
      )
      previewTl.fromTo('.cin-preview-row',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.12, duration: 0.5, ease: 'power2.out' },
        '-=0.6'
      )
      previewTl.fromTo('.cin-preview-ai',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      )

      /* FEATURES — header + cards fly in with stagger */
      const featHeaderTl = gsap.timeline({
        scrollTrigger: { trigger: '.landing-features', start: 'top 85%', once: true },
      })
      featHeaderTl.fromTo('.landing-features .landing-section-header',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      )

      const featCardsTl = gsap.timeline({
        scrollTrigger: { trigger: '.landing-features-grid', start: 'top 90%', once: true },
      })
      featCardsTl.fromTo('.landing-feature-card',
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.7, ease: 'back.out(1.2)' },
      )

      /* HOW IT WORKS — header + steps */
      const howHeaderTl = gsap.timeline({
        scrollTrigger: { trigger: '.landing-how-it-works', start: 'top 85%', once: true },
      })
      howHeaderTl.fromTo('.landing-how-it-works .landing-section-header',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      )
      /* Steps */
      const stepsTl = gsap.timeline({
        scrollTrigger: { trigger: '.cin-steps', start: 'top 88%', once: true },
      })
      stepsTl.fromTo('.cin-step',
        { x: -60, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, stagger: 0.2, duration: 0.8, ease: 'power3.out' },
      )
      stepsTl.fromTo('.cin-step-line',
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left center', stagger: 0.2, duration: 0.6, ease: 'power2.inOut' },
        '-=0.6'
      )

      /* AI SECTION — split reveal: text from left, demo from right */
      const aiTl = gsap.timeline({
        scrollTrigger: { trigger: '.landing-ai-section', start: 'top 85%', once: true },
      })
      aiTl.fromTo('.landing-ai-text',
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
      )
      aiTl.fromTo('.landing-ai-demo',
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
        '-=0.7'
      )
      /* chat messages type in */
      aiTl.fromTo('.chat-preview-message',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.3, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      )

      /* CTA — dramatic scale entrance */
      gsap.fromTo('.landing-cta-content',
        { scale: 0.9, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '.landing-cta', start: 'top 85%', once: true },
        },
      )

      /* FOOTER slide up */
      gsap.fromTo('.landing-footer-content',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6,
          scrollTrigger: { trigger: '.landing-footer', start: 'top 95%', once: true },
        },
      )

    }, mainRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="landing-page cin-page" ref={mainRef}>
      {/* Ambient background */}
      <div className="cin-bg">
        <div className="cin-bg-glow cin-bg-glow-1" />
        <div className="cin-bg-glow cin-bg-glow-2" />
        <div className="cin-bg-glow cin-bg-glow-3" />
        <div className="cin-bg-grid" />
      </div>

      {/* ── SCENE 1: Hero ─────────────────────── */}
      <section className="landing-section landing-hero cin-hero">
        {/* Nav inside hero so GSAP can animate it with the hero TL */}
        <nav className="landing-nav">
          <div className="landing-nav-logo"><Sparkles size={24} /> DataDict AI</div>
          <div className="landing-nav-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </nav>

        <div className="cin-hero-split">
          <div className="landing-hero-content">
            <div className="landing-hero-badge">
              <Sparkles size={14} />
              AI-Powered Data Documentation
            </div>
            <h1 className="cin-hero-title">
              <span className="text-gradient">Understand</span> your databases<br/>in minutes
            </h1>
            <p className="landing-hero-subtitle">
              Connect to any database, extract metadata automatically, analyze data quality,
              and generate business-friendly documentation — all with AI assistance.
            </p>
            <div className="landing-hero-actions">
              <button className="btn btn-primary btn-lg cin-btn-glow" onClick={() => navigate('/signup')}>
                Get Started Free <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                <Play size={16} /> Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="cin-stats">
              <div className="cin-stat">
                <Counter end={50} suffix="+" /><span>Databases Supported</span>
              </div>
              <div className="cin-stat-divider" />
              <div className="cin-stat">
                <Counter end={10} suffix="x" /><span>Faster Documentation</span>
              </div>
              <div className="cin-stat-divider" />
              <div className="cin-stat">
                <Counter end={99} suffix="%" /><span>Accuracy Rate</span>
              </div>
            </div>
          </div>

          {/* Hero SVG Illustration */}
          <HeroIllustration />
        </div>
        <div className="landing-scroll-indicator">
          <ChevronDown size={24} /><span>Scroll to explore</span>
        </div>
      </section>

      {/* ── SCENE 2: Product Preview ──────────── */}
      <section className="landing-section cin-preview-section">
        <div className="cin-preview">
          <div className="cin-preview-window">
            <div className="cin-preview-titlebar">
              <div className="cin-dot red" /><div className="cin-dot yellow" /><div className="cin-dot green" />
              <span>DataDict AI — Dashboard</span>
            </div>
            <div className="cin-preview-body">
              <div className="cin-preview-sidebar">
                <div className="cin-preview-nav-item active"><Database size={14} /> Connections</div>
                <div className="cin-preview-nav-item"><Shield size={14} /> Quality</div>
                <div className="cin-preview-nav-item"><MessageCircle size={14} /> AI Chat</div>
              </div>
              <div className="cin-preview-main">
                <div className="cin-preview-card">
                  <div className="cin-preview-card-header">customers</div>
                  <div className="cin-preview-row"><span>id</span><span className="cin-tag">PRIMARY KEY</span></div>
                  <div className="cin-preview-row"><span>email</span><span className="cin-tag">VARCHAR</span></div>
                  <div className="cin-preview-row"><span>created_at</span><span className="cin-tag">TIMESTAMP</span></div>
                </div>
                <div className="cin-preview-ai">
                  <Sparkles size={12} /> AI: "The customers table stores user profiles with 98% completeness"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCENE 3: Features ─────────────────── */}
      <section className="landing-section landing-features">
        <div className="landing-section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to understand and document your data</p>
        </div>
        <div className="landing-features-grid">
          {[
            {
              icon: Database,
              title: 'Multi-Database Connectivity',
              desc: 'Connect to PostgreSQL, SQL Server, Snowflake, and SQLite. Secure credential management with connection testing and validation built in.',
            },
            {
              icon: Zap,
              title: 'Automatic Schema Extraction',
              desc: 'Extract tables, views, columns, data types, primary & foreign keys, indexes, constraints, and table relationships — all automatically.',
            },
            {
              icon: Shield,
              title: 'Data Quality Analysis',
              desc: 'Completeness scores, uniqueness metrics, statistical summaries (mean, stddev, min/max), text length analysis, and overall quality scores per table.',
            },
            {
              icon: Sparkles,
              title: 'AI-Powered Documentation ✨',
              desc: 'Personalized AI summaries via Mistral AI with 4 user profiles (beginner, business, technical, default) and industry-specific explanations.',
            },
            {
              icon: MessageCircle,
              title: 'Interactive AI Chat 💬',
              desc: 'Natural language Q&A about your database with context-aware, multi-turn conversations. Per-table chat history persisted in Firebase Firestore.',
            },
            {
              icon: Lock,
              title: 'Firebase Authentication 🔐',
              desc: 'Email/password and Google OAuth sign-in with full user session management and protected routes for enterprise-grade security.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div className="landing-feature-card" key={title}>
              <div className="landing-feature-icon"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCENE 4: How It Works ─────────────── */}
      <section className="landing-section landing-how-it-works">
        <div className="landing-section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </div>
        <div className="cin-steps">
          {[
            { num: '1', h: 'Connect Your Database', p: 'Add your database credentials securely. We support all major databases.' },
            { num: '2', h: 'Analyze & Extract',     p: 'We automatically scan your schema and analyze data quality metrics.' },
            { num: '3', h: 'Chat & Document',       p: 'Ask questions, generate documentation, and share insights with your team.' },
          ].map(({ num, h, p: desc }) => (
            <div className="cin-step" key={num}>
              <div className="cin-step-num">{num}</div>
              <div className="cin-step-line" />
              <h3>{h}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SCENE 5: AI Section ───────────────── */}
      <section className="landing-section landing-ai-section">
        <div className="landing-ai-content">
          <div className="landing-ai-text">
            <h2><Sparkles size={32} style={{ color: '#10a37f' }} /> Powered by AI</h2>
            <p>
              Our platform uses Mistral AI to understand your data context and provide
              intelligent responses. Ask anything about your database schemas, relationships,
              or data quality — and get instant, accurate answers.
            </p>
            <ul className="landing-ai-features">
              <li>Natural language queries about your data</li>
              <li>Auto-generated table and column descriptions</li>
              <li>Smart suggestions for data quality improvements</li>
              <li>Context-aware chat history per table</li>
            </ul>
          </div>
          <div className="landing-ai-demo">
            <div className="landing-chat-preview">
              <div className="chat-preview-message user">What columns store customer contact info?</div>
              <div className="chat-preview-message assistant">
                Based on the schema, customer contact information is stored in the <strong>customers</strong> table
                with columns: email, phone, address_line1, city, state, and postal_code.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCENE 6: CTA ──────────────────────── */}
      <section className="landing-section landing-cta">
        <div className="landing-cta-content">
          <h2>Ready to understand your data?</h2>
          <p>Start using DataDict AI today — no credit card required.</p>
          <button className="btn btn-primary btn-lg cin-btn-glow" onClick={() => navigate('/signup')}>
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo"><Sparkles size={20} /> DataDict AI</div>
          <p>© 2026 DataDict AI. Built with ❤️ for data teams.</p>
        </div>
      </footer>
    </div>
  )
}
