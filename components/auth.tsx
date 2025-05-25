"use client"

import type React from "react"

import { useState } from "react"
import { createUser, signInUser } from "@/lib/actions"
import ParticleBackground from "./particle-background"

interface AuthProps {
  onUserAuthenticated: (hexCode: string) => void
}

export default function Auth({ onUserAuthenticated }: AuthProps) {
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [hexInput, setHexInput] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    let userHex = ""
    if (isSignUp) {
      if (!selectedColor) {
        setError("Please select a color")
        return
      }
      userHex = selectedColor
    } else {
      if (!hexInput.trim()) {
        setError("Please enter your hex code")
        return
      }
      // Validate hex format
      const hexPattern = /^#[0-9A-Fa-f]{6}$/
      if (!hexPattern.test(hexInput.trim())) {
        setError("Please enter a valid hex code (e.g., #ff0000)")
        return
      }
      userHex = hexInput.trim().toLowerCase()
    }

    setIsLoading(true)
    setError("")

    try {
      const result = isSignUp ? await createUser(userHex, password.trim()) : await signInUser(userHex, password.trim())

      if (result.success) {
        onUserAuthenticated(userHex)
      } else {
        setError(result.error || "Authentication failed")
      }
    } catch (error) {
      console.error("Auth error:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <ParticleBackground />
      <div className="text-center space-y-8 w-full max-w-md px-6 relative z-10">
        <div className="space-y-4">
          <h1 className="text-6xl font-thin text-gray-900 tracking-wide">Hue</h1>
          <p className="text-sm text-gray-600 font-medium tracking-wide">
            {isSignUp ? "create your account" : "sign in to your account"}
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp ? (
              <div className="space-y-4">
                <div
                  className="w-32 h-32 mx-auto border-2 border-gray-200 cursor-pointer rounded-2xl shadow-lg hover:shadow-xl transition-smooth hover:scale-105"
                  style={{ backgroundColor: selectedColor }}
                  onClick={() => document.getElementById("colorInput")?.click()}
                />

                <input
                  id="colorInput"
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="opacity-0 absolute"
                />

                <p className="font-mono text-sm text-gray-500 tracking-wide">username: {selectedColor}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  placeholder="hex code (e.g., #ff0000)"
                  className="w-full px-4 py-4 border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-smooth backdrop-blur-sm font-mono"
                  required
                />
              </div>
            )}

            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="w-full px-4 py-4 border border-gray-200 bg-white/80 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-smooth backdrop-blur-sm"
                required
              />

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
              >
                {isLoading ? "loading..." : isSignUp ? "create account" : "sign in"}
              </button>
            </div>
          </form>
        </div>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError("")
            setPassword("")
            setHexInput("")
          }}
          className="text-sm text-gray-600 hover:text-gray-900 underline font-medium transition-smooth"
        >
          {isSignUp ? "already have an account? sign in" : "need an account? sign up"}
        </button>
      </div>
    </div>
  )
}
