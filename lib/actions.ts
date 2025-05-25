"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import crypto from "crypto"

// Use the correct environment variable from the available ones
const sql = neon(process.env.POSTGRES_URL!)

// Simple hash function for demo purposes
function hashPassword(password: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string")
  }
  return crypto.createHash("sha256").update(password, "utf8").digest("hex")
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Privacy cleanup function - runs every 2 days
export async function cleanupOldMessages() {
  try {
    // Delete messages older than 2 days
    await sql`
      DELETE FROM messages 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 days'
    `

    // Delete reactions for deleted messages
    await sql`
      DELETE FROM reactions 
      WHERE message_id NOT IN (SELECT id FROM messages)
    `

    console.log("Privacy cleanup completed - messages older than 2 days removed")
    return { success: true }
  } catch (error) {
    console.error("Error during privacy cleanup:", error)
    return { success: false, error: "Failed to cleanup old messages" }
  }
}

// Check and run cleanup if needed
export async function checkAndRunCleanup() {
  try {
    // Get the last cleanup time from a simple tracking mechanism
    const lastCleanup = await sql`
      SELECT created_at FROM messages 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    // If no messages exist or it's been more than 2 days since last check
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    // Run cleanup
    await cleanupOldMessages()

    return { success: true }
  } catch (error) {
    console.error("Error checking cleanup:", error)
    return { success: false }
  }
}

export async function createUser(hexCode: string, password: string) {
  try {
    if (!hexCode || !password) {
      return { success: false, error: "Color and password are required" }
    }

    const passwordHash = hashPassword(password)

    await sql`
      INSERT INTO users (hex_code, password_hash)
      VALUES (${hexCode}, ${passwordHash})
      ON CONFLICT (hex_code) DO NOTHING
    `

    // Create session with longer expiry for persistence
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (user_hex, session_token, expires_at)
      VALUES (${hexCode}, ${sessionToken}, ${expiresAt})
    `

    // Set cookie with longer expiry
    cookies().set("hue-session", sessionToken, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return { success: true }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function signInUser(hexCode: string, password: string) {
  try {
    if (!hexCode || !password) {
      return { success: false, error: "Hex code and password are required" }
    }

    const passwordHash = hashPassword(password)

    // Find user by hex_code
    const users = await sql`
      SELECT hex_code FROM users 
      WHERE hex_code = ${hexCode} 
      AND password_hash = ${passwordHash}
    `

    if (users.length === 0) {
      return { success: false, error: "Invalid credentials" }
    }

    const user = users[0]

    // Create new session with longer expiry
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (user_hex, session_token, expires_at)
      VALUES (${user.hex_code}, ${sessionToken}, ${expiresAt})
    `

    // Set cookie with longer expiry
    cookies().set("hue-session", sessionToken, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return { success: true, userHex: user.hex_code }
  } catch (error) {
    console.error("Error signing in:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function getCurrentUser() {
  try {
    const sessionToken = cookies().get("hue-session")?.value

    if (!sessionToken) {
      return null
    }

    const sessions = await sql`
      SELECT user_hex FROM sessions 
      WHERE session_token = ${sessionToken} 
      AND expires_at > CURRENT_TIMESTAMP
    `

    if (sessions.length === 0) {
      return null
    }

    // Extend session on each check for persistence
    await sql`
      UPDATE sessions 
      SET expires_at = ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
      WHERE session_token = ${sessionToken}
    `

    return sessions[0].user_hex
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Friend request functions
export async function sendFriendRequest(fromUserHex: string, toUserHex: string) {
  try {
    if (fromUserHex === toUserHex) {
      return { success: false, error: "Cannot send friend request to yourself" }
    }

    // Check if user exists
    const userExists = await sql`
      SELECT hex_code FROM users WHERE hex_code = ${toUserHex}
    `

    if (userExists.length === 0) {
      return { success: false, error: "User not found" }
    }

    // Check if already friends
    const existingFriendship = await sql`
      SELECT id FROM friends 
      WHERE user_hex = ${fromUserHex} AND friend_hex = ${toUserHex}
    `

    if (existingFriendship.length > 0) {
      return { success: false, error: "Already friends" }
    }

    // Insert friend request
    await sql`
      INSERT INTO friend_requests (from_user_hex, to_user_hex, status)
      VALUES (${fromUserHex}, ${toUserHex}, 'pending')
      ON CONFLICT (from_user_hex, to_user_hex) DO NOTHING
    `

    return { success: true }
  } catch (error) {
    console.error("Error sending friend request:", error)
    return { success: false, error: "Failed to send friend request" }
  }
}

export async function acceptFriendRequest(requestId: number, userHex: string) {
  try {
    // Get the friend request
    const request = await sql`
      SELECT from_user_hex, to_user_hex FROM friend_requests 
      WHERE id = ${requestId} AND to_user_hex = ${userHex} AND status = 'pending'
    `

    if (request.length === 0) {
      return { success: false, error: "Friend request not found" }
    }

    const { from_user_hex, to_user_hex } = request[0]

    // Create mutual friendship
    await sql`
      INSERT INTO friends (user_hex, friend_hex)
      VALUES (${from_user_hex}, ${to_user_hex}), (${to_user_hex}, ${from_user_hex})
      ON CONFLICT (user_hex, friend_hex) DO NOTHING
    `

    // Update request status
    await sql`
      UPDATE friend_requests 
      SET status = 'accepted' 
      WHERE id = ${requestId}
    `

    return { success: true }
  } catch (error) {
    console.error("Error accepting friend request:", error)
    return { success: false, error: "Failed to accept friend request" }
  }
}

export async function rejectFriendRequest(requestId: number, userHex: string) {
  try {
    await sql`
      UPDATE friend_requests 
      SET status = 'rejected' 
      WHERE id = ${requestId} AND to_user_hex = ${userHex}
    `

    return { success: true }
  } catch (error) {
    console.error("Error rejecting friend request:", error)
    return { success: false, error: "Failed to reject friend request" }
  }
}

export async function getFriendRequests(userHex: string) {
  try {
    const requests = await sql`
      SELECT fr.id, fr.from_user_hex, fr.created_at
      FROM friend_requests fr
      WHERE fr.to_user_hex = ${userHex} AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `

    return requests
  } catch (error) {
    console.error("Error getting friend requests:", error)
    return []
  }
}

export async function getFriends(userHex: string) {
  try {
    const friends = await sql`
      SELECT f.friend_hex, f.nickname, f.created_at
      FROM friends f
      WHERE f.user_hex = ${userHex}
      ORDER BY f.nickname ASC, f.friend_hex ASC
    `

    return friends
  } catch (error) {
    console.error("Error getting friends:", error)
    return []
  }
}

export async function setFriendNickname(userHex: string, friendHex: string, nickname: string) {
  try {
    await sql`
      UPDATE friends 
      SET nickname = ${nickname}
      WHERE user_hex = ${userHex} AND friend_hex = ${friendHex}
    `

    return { success: true }
  } catch (error) {
    console.error("Error setting friend nickname:", error)
    return { success: false, error: "Failed to set nickname" }
  }
}

export async function removeFriend(userHex: string, friendHex: string) {
  try {
    // Remove mutual friendship
    await sql`
      DELETE FROM friends 
      WHERE (user_hex = ${userHex} AND friend_hex = ${friendHex})
      OR (user_hex = ${friendHex} AND friend_hex = ${userHex})
    `

    return { success: true }
  } catch (error) {
    console.error("Error removing friend:", error)
    return { success: false, error: "Failed to remove friend" }
  }
}

// Simplified presence tracking - just update session expiry
export async function updateUserPresence(userHex: string, isOnline = true) {
  try {
    const sessionToken = cookies().get("hue-session")?.value
    if (!sessionToken) return { success: false }

    if (isOnline) {
      // Update session to mark as active
      await sql`
        UPDATE sessions 
        SET expires_at = ${new Date(Date.now() + 120 * 1000)}
        WHERE session_token = ${sessionToken}
        AND user_hex = ${userHex}
      `
    } else {
      // Mark as offline by setting expires_at to past
      await sql`
        UPDATE sessions 
        SET expires_at = ${new Date(Date.now() - 1000)}
        WHERE session_token = ${sessionToken}
        AND user_hex = ${userHex}
      `
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user presence:", error)
    return { success: false }
  }
}

export async function getOnlineUsers() {
  try {
    // Get users who have been active in the last 2 minutes
    const onlineUsers = await sql`
      SELECT DISTINCT user_hex
      FROM sessions 
      WHERE expires_at > CURRENT_TIMESTAMP
      ORDER BY user_hex
    `
    return onlineUsers.map((user) => user.user_hex)
  } catch (error) {
    console.error("Error getting online users:", error)
    return []
  }
}

export async function getActiveUsers() {
  try {
    // Get users who have been active in the last 2 minutes
    const activeUsers = await sql`
      SELECT DISTINCT user_hex
      FROM sessions 
      WHERE expires_at > CURRENT_TIMESTAMP - INTERVAL '60 seconds'
      ORDER BY user_hex
    `
    return activeUsers.map((user) => user.user_hex)
  } catch (error) {
    console.error("Error getting active users:", error)
    return []
  }
}

// Simplified typing indicators - store in memory instead of database
const typingUsers = new Map<string, number>()

export async function setTypingIndicator(userHex: string, isTyping: boolean) {
  try {
    if (isTyping) {
      typingUsers.set(userHex, Date.now())
    } else {
      typingUsers.delete(userHex)
    }
    return { success: true }
  } catch (error) {
    console.error("Error setting typing indicator:", error)
    return { success: false }
  }
}

export async function getTypingUsers() {
  try {
    const now = Date.now()
    const activeTyping: string[] = []

    // Clean up old typing indicators (older than 5 seconds)
    for (const [userHex, timestamp] of typingUsers.entries()) {
      if (now - timestamp > 5000) {
        typingUsers.delete(userHex)
      } else {
        activeTyping.push(userHex)
      }
    }

    return activeTyping
  } catch (error) {
    console.error("Error getting typing users:", error)
    return []
  }
}

export async function signOut() {
  try {
    const sessionToken = cookies().get("hue-session")?.value

    if (sessionToken) {
      // Get user hex before deleting session
      const sessions = await sql`
        SELECT user_hex FROM sessions WHERE session_token = ${sessionToken}
      `

      if (sessions.length > 0) {
        const userHex = sessions[0].user_hex
        // Clear typing indicator from memory
        typingUsers.delete(userHex)
      }

      await sql`
        DELETE FROM sessions WHERE session_token = ${sessionToken}
      `
    }

    cookies().delete("hue-session")
    return { success: true }
  } catch (error) {
    console.error("Error signing out:", error)
    return { success: false }
  }
}

export async function deleteUser(hexCode: string) {
  try {
    // Clear typing indicator from memory
    typingUsers.delete(hexCode)

    // Delete user's friend requests
    await sql`
      DELETE FROM friend_requests 
      WHERE from_user_hex = ${hexCode} OR to_user_hex = ${hexCode}
    `

    // Delete user's friendships
    await sql`
      DELETE FROM friends 
      WHERE user_hex = ${hexCode} OR friend_hex = ${hexCode}
    `

    // Delete user's sessions
    await sql`
      DELETE FROM sessions WHERE user_hex = ${hexCode}
    `

    // Delete user's reactions
    await sql`
      DELETE FROM reactions WHERE user_hex = ${hexCode}
    `

    // Delete user's typing indicators
    await sql`
      DELETE FROM typing_indicators WHERE user_hex = ${hexCode}
    `

    // Mark user's messages as deleted
    await sql`
      UPDATE messages 
      SET is_deleted = true 
      WHERE user_hex = ${hexCode}
    `

    // Delete user
    await sql`
      DELETE FROM users 
      WHERE hex_code = ${hexCode}
    `

    cookies().delete("hue-session")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function sendMessage(userHex: string, message: string) {
  try {
    await sql`
      INSERT INTO messages (user_hex, message)
      VALUES (${userHex}, ${message})
    `

    // Clear typing indicator from memory when message is sent
    typingUsers.delete(userHex)

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

export async function editMessage(messageId: number, newMessage: string, userHex: string) {
  try {
    const result = await sql`
      UPDATE messages 
      SET message = ${newMessage}, edited_at = CURRENT_TIMESTAMP
      WHERE id = ${messageId} 
      AND user_hex = ${userHex}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute'
      AND is_deleted = false
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error editing message:", error)
    return { success: false, error: "Failed to edit message" }
  }
}

export async function deleteMessage(messageId: number, userHex: string) {
  try {
    await sql`
      UPDATE messages 
      SET is_deleted = true
      WHERE id = ${messageId} 
      AND user_hex = ${userHex}
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute'
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting message:", error)
    return { success: false, error: "Failed to delete message" }
  }
}

export async function addReaction(messageId: number, userHex: string, emoji: string) {
  try {
    await sql`
      INSERT INTO reactions (message_id, user_hex, emoji)
      VALUES (${messageId}, ${userHex}, ${emoji})
      ON CONFLICT (message_id, user_hex, emoji) DO NOTHING
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error adding reaction:", error)
    return { success: false, error: "Failed to add reaction" }
  }
}

export async function removeReaction(messageId: number, userHex: string, emoji: string) {
  try {
    await sql`
      DELETE FROM reactions 
      WHERE message_id = ${messageId} 
      AND user_hex = ${userHex} 
      AND emoji = ${emoji}
    `

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error removing reaction:", error)
    return { success: false, error: "Failed to remove reaction" }
  }
}

export async function getMessages(userHex?: string) {
  try {
    // Run cleanup check when fetching messages
    await checkAndRunCleanup()

    const rows = await sql`
      SELECT 
        m.id, 
        m.message, 
        m.user_hex, 
        m.created_at, 
        m.edited_at, 
        m.is_deleted,
        COALESCE(f.nickname, m.user_hex) as display_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'emoji', r.emoji,
              'users', r.users,
              'count', r.count
            )
          ) FILTER (WHERE r.emoji IS NOT NULL), 
          '[]'
        ) as reactions
      FROM messages m
      LEFT JOIN friends f ON m.user_hex = f.friend_hex AND f.user_hex = ${userHex || ""}
      LEFT JOIN (
        SELECT 
          message_id,
          emoji,
          COUNT(*) as count,
          JSON_AGG(user_hex) as users
        FROM reactions 
        GROUP BY message_id, emoji
      ) r ON m.id = r.message_id
      WHERE m.is_deleted = false
      GROUP BY m.id, m.message, m.user_hex, m.created_at, m.edited_at, m.is_deleted, f.nickname
      ORDER BY m.created_at ASC
      LIMIT 100
    `
    return rows
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

export async function searchMessages(query: string, userHex?: string) {
  try {
    if (!query.trim()) {
      return []
    }

    const rows = await sql`
      SELECT 
        m.id, 
        m.message, 
        m.user_hex, 
        m.created_at, 
        m.edited_at, 
        m.is_deleted,
        COALESCE(f.nickname, m.user_hex) as display_name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'emoji', r.emoji,
              'users', r.users,
              'count', r.count
            )
          ) FILTER (WHERE r.emoji IS NOT NULL), 
          '[]'
        ) as reactions
      FROM messages m
      LEFT JOIN friends f ON m.user_hex = f.friend_hex AND f.user_hex = ${userHex || ""}
      LEFT JOIN (
        SELECT 
          message_id,
          emoji,
          COUNT(*) as count,
          JSON_AGG(user_hex) as users
        FROM reactions 
        GROUP BY message_id, emoji
      ) r ON m.id = r.message_id
      WHERE m.is_deleted = false 
      AND (
        LOWER(m.message) LIKE LOWER(${"%" + query + "%"}) 
        OR LOWER(m.user_hex) LIKE LOWER(${"%" + query + "%"})
        OR LOWER(COALESCE(f.nickname, '')) LIKE LOWER(${"%" + query + "%"})
      )
      GROUP BY m.id, m.message, m.user_hex, m.created_at, m.edited_at, m.is_deleted, f.nickname
      ORDER BY m.created_at DESC
      LIMIT 50
    `
    return rows
  } catch (error) {
    console.error("Error searching messages:", error)
    return []
  }
}

export async function getAllUsers() {
  try {
    const rows = await sql`
      SELECT hex_code FROM users ORDER BY created_at ASC
    `
    return rows.map((row) => row.hex_code)
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function fetchUrlMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HueBot/1.0)",
      },
    })

    if (!response.ok) {
      return { title: url }
    }

    const html = await response.text()
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : url

    return { title }
  } catch (error) {
    console.error("Error fetching URL metadata:", error)
    return { title: url }
  }
}
