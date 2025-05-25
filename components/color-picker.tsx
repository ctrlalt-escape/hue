"use client"

import { useState } from "react"
import { createUser } from "@/lib/actions"
import { useTheme } from "@/contexts/theme-context"

interface ColorPickerProps {
  onUserCreated: (hexCode: string) => void
}

export default function ColorPicker({ onUserCreated }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState("#000000")
  const [isLoading, setIsLoading] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleSubmit = async () => {
    setIsLoading(true)
    const result = await createUser(selectedColor)
    if (result.success) {
      onUserCreated(selectedColor)
    }
    setIsLoading(false)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-white"}`}>
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <h1 className={`text-4xl font-mono ${theme === "dark" ? "text-white" : "text-black"}`}>Hue</h1>
          <p className={`text-sm font-mono ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            choose your color
          </p>
        </div>

        <div className="space-y-4">
          <div
            className={`w-32 h-32 mx-auto border-2 ${theme === "dark" ? "border-white" : "border-black"} cursor-pointer`}
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

          <p className={`font-mono text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            your username: {selectedColor}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-8 py-2 border-2 ${theme === "dark" ? "border-white bg-black text-white hover:bg-white hover:text-black" : "border-black bg-white text-black hover:bg-black hover:text-white"} font-mono transition-colors disabled:opacity-50`}
          >
            {isLoading ? "joining..." : "join chat"}
          </button>

          <button
            onClick={toggleTheme}
            className={`block mx-auto px-4 py-1 text-sm border ${theme === "dark" ? "border-white text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"} font-mono transition-colors`}
          >
            {theme === "dark" ? "☀️ light" : "🌙 dark"}
          </button>
        </div>
      </div>
    </div>
  )
}
