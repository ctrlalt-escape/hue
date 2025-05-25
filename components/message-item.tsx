"use client"

import { useState } from "react"
import { editMessage, deleteMessage } from "@/lib/actions"
import { EditIcon, DeleteIcon } from "./icons"
import MessageReactions from "./message-reactions"

interface Reaction {
  emoji: string
  users: string[]
  count: number
}

interface Message {
  id: number
  message: string
  user_hex: string
  display_name: string
  created_at: string
  edited_at?: string
  reactions: Reaction[]
}

interface MessageItemProps {
  message: Message
  currentUserHex: string
  onMessageUpdated: () => void
}

export default function MessageItem({ message, currentUserHex, onMessageUpdated }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.message)
  const [isLoading, setIsLoading] = useState(false)

  const isOwnMessage = message.user_hex === currentUserHex
  const messageAge = Date.now() - new Date(message.created_at).getTime()
  const canEdit = isOwnMessage && messageAge < 60000 // 1 minute

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const handleEdit = async () => {
    if (!editText.trim()) return

    setIsLoading(true)
    const result = await editMessage(message.id, editText.trim(), currentUserHex)
    if (result.success) {
      setIsEditing(false)
      onMessageUpdated()
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return

    setIsLoading(true)
    const result = await deleteMessage(message.id, currentUserHex)
    if (result.success) {
      onMessageUpdated()
    } else {
      console.error("Failed to delete message")
    }
    setIsLoading(false)
  }

  const processMessage = (text: string) => {
    return text
      .replace(/@([a-fA-F0-9#]+)/g, '<strong class="font-semibold text-gray-900">@$1</strong>')
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>',
      )
  }

  return (
    <div className="flex items-start space-x-4 group py-3 px-2 rounded-xl hover:bg-white/30 transition-smooth">
      <div
        className="w-4 h-4 border-2 border-gray-300 flex-shrink-0 mt-1 rounded-full shadow-sm"
        style={{ backgroundColor: message.user_hex }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-3 mb-1">
          <span className="font-mono text-xs text-gray-500 tracking-wide">
            {message.display_name}
            {message.display_name !== message.user_hex && (
              <span className="text-gray-400 ml-1">({message.user_hex})</span>
            )}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.created_at)}
            {message.edited_at && " (edited)"}
          </span>
          {canEdit && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2 ml-auto">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded transition-smooth"
                disabled={isLoading}
                title="Edit message"
              >
                <EditIcon size={12} />
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-gray-400 hover:text-red-600 p-1 rounded transition-smooth"
                disabled={isLoading}
                title="Delete message"
              >
                <DeleteIcon size={12} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex space-x-2 mt-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200/50 bg-white/80 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-smooth backdrop-blur-sm"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleEdit}
              disabled={isLoading || !editText.trim()}
              className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-smooth disabled:opacity-50 text-sm font-medium"
            >
              save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 border border-gray-200/50 text-gray-700 rounded-lg hover:bg-white/50 transition-smooth text-sm font-medium backdrop-blur-sm"
            >
              cancel
            </button>
          </div>
        ) : (
          <>
            <div
              className="text-sm text-gray-900 break-words leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processMessage(message.message) }}
            />
            <MessageReactions
              messageId={message.id}
              reactions={message.reactions || []}
              currentUserHex={currentUserHex}
              onReactionUpdated={onMessageUpdated}
            />
          </>
        )}
      </div>
    </div>
  )
}
