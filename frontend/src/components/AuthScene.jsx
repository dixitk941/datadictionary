import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei'

// Animated floating orbs
function FloatingOrb({ position, color, speed = 1, distort = 0.4 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed
    }
  })
  
  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          envMapIntensity={0.4}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.1}
          roughness={0.2}
          distort={distort}
          speed={3}
        />
      </mesh>
    </Float>
  )
}

// Rotating wireframe shape
function WireframeShape({ position, size = 1.5 }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color="#10a37f"
        wireframe
        transparent
        opacity={0.2}
      />
    </mesh>
  )
}

// Particle field
function Particles({ count = 100 }) {
  const pointsRef = useRef()
  
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8
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
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

// Main scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, 5]} intensity={0.4} color="#10a37f" />
      
      <Particles />
      
      {/* Main accent orb */}
      <FloatingOrb position={[-3, 2, -2]} color="#10a37f" speed={1} distort={0.5} />
      
      {/* Secondary orbs */}
      <FloatingOrb position={[3.5, -1.5, -3]} color="#3b82f6" speed={0.8} distort={0.3} />
      <FloatingOrb position={[-2.5, -2, -2]} color="#8b5cf6" speed={1.2} distort={0.4} />
      <FloatingOrb position={[2, 2.5, -4]} color="#f59e0b" speed={0.6} distort={0.35} />
      
      {/* Background wireframe */}
      <WireframeShape position={[0, 0, -5]} size={2} />
      
      <Environment preset="city" />
    </>
  )
}

export default function AuthScene() {
  return (
    <div className="auth-canvas-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
