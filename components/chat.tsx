"use client"

import { useState, useEffect, useRef } from "react"
import { getMessages, signOut } from "@/lib/actions"
import { UserIcon, LogoutIcon, DeleteIcon, SearchIcon, UsersIcon } from "./icons"
import MessageItem from "./message-item"
import MessageInput from "./message-input"
import ParticleBackground from "./particle-background"
import OnlineUsers from "./online-users"
import TypingIndicators from "./typing-indicators"
import MessageSearch from "./message-search"
import FriendsPanel from "./friends-panel"

interface Message {
  id: number
  message: string
  user_hex: string
  display_name: string
  created_at: string
  edited_at?: string
  reactions: any[]
}

interface ChatProps {
  userHex: string
  initialMessages: Message[]
  onLogout: () => void
}

export default function Chat({ userHex, initialMessages, onLogout }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(initialMessages.length)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const scrollToBottom = () => {
    if (!isUserScrolling && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Handle user scrolling
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsUserScrolling(!isAtBottom)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const latestMessages = await getMessages(userHex)

      if (latestMessages.length > lastMessageCount && document.hidden) {
        const newMessages = latestMessages.slice(lastMessageCount)
        const lastMessage = newMessages[newMessages.length - 1]

        if (lastMessage.user_hex !== userHex && "Notification" in window && Notification.permission === "granted") {
          new Notification(`New message in Hue`, {
            body: `${lastMessage.display_name}: ${lastMessage.message}`,
            icon: "/favicon.ico",
            tag: "hue-chat",
          })
        }
      }

      setMessages(latestMessages)
      setLastMessageCount(latestMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [lastMessageCount, userHex])

  const handleMessageUpdate = async () => {
    const latestMessages = await getMessages(userHex)
    setMessages(latestMessages)
  }

  const handleSignOut = async () => {
    await signOut()
    onLogout()
  }

  const handleDeleteAccount = async () => {
    if (
      confirm("Are you sure you want to delete your account? This will remove all your messages and cannot be undone.")
    ) {
      const { deleteUser } = await import("@/lib/actions")
      const result = await deleteUser(userHex)
      if (result.success) {
        onLogout()
      }
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col relative overflow-hidden">
      <ParticleBackground />

      {/* Header */}
      <div className="glass border-b border-gray-200/50 p-4 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-thin text-gray-900 tracking-wide">Hue</h1>
            <OnlineUsers currentUserHex={userHex} />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-xl hover:bg-white/50 transition-smooth backdrop-blur-sm"
              title="Search messages"
            >
              <SearchIcon size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowFriends(!showFriends)}
              className="p-2 rounded-xl hover:bg-white/50 transition-smooth backdrop-blur-sm"
              title="Friends"
            >
              <UsersIcon size={20} className="text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-white/50 transition-smooth backdrop-blur-sm"
                title="Account menu"
              >
                <div className="relative">
                  <div
                    className="w-5 h-5 border-2 border-gray-300 rounded-full shadow-sm"
                    style={{ backgroundColor: userHex }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full" />
                </div>
                <span className="font-mono text-sm text-gray-600 tracking-wide">{userHex}</span>
                <UserIcon size={16} className="text-gray-400" />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-52 glass rounded-xl shadow-xl p-2 space-y-1 z-20">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/50 rounded-lg transition-smooth"
                  >
                    <LogoutIcon size={14} />
                    <span>sign out</span>
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 rounded-lg transition-smooth"
                  >
                    <DeleteIcon size={14} />
                    <span>delete account</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative z-10 flex-shrink-0">
          <MessageSearch onClose={() => setShowSearch(false)} userHex={userHex} />
        </div>
      )}

      {/* Friends Panel */}
      {showFriends && (
        <div className="relative z-10 flex-shrink-0">
          <FriendsPanel onClose={() => setShowFriends(false)} userHex={userHex} />
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 relative z-10">
        <div className="glass rounded-2xl p-6 shadow-xl space-y-2 min-h-full">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg font-light">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} currentUserHex={userHex} onMessageUpdated={handleMessageUpdate} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicators */}
        <TypingIndicators currentUserHex={userHex} />
      </div>

      {/* Message Input */}
      <div className="relative z-10 flex-shrink-0">
        <MessageInput userHex={userHex} onMessageSent={handleMessageUpdate} />
      </div>
    </div>
  )
}
