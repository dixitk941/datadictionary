import { useRef, useLayoutEffect } from 'react'
import gsap from 'gsap'

/*
  Hero SVG — an animated data-network illustration
  Central database cylinder with orbiting nodes connected by glowing paths,
  plus floating data particles.  All elements animate in via GSAP timeline.
*/
export default function HeroIllustration() {
  const svgRef = useRef()

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      /* ── Entrance sequence ── */
      // Central DB cylinder scales + fades in
      tl.from('.hero-svg-db', { scale: 0, opacity: 0, transformOrigin: '250px 220px', duration: 0.9 })
      // Connection lines draw in (stroke-dashoffset)
      tl.from('.hero-svg-line', {
        strokeDashoffset: 200,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
      }, '-=0.5')
      // Outer nodes pop in
      tl.from('.hero-svg-node', {
        scale: 0, opacity: 0,
        transformOrigin: 'center center',
        stagger: 0.06,
        duration: 0.5,
        ease: 'back.out(2)',
      }, '-=0.4')
      // Labels fade in
      tl.from('.hero-svg-label', { opacity: 0, y: 8, stagger: 0.05, duration: 0.4 }, '-=0.2')
      // Floating particles fade in
      tl.from('.hero-svg-particle', { opacity: 0, scale: 0, stagger: 0.04, duration: 0.3 }, '-=0.3')
      // Pulse rings
      tl.from('.hero-svg-ring', { scale: 0, opacity: 0, transformOrigin: '250px 220px', stagger: 0.15, duration: 0.6 }, '-=0.4')

      /* ── Continuous ambient animations ── */
      // DB glow pulses
      gsap.to('.hero-svg-db-glow', {
        opacity: 0.25, scale: 1.1, transformOrigin: '250px 220px',
        yoyo: true, repeat: -1, duration: 2.5, ease: 'sine.inOut',
      })

      // Nodes gently float
      gsap.utils.toArray('.hero-svg-node').forEach((node, i) => {
        gsap.to(node, {
          y: `+=${6 + i * 1.5}`, x: `+=${(i % 2 === 0 ? 3 : -3)}`,
          yoyo: true, repeat: -1,
          duration: 2.5 + i * 0.3,
          ease: 'sine.inOut',
          delay: i * 0.2,
        })
      })

      // Particles travel along paths
      gsap.utils.toArray('.hero-svg-particle').forEach((p, i) => {
        gsap.to(p, {
          motionPath: {
            path: `.hero-svg-line-${(i % 6) + 1}`,
            align: `.hero-svg-line-${(i % 6) + 1}`,
            alignOrigin: [0.5, 0.5],
          },
          duration: 3 + i * 0.4,
          repeat: -1,
          ease: 'none',
          delay: i * 0.6,
        })
      })

      // Pulse rings expand outward forever
      gsap.utils.toArray('.hero-svg-ring').forEach((ring, i) => {
        gsap.to(ring, {
          scale: 1.8, opacity: 0, transformOrigin: '250px 220px',
          duration: 3,
          repeat: -1,
          delay: i * 1,
          ease: 'power1.out',
        })
      })

      // Data flow dots travel along connections
      gsap.utils.toArray('.hero-svg-flow').forEach((dot, i) => {
        const line = dot.closest('g')?.querySelector('line, path') 
        gsap.fromTo(dot,
          { attr: { offset: '0%' } },
          { attr: { offset: '100%' }, duration: 2 + i * 0.3, repeat: -1, ease: 'none', delay: i * 0.5 }
        )
      })

    }, svgRef)

    return () => ctx.revert()
  }, [])

  // Node positions around center (250, 220)
  const nodes = [
    { x: 100, y: 80,  icon: '⊞', label: 'Tables',   color: '#10a37f' },
    { x: 400, y: 80,  icon: '⬡', label: 'Schema',   color: '#3b82f6' },
    { x: 440, y: 220, icon: '◈', label: 'Quality',   color: '#8b5cf6' },
    { x: 400, y: 360, icon: '⬢', label: 'Relations', color: '#f59e0b' },
    { x: 100, y: 360, icon: '◉', label: 'AI Chat',   color: '#ef4444' },
    { x: 60,  y: 220, icon: '⊕', label: 'Metadata',  color: '#06b6d4' },
  ]

  return (
    <div className="hero-illustration" ref={svgRef}>
      <svg viewBox="0 0 500 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-svg">
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for lines */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10a37f" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10a37f" stopOpacity="0.15" />
          </linearGradient>
          {/* Radial glow for center */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10a37f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10a37f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pulse rings from center */}
        <circle className="hero-svg-ring" cx="250" cy="220" r="50" stroke="#10a37f" strokeWidth="1" fill="none" opacity="0.3" />
        <circle className="hero-svg-ring" cx="250" cy="220" r="50" stroke="#10a37f" strokeWidth="0.5" fill="none" opacity="0.2" />

        {/* Center DB glow */}
        <circle className="hero-svg-db-glow" cx="250" cy="220" r="80" fill="url(#centerGlow)" />

        {/* Connection lines from center to each node */}
        {nodes.map((n, i) => (
          <line
            key={`line-${i}`}
            className={`hero-svg-line hero-svg-line-${i + 1}`}
            x1="250" y1="220" x2={n.x} y2={n.y}
            stroke={n.color}
            strokeWidth="1.5"
            strokeOpacity="0.35"
            strokeDasharray="200"
            strokeDashoffset="0"
          />
        ))}

        {/* Secondary connection arcs between adjacent nodes */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length]
          return (
            <line
              key={`arc-${i}`}
              className="hero-svg-line"
              x1={n.x} y1={n.y} x2={next.x} y2={next.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          )
        })}

        {/* Central database icon */}
        <g className="hero-svg-db" filter="url(#glow)">
          {/* DB cylinder body */}
          <rect x="222" y="200" width="56" height="44" rx="4" fill="#0d0d0d" stroke="#10a37f" strokeWidth="1.5" />
          {/* DB cylinder top ellipse */}
          <ellipse cx="250" cy="200" rx="28" ry="10" fill="#0d0d0d" stroke="#10a37f" strokeWidth="1.5" />
          {/* DB stripes */}
          <ellipse cx="250" cy="215" rx="28" ry="8" fill="none" stroke="#10a37f" strokeWidth="0.5" strokeOpacity="0.4" />
          <ellipse cx="250" cy="230" rx="28" ry="8" fill="none" stroke="#10a37f" strokeWidth="0.5" strokeOpacity="0.4" />
          {/* Green accent dot */}
          <circle cx="250" cy="200" r="3" fill="#10a37f" opacity="0.8" />
        </g>

        {/* Outer nodes */}
        {nodes.map((n, i) => (
          <g key={`node-${i}`} className="hero-svg-node">
            {/* Node bg circle */}
            <circle cx={n.x} cy={n.y} r="28" fill="#0a0a0a" stroke={n.color} strokeWidth="1.2" strokeOpacity="0.5" />
            <circle cx={n.x} cy={n.y} r="28" fill={n.color} fillOpacity="0.06" />
            {/* Icon */}
            <text x={n.x} y={n.y + 2} textAnchor="middle" dominantBaseline="middle"
              fontSize="18" fill={n.color} fontFamily="monospace" opacity="0.9">
              {n.icon}
            </text>
          </g>
        ))}

        {/* Node labels */}
        {nodes.map((n, i) => (
          <text
            key={`lbl-${i}`}
            className="hero-svg-label"
            x={n.x}
            y={n.y + 42}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(255,255,255,0.5)"
            fontFamily="'Onest', sans-serif"
          >
            {n.label}
          </text>
        ))}

        {/* Small floating data particles */}
        {[
          { cx: 170, cy: 150 }, { cx: 330, cy: 150 }, { cx: 350, cy: 290 },
          { cx: 170, cy: 290 }, { cx: 250, cy: 120 }, { cx: 250, cy: 330 },
          { cx: 140, cy: 220 }, { cx: 360, cy: 220 }, { cx: 200, cy: 100 },
          { cx: 300, cy: 340 }, { cx: 380, cy: 140 }, { cx: 120, cy: 310 },
        ].map((p, i) => (
          <circle
            key={`p-${i}`}
            className="hero-svg-particle"
            cx={p.cx} cy={p.cy}
            r={1.5 + (i % 3) * 0.5}
            fill={nodes[i % nodes.length].color}
            opacity={0.5 + (i % 3) * 0.15}
          />
        ))}

        {/* Animated data flow dots on lines */}
        {nodes.map((n, i) => (
          <circle
            key={`flow-${i}`}
            className="hero-svg-flow"
            r="2.5"
            fill={n.color}
            opacity="0.7"
            filter="url(#glow)"
          >
            <animateMotion
              dur={`${2.5 + i * 0.4}s`}
              repeatCount="indefinite"
              path={`M250,220 L${n.x},${n.y}`}
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}
