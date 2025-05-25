"use client"

import { useState, useEffect } from "react"
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  setFriendNickname,
  removeFriend,
} from "@/lib/actions"
import { XIcon, UserIcon, PlusIcon, CheckIcon, XMarkIcon, EditIcon } from "./icons"

interface FriendRequest {
  id: number
  from_user_hex: string
  created_at: string
}

interface Friend {
  friend_hex: string
  nickname: string | null
  created_at: string
}

interface FriendsPanelProps {
  onClose: () => void
  userHex: string
}

export default function FriendsPanel({ onClose, userHex }: FriendsPanelProps) {
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [newFriendHex, setNewFriendHex] = useState("")
  const [editingNickname, setEditingNickname] = useState<string | null>(null)
  const [nicknameValue, setNicknameValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [userHex])

  const fetchData = async () => {
    try {
      const [requests, currentFriends] = await Promise.all([getFriendRequests(userHex), getFriends(userHex)])
      setFriendRequests(requests)
      setFriends(currentFriends)
    } catch (error) {
      console.error("Error fetching friends data:", error)
      setError("Failed to load friends data")
    }
  }

  const handleSendFriendRequest = async () => {
    if (!newFriendHex.trim()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await sendFriendRequest(userHex, newFriendHex.trim())
      if (result.success) {
        setNewFriendHex("")
        setSuccess("Friend request sent!")
        await fetchData()
      } else {
        setError(result.error || "Failed to send friend request")
      }
    } catch (error) {
      console.error("Error sending friend request:", error)
      setError("Failed to send friend request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptFriendRequest = async (requestId: number) => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await acceptFriendRequest(requestId, userHex)
      if (result.success) {
        setSuccess("Friend request accepted!")
        await fetchData()
      } else {
        setError(result.error || "Failed to accept friend request")
      }
    } catch (error) {
      console.error("Error accepting friend request:", error)
      setError("Failed to accept friend request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectFriendRequest = async (requestId: number) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await rejectFriendRequest(requestId, userHex)
      if (result.success) {
        await fetchData()
      } else {
        setError(result.error || "Failed to reject friend request")
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error)
      setError("Failed to reject friend request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFriend = async (friendHex: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return

    setIsLoading(true)
    setError("")

    try {
      const result = await removeFriend(userHex, friendHex)
      if (result.success) {
        await fetchData()
      } else {
        setError(result.error || "Failed to remove friend")
      }
    } catch (error) {
      console.error("Error removing friend:", error)
      setError("Failed to remove friend")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetNickname = async (friendHex: string) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await setFriendNickname(userHex, friendHex, nicknameValue.trim())
      if (result.success) {
        setEditingNickname(null)
        setNicknameValue("")
        await fetchData()
      } else {
        setError(result.error || "Failed to set nickname")
      }
    } catch (error) {
      console.error("Error setting nickname:", error)
      setError("Failed to set nickname")
    } finally {
      setIsLoading(false)
    }
  }

  const startEditingNickname = (friendHex: string, currentNickname: string | null) => {
    setEditingNickname(friendHex)
    setNicknameValue(currentNickname || "")
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="glass border-b border-gray-200/50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-thin text-gray-900">Friends</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/50 transition-smooth backdrop-blur-sm"
            title="Close friends panel"
          >
            <XIcon size={20} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Add Friend */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Add Friend</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter friend's hex code (e.g., #ff0000)"
              value={newFriendHex}
              onChange={(e) => setNewFriendHex(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-smooth font-mono"
            />
            <button
              onClick={handleSendFriendRequest}
              disabled={isLoading || !newFriendHex.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center space-x-2"
            >
              <PlusIcon size={16} />
              <span>{isLoading ? "Sending..." : "Send"}</span>
            </button>
          </div>
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Friend Requests ({friendRequests.length})</h3>
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <div key={request.id} className="glass rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: request.from_user_hex }}
                    />
                    <div>
                      <p className="font-mono text-sm text-gray-900">{request.from_user_hex}</p>
                      <p className="text-xs text-gray-500">{formatTime(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptFriendRequest(request.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 transition-smooth flex items-center space-x-1"
                    >
                      <CheckIcon size={14} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleRejectFriendRequest(request.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 transition-smooth flex items-center space-x-1"
                    >
                      <XMarkIcon size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Friends ({friends.length})</h3>
          {friends.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No friends yet</p>
              <p className="text-sm text-gray-400 mt-1">Add friends by their hex code above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.friend_hex} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: friend.friend_hex }}
                      />
                      <div className="flex-1">
                        {editingNickname === friend.friend_hex ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={nicknameValue}
                              onChange={(e) => setNicknameValue(e.target.value)}
                              placeholder="Enter nickname"
                              className="px-2 py-1 text-sm bg-white/80 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSetNickname(friend.friend_hex)}
                              disabled={isLoading}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <CheckIcon size={14} />
                            </button>
                            <button
                              onClick={() => setEditingNickname(null)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            >
                              <XMarkIcon size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{friend.nickname || friend.friend_hex}</p>
                              <button
                                onClick={() => startEditingNickname(friend.friend_hex, friend.nickname)}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                                title="Edit nickname"
                              >
                                <EditIcon size={12} />
                              </button>
                            </div>
                            {friend.nickname && <p className="text-xs text-gray-500 font-mono">{friend.friend_hex}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.friend_hex)}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 transition-smooth"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
