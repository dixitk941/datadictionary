import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment, Text3D, Center } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { Database, Sparkles, Shield, MessageCircle, TrendingUp, Zap, ArrowRight, ChevronDown } from 'lucide-react'
import * as THREE from 'three'

// Animated floating shape that follows scroll
function ScrollingObject({ scrollProgress, color, startSection, endSection, shape = 'sphere' }) {
  const meshRef = useRef()
  const { viewport } = useThree()
  
  useFrame(() => {
    if (!meshRef.current) return
    
    const sectionProgress = Math.max(0, Math.min(1, 
      (scrollProgress - startSection) / (endSection - startSection)
    ))
    
    // Move from right side of one section to left side of next
    const startX = viewport.width * 0.35
    const endX = -viewport.width * 0.35
    const x = startX + (endX - startX) * sectionProgress
    
    // Vertical movement following scroll
    const startY = (1 - startSection * 2) * viewport.height * 0.3
    const endY = (1 - endSection * 2) * viewport.height * 0.3
    const y = startY + (endY - startY) * sectionProgress
    
    meshRef.current.position.x = x
    meshRef.current.position.y = y
    meshRef.current.position.z = -2 + sectionProgress * 4
    
    // Rotation based on scroll
    meshRef.current.rotation.x = sectionProgress * Math.PI * 2
    meshRef.current.rotation.y = sectionProgress * Math.PI * 3
    
    // Scale pulse
    const scale = 1 + Math.sin(sectionProgress * Math.PI) * 0.3
    meshRef.current.scale.setScalar(scale)
  })
  
  const geometry = shape === 'box' 
    ? <boxGeometry args={[1, 1, 1]} />
    : shape === 'torus'
    ? <torusGeometry args={[0.5, 0.2, 16, 32]} />
    : shape === 'icosahedron'
    ? <icosahedronGeometry args={[0.6, 0]} />
    : <sphereGeometry args={[0.5, 32, 32]} />
  
  return (
    <mesh ref={meshRef}>
      {geometry}
      <MeshDistortMaterial
        color={color}
        envMapIntensity={0.4}
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.1}
        roughness={0.2}
        distort={0.4}
        speed={2}
      />
    </mesh>
  )
}

// Background particles
function Particles({ count = 200 }) {
  const pointsRef = useRef()
  
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#10a37f"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Main 3D Scene
function Scene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, 5]} intensity={0.5} color="#10a37f" />
      
      <Particles />
      
      {/* Hero section object - moves to Features */}
      <ScrollingObject
        scrollProgress={scrollProgress}
        color="#10a37f"
        startSection={0}
        endSection={0.25}
        shape="sphere"
      />
      
      {/* Features to Quality section */}
      <ScrollingObject
        scrollProgress={scrollProgress}
        color="#1e90ff"
        startSection={0.25}
        endSection={0.5}
        shape="box"
      />
      
      {/* Quality to AI section */}
      <ScrollingObject
        scrollProgress={scrollProgress}
        color="#8b5cf6"
        startSection={0.5}
        endSection={0.75}
        shape="torus"
      />
      
      {/* AI to CTA section */}
      <ScrollingObject
        scrollProgress={scrollProgress}
        color="#f59e0b"
        startSection={0.75}
        endSection={1}
        shape="icosahedron"
      />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0, -5]}>
          <dodecahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#10a37f"
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
      
      <Environment preset="city" />
    </>
  )
}

// Feature card component
function FeatureCard({ icon: Icon, title, description, delay = 0 }) {
  return (
    <div className="landing-feature-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="landing-feature-icon">
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const containerRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollTop = window.scrollY
      const docHeight = containerRef.current.scrollHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, scrollTop / docHeight))
      setScrollProgress(progress)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div className="landing-page" ref={containerRef}>
      {/* Fixed Canvas Background */}
      <div className="landing-canvas-container">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <Sparkles size={24} />
          DataDict AI
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="landing-section landing-hero">
        <div className="landing-hero-content">
          <h1>
            <span className="text-gradient">AI-Powered</span>
            <br />
            Data Dictionary
          </h1>
          <p className="landing-hero-subtitle">
            Connect to any database, extract metadata automatically, analyze data quality,
            and generate business-friendly documentation with AI assistance.
          </p>
          <div className="landing-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
              Start Free <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
        <div className="landing-scroll-indicator">
          <ChevronDown size={32} />
          <span>Scroll to explore</span>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="landing-section landing-features">
        <div className="landing-section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need to understand and document your data</p>
        </div>
        <div className="landing-features-grid">
          <FeatureCard
            icon={Database}
            title="Multi-Database Support"
            description="Connect to PostgreSQL, SQL Server, Snowflake, SQLite and more. One platform for all your databases."
            delay={0}
          />
          <FeatureCard
            icon={Zap}
            title="Auto Schema Extraction"
            description="Automatically extract tables, columns, relationships, and constraints from your database."
            delay={100}
          />
          <FeatureCard
            icon={Shield}
            title="Data Quality Analysis"
            description="Identify null values, duplicates, data patterns, and anomalies across your entire database."
            delay={200}
          />
          <FeatureCard
            icon={Sparkles}
            title="AI Documentation"
            description="Generate human-readable descriptions for tables and columns using advanced AI models."
            delay={300}
          />
          <FeatureCard
            icon={MessageCircle}
            title="Interactive Chat"
            description="Ask questions about your data in natural language. Get instant answers powered by Mistral AI."
            delay={400}
          />
          <FeatureCard
            icon={TrendingUp}
            title="Quality Metrics"
            description="Track completeness, consistency, and accuracy scores for every table in your database."
            delay={500}
          />
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="landing-section landing-how-it-works">
        <div className="landing-section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </div>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-number">1</div>
            <h3>Connect Your Database</h3>
            <p>Add your database credentials securely. We support all major databases.</p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="landing-step-number">2</div>
            <h3>Analyze & Extract</h3>
            <p>We automatically scan your schema and analyze data quality metrics.</p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="landing-step-number">3</div>
            <h3>Chat & Document</h3>
            <p>Ask questions, generate documentation, and share insights with your team.</p>
          </div>
        </div>
      </section>
      
      {/* AI Section */}
      <section className="landing-section landing-ai-section">
        <div className="landing-ai-content">
          <div className="landing-ai-text">
            <h2>
              <Sparkles size={32} style={{ color: 'var(--primary-light)' }} />
              Powered by AI
            </h2>
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
              <div className="chat-preview-message user">
                What columns store customer contact info?
              </div>
              <div className="chat-preview-message assistant">
                Based on the schema, customer contact information is stored in the <strong>customers</strong> table with columns: email, phone, address_line1, city, state, and postal_code.
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="landing-section landing-cta">
        <div className="landing-cta-content">
          <h2>Ready to understand your data?</h2>
          <p>Start using DataDict AI today — no credit card required.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <Sparkles size={20} />
            DataDict AI
          </div>
          <p>© 2026 DataDict AI. Built with ❤️ for data teams.</p>
        </div>
      </footer>
    </div>
  )
}
