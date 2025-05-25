"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  delay: number
  speed: number
  direction: number
  color: string
}

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const colors = ["#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#f3f4f6"]

    const generateParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 40; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          opacity: Math.random() * 0.4 + 0.1,
          delay: Math.random() * 15,
          speed: Math.random() * 3 + 1,
          direction: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
        })
      }
      setParticles(newParticles)
    }

    generateParticles()
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${8 + particle.speed}s`,
          }}
        />
      ))}

      {/* Additional floating shapes */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`shape-${i}`}
          className="absolute opacity-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            backgroundColor: "#9ca3af",
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}

      {/* Gradient orbs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full opacity-5"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 20 + 10}px`,
            height: `${Math.random() * 20 + 10}px`,
            background: `radial-gradient(circle, #6b7280, transparent)`,
            animation: `drift ${20 + Math.random() * 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 12}s`,
          }}
        />
      ))}
    </div>
  )
}
