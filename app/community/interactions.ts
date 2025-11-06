// Community Interactions - localStorage-based state management

const STORAGE_KEY = 'mindmate_community_interactions'
const USER_ID_KEY = 'mindmate_user_id'

export interface ReactionState {
  postId: string
  userId: string
  emoji: '❤️' | '👍' | '🎉'
  timestamp: number
}

export interface SavedState {
  postId: string
  userId: string
  timestamp: number
}

export interface CommentState {
  postId: string
  userId: string
  content: string
  timestamp: number
}

export function getUserInteractions() {
  if (typeof window === 'undefined') return { reactions: [], saved: [], comments: [] }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return { reactions: [], saved: [], comments: [] }
  
  try {
    return JSON.parse(stored)
  } catch {
    return { reactions: [], saved: [], comments: [] }
  }
}

export function saveUserInteraction(type: 'reaction' | 'saved' | 'comment', data: any) {
  if (typeof window === 'undefined') return
  
  const current = getUserInteractions()
  const userId = getCurrentUserId()
  
  if (type === 'reaction') {
    // Remove existing reaction from same user to same post, then add new
    current.reactions = current.reactions.filter(
      (r: ReactionState) => !(r.postId === data.postId && r.userId === userId)
    )
    current.reactions.push({ ...data, userId, timestamp: Date.now() })
  } else if (type === 'saved') {
    // Toggle saved state
    const existing = current.saved.find(
      (s: SavedState) => s.postId === data.postId && s.userId === userId
    )
    if (existing) {
      current.saved = current.saved.filter(
        (s: SavedState) => !(s.postId === data.postId && s.userId === userId)
      )
    } else {
      current.saved.push({ ...data, userId, timestamp: Date.now() })
    }
  } else if (type === 'comment') {
    current.comments = current.comments || []
    current.comments.push({ ...data, userId, timestamp: Date.now() })
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (error) {
    console.error('Failed to save interaction:', error)
  }
}

export function getUserReaction(postId: string, userId: string): ReactionState | null {
  const interactions = getUserInteractions()
  return interactions.reactions.find(
    (r: ReactionState) => r.postId === postId && r.userId === userId
  ) || null
}

export function isPostSaved(postId: string, userId: string): boolean {
  const interactions = getUserInteractions()
  return interactions.saved.some(
    (s: SavedState) => s.postId === postId && s.userId === userId
  )
}

export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored
  
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
  localStorage.setItem(USER_ID_KEY, userId)
  return userId
}

export function getReactionsCount(postId: string): { total: number, byEmoji: Record<string, number> } {
  const interactions = getUserInteractions()
  const postReactions = interactions.reactions.filter((r: ReactionState) => r.postId === postId)
  
  const byEmoji: Record<string, number> = {}
  postReactions.forEach((r: ReactionState) => {
    byEmoji[r.emoji] = (byEmoji[r.emoji] || 0) + 1
  })
  
  return {
    total: postReactions.length,
    byEmoji
  }
}

export function getCommentsCount(postId: string): number {
  const interactions = getUserInteractions()
  const comments = interactions.comments || []
  return comments.filter((c: CommentState) => c.postId === postId).length
}

