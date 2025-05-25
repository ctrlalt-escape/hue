"use client"

import { useState } from "react"
import { addReaction, removeReaction } from "@/lib/actions"

interface Reaction {
  emoji: string
  users: string[]
  count: number
}

interface MessageReactionsProps {
  messageId: number
  reactions: Reaction[]
  currentUserHex: string
  onReactionUpdated: () => void
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"]

export default function MessageReactions({
  messageId,
  reactions,
  currentUserHex,
  onReactionUpdated,
}: MessageReactionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const handleReaction = async (emoji: string) => {
    const existingReaction = reactions.find((r) => r.emoji === emoji)
    const userHasReacted = existingReaction?.users.includes(currentUserHex)

    if (userHasReacted) {
      await removeReaction(messageId, currentUserHex, emoji)
    } else {
      await addReaction(messageId, currentUserHex, emoji)
    }

    onReactionUpdated()
    setShowReactionPicker(false)
  }

  return (
    <div className="mt-2">
      {/* Existing Reactions */}
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {reactions.map((reaction) => {
            const userHasReacted = reaction.users.includes(currentUserHex)
            return (
              <button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-smooth ${
                  userHasReacted
                    ? "bg-blue-100 border border-blue-300 text-blue-700"
                    : "bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200"
                }`}
                title={`${reaction.users.join(", ")} reacted with ${reaction.emoji}`}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-full hover:bg-gray-100 transition-smooth"
          title="Add reaction"
        >
          + 😀
        </button>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-white/90 border border-gray-200/50 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <div className="flex space-x-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-smooth flex items-center justify-center text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
