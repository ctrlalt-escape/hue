"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { sendMessage, getAllUsers, fetchUrlMetadata, setTypingIndicator } from "@/lib/actions"
import { EmojiIcon, MentionIcon, AttachIcon, LinkIcon } from "./icons"

interface MessageInputProps {
  userHex: string
  onMessageSent: () => void
}

const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🤔",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "💯",
  "🎉",
  "😎",
  "🤝",
  "👋",
  "💪",
  "🙏",
  "✨",
  "🎯",
  "🚀",
  "💡",
  "⭐",
]

export default function MessageInput({ userHex, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [showEmojis, setShowEmojis] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [users, setUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [urlPreviews, setUrlPreviews] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle typing indicators
  const handleTypingStart = useCallback(async () => {
    if (!isTyping) {
      setIsTyping(true)
      await setTypingIndicator(userHex, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false)
      await setTypingIndicator(userHex, false)
    }, 3000)
  }, [userHex, isTyping])

  const handleTypingStop = useCallback(async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    await setTypingIndicator(userHex, false)
  }, [userHex])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      setTypingIndicator(userHex, false)
    }
  }, [userHex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    setIsLoading(true)

    // Stop typing indicator
    await handleTypingStop()

    const result = await sendMessage(userHex, message.trim())
    if (result.success) {
      setMessage("")
      setUrlPreviews({})
      setShowEmojis(false)
      setShowUsers(false)
      onMessageSent()
    }
    setIsLoading(false)
  }

  const addEmoji = useCallback(
    (emoji: string) => {
      setMessage((prev) => prev + emoji)
      setShowEmojis(false)
      handleTypingStart()
    },
    [handleTypingStart],
  )

  const handleAtSymbol = useCallback(async () => {
    const usersList = await getAllUsers()
    setUsers(usersList)
    setShowUsers(true)
    setMessage((prev) => prev + "@")
    handleTypingStart()
  }, [handleTypingStart])

  const selectUser = useCallback(
    (user: string) => {
      setMessage((prev) => prev.replace(/@$/, `@${user} `))
      setShowUsers(false)
      handleTypingStart()
    },
    [handleTypingStart],
  )

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setMessage((prev) => prev + `[File: ${file.name}]`)
        handleTypingStart()
      }
    },
    [handleTypingStart],
  )

  const addLink = useCallback(() => {
    const url = prompt("Enter URL:")
    if (url) {
      setMessage((prev) => prev + ` ${url}`)
      fetchUrlMetadata(url).then(({ title }) => {
        setUrlPreviews((prev) => ({ ...prev, [url]: title }))
      })
      handleTypingStart()
    }
  }, [handleTypingStart])

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMessage = e.target.value
      setMessage(newMessage)

      // Handle typing indicators
      if (newMessage.trim()) {
        handleTypingStart()
      } else {
        handleTypingStop()
      }

      // Auto-fetch URL metadata for typed URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const urls = newMessage.match(urlRegex)
      if (urls) {
        urls.forEach((url) => {
          if (!urlPreviews[url]) {
            fetchUrlMetadata(url).then(({ title }) => {
              setUrlPreviews((prev) => ({ ...prev, [url]: title }))
            })
          }
        })
      }
    },
    [urlPreviews, handleTypingStart, handleTypingStop],
  )

  return (
    <div className="glass border-t border-gray-200/50 p-4 m-4 rounded-2xl shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Previews */}
        {Object.entries(urlPreviews).length > 0 && (
          <div className="space-y-2">
            {Object.entries(urlPreviews).map(([url, title]) => (
              <div key={url} className="text-xs p-3 bg-white/60 border border-gray-200/50 rounded-xl backdrop-blur-sm">
                <div className="truncate font-medium text-gray-900">{title}</div>
                <div className="truncate text-gray-500">{url}</div>
              </div>
            ))}
          </div>
        )}

        {/* User Picker */}
        {showUsers && (
          <div className="p-2 bg-white/80 border border-gray-200/50 rounded-xl max-h-32 overflow-y-auto shadow-lg backdrop-blur-sm">
            {users.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => selectUser(user)}
                className="block w-full text-left p-2 font-mono text-sm text-gray-700 hover:bg-white/60 rounded-lg transition-smooth"
              >
                {user}
              </button>
            ))}
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojis && (
          <div className="p-3 bg-white/80 border border-gray-200/50 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="grid grid-cols-10 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 rounded-lg hover:bg-white/60 transition-smooth flex items-center justify-center text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="px-3 py-2 text-sm border border-gray-200/50 text-gray-700 hover:bg-white/50 rounded-xl transition-smooth backdrop-blur-sm"
            title="Add emoji"
          >
            <EmojiIcon size={16} />
          </button>

          <button
            type="button"
            onClick={handleAtSymbol}
            className="px-3 py-2 text-sm border border-gray-200/50 text-gray-700 hover:bg-white/50 rounded-xl transition-smooth backdrop-blur-sm"
            title="Mention user"
          >
            <MentionIcon size={16} />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm border border-gray-200/50 text-gray-700 hover:bg-white/50 rounded-xl transition-smooth backdrop-blur-sm"
            title="Attach file"
          >
            <AttachIcon size={16} />
          </button>

          <button
            type="button"
            onClick={addLink}
            className="px-3 py-2 text-sm border border-gray-200/50 text-gray-700 hover:bg-white/50 rounded-xl transition-smooth backdrop-blur-sm"
            title="Add link"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        {/* Message Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="type message..."
            className="flex-1 px-4 py-4 border border-gray-200/50 bg-white/80 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-smooth backdrop-blur-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
          >
            send
          </button>
        </div>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}
