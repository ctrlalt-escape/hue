"use client"

import { useState, useEffect } from "react"
import { searchMessages } from "@/lib/actions"
import { SearchIcon, XIcon } from "./icons"

interface SearchResult {
  id: number
  message: string
  user_hex: string
  display_name: string
  created_at: string
}

interface MessageSearchProps {
  onClose: () => void
  userHex: string
}

export default function MessageSearch({ onClose, userHex }: MessageSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const searchDebounced = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true)
        try {
          const searchResults = await searchMessages(query, userHex)
          setResults(searchResults)
        } catch (error) {
          console.error("Search error:", error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(searchDebounced)
  }, [query, userHex])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="glass border-b border-gray-200/50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative flex-1">
            <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages, usernames, or colors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-smooth"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-white/50 transition-smooth backdrop-blur-sm"
            title="Close search"
          >
            <XIcon size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Search Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              <p className="text-gray-500 mt-2">Searching...</p>
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages found for "{query}"</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Found {results.length} message{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="glass rounded-lg p-4 hover:bg-white/60 transition-smooth cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: result.user_hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{highlightText(result.display_name, query)}</span>
                        <span className="text-xs text-gray-500">{formatTime(result.created_at)}</span>
                      </div>
                      <p className="text-gray-700 break-words">{highlightText(result.message, query)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-8">
              <SearchIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Start typing to search messages</p>
              <p className="text-sm text-gray-400 mt-1">Search by message content, username, or color</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
