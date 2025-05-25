"use client"

import { useState, useEffect } from "react"
import { getOnlineUsers } from "@/lib/actions"

interface OnlineUsersProps {
  currentUserHex: string
}

export default function OnlineUsers({ currentUserHex }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const users = await getOnlineUsers()
        setOnlineUsers(users)
      } catch (error) {
        console.error("Error fetching online users:", error)
        // Fallback to showing current user only
        setOnlineUsers([currentUserHex])
      }
    }

    // Initial fetch
    fetchOnlineUsers()

    // Update every 30 seconds to reduce database load
    const interval = setInterval(fetchOnlineUsers, 30000)

    return () => clearInterval(interval)
  }, [currentUserHex])

  const onlineCount = onlineUsers.length

  return (
    <div className="relative">
      <div
        className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-all duration-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="relative">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
        </div>
        <span className="text-sm font-medium text-white">{onlineCount} online</span>
      </div>

      {showTooltip && onlineUsers.length > 0 && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg z-50 min-w-48">
          <div className="text-xs font-medium text-gray-600 mb-2">Online Users</div>
          <div className="space-y-2">
            {onlineUsers.slice(0, 10).map((userHex) => (
              <div key={userHex} className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: userHex }} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
                </div>
                <span className="text-xs font-mono text-gray-700">{userHex}</span>
              </div>
            ))}
            {onlineUsers.length > 10 && (
              <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
                +{onlineUsers.length - 10} more users
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
