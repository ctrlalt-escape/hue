"use client"

import { useState, useEffect } from "react"
import { getTypingUsers } from "@/lib/actions"

interface TypingIndicatorsProps {
  currentUserHex: string
}

export default function TypingIndicators({ currentUserHex }: TypingIndicatorsProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useEffect(() => {
    const fetchTypingUsers = async () => {
      try {
        const users = await getTypingUsers()
        // Filter out current user
        const otherTypingUsers = users.filter((user) => user !== currentUserHex)
        setTypingUsers(otherTypingUsers)
      } catch (error) {
        console.error("Error fetching typing users:", error)
        setTypingUsers([])
      }
    }

    // Initial fetch
    fetchTypingUsers()

    // Update every 2 seconds for responsive typing indicators
    const interval = setInterval(fetchTypingUsers, 2000)

    return () => clearInterval(interval)
  }, [currentUserHex])

  if (typingUsers.length === 0) {
    return null
  }

  return (
    <div className="px-6 py-2">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="flex space-x-1">
          {typingUsers.slice(0, 3).map((userHex) => (
            <div
              key={userHex}
              className="w-2 h-2 border border-gray-300 rounded-full"
              style={{ backgroundColor: userHex }}
            />
          ))}
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-mono text-xs">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing`
              : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                : typingUsers.length === 3
                  ? `${typingUsers[0]}, ${typingUsers[1]} and ${typingUsers[2]} are typing`
                  : `${typingUsers[0]}, ${typingUsers[1]} and ${typingUsers.length - 2} others are typing`}
          </span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
