"use client"

import { useState, useEffect } from "react"
import { getActiveUsers } from "@/lib/actions"

interface ActiveUsersProps {
  currentUserHex: string
}

export default function ActiveUsers({ currentUserHex }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<string[]>([])
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const users = await getActiveUsers()
      setActiveUsers(users)
    }

    // Initial fetch
    fetchActiveUsers()

    // Update every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000)

    return () => clearInterval(interval)
  }, [])

  const activeCount = activeUsers.length
  const otherUsers = activeUsers.filter((user) => user !== currentUserHex)

  return (
    <div className="relative">
      <div
        className="flex items-center space-x-2 px-3 py-2 glass rounded-xl cursor-pointer transition-smooth hover:bg-white/30"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-700">{activeCount}</span>
        </div>
        <span className="text-xs text-gray-500">{activeCount === 1 ? "user" : "users"} online</span>
      </div>

      {showTooltip && activeUsers.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-64 glass rounded-xl shadow-xl p-3 z-30 border border-gray-200/50">
          <div className="text-xs font-medium text-gray-600 mb-2">Active Users</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeUsers.map((userHex) => (
              <div key={userHex} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 border border-gray-300 rounded-full flex-shrink-0"
                  style={{ backgroundColor: userHex }}
                />
                <span className="font-mono text-xs text-gray-700 truncate">
                  {userHex}
                  {userHex === currentUserHex && <span className="text-gray-500 ml-1">(you)</span>}
                </span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
          {otherUsers.length === 0 && activeCount === 1 && (
            <div className="text-xs text-gray-500 italic">You're the only one here right now</div>
          )}
        </div>
      )}
    </div>
  )
}
