"use client"

import { useState, useEffect } from "react"
import Auth from "@/components/auth"
import Chat from "@/components/chat"
import { getCurrentUser, getMessages } from "@/lib/actions"
import ParticleBackground from "@/components/particle-background"

export default function Home() {
  const [userHex, setUserHex] = useState<string | null>(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUserHex(currentUser)
          const msgs = await getMessages()
          setMessages(msgs)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleUserAuthenticated = async (hexCode: string) => {
    setUserHex(hexCode)
    const msgs = await getMessages()
    setMessages(msgs)
  }

  const handleLogout = () => {
    setUserHex(null)
    setMessages([])
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <ParticleBackground />
        <div className="text-center relative z-10">
          <h1 className="text-6xl font-thin text-gray-900 tracking-wide">Hue</h1>
          <p className="text-sm text-gray-600 mt-4 font-medium tracking-wide">loading...</p>
        </div>
      </div>
    )
  }

  if (!userHex) {
    return <Auth onUserAuthenticated={handleUserAuthenticated} />
  }

  return <Chat userHex={userHex} initialMessages={messages} onLogout={handleLogout} />
}
