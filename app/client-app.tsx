"use client"

import { useState } from "react"
import Auth from "@/components/auth"
import Chat from "@/components/chat"
import { getMessages } from "@/lib/actions"

interface ClientAppProps {
  initialUser: string | null
  initialMessages: any[]
}

export default function ClientApp({ initialUser, initialMessages }: ClientAppProps) {
  const [userHex, setUserHex] = useState<string | null>(initialUser)
  const [messages, setMessages] = useState(initialMessages)

  const handleUserAuthenticated = async (hexCode: string) => {
    setUserHex(hexCode)
    const msgs = await getMessages()
    setMessages(msgs)
  }

  const handleLogout = () => {
    setUserHex(null)
    setMessages([])
  }

  if (!userHex) {
    return <Auth onUserAuthenticated={handleUserAuthenticated} />
  }

  return <Chat userHex={userHex} initialMessages={messages} onLogout={handleLogout} />
}
