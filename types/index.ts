export interface User {
  id: string
  email: string
  display_name?: string
  created_at: string
}

export interface Entry {
  id: string
  user_id: string
  content: string
  created_at: string
  sentiment?: Sentiment
}

export interface Sentiment {
  id: string
  entry_id: string
  score: number
  label: 'positive' | 'neutral' | 'negative'
  summary?: string
  created_at: string
}

export interface EntryWithSentiment extends Entry {
  sentiment: Sentiment
}

export interface AIAnalysis {
  summary: string
  suggestions: string[]
  sentiment: {
    score: number
    label: 'positive' | 'neutral' | 'negative'
  }
}

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

// Community Types
export interface Pseudonym {
  id: string
  user_id: string
  category_id: string | null
  anonymous_username: string
  color_accent: string
  created_at: string
  expires_at: string | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon_name: string | null
  color: string
  is_sticky: boolean
  requires_approval: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  category_id: string | null
  pseudonym_id: string | null
  title: string
  content: string
  content_warnings: string[]
  mood_tags: string[]
  tone_analysis_score: number | null
  score: number
  reply_count: number
  reaction_count: number
  save_count: number
  report_count: number
  is_frozen: boolean
  is_deleted: boolean
  deleted_at: string | null
  moderation_status: 'pending' | 'approved' | 'flagged' | 'removed'
  created_at: string
  updated_at: string
  last_activity_at: string
  category?: Category
  pseudonym?: Pseudonym
}

export interface Reply {
  id: string
  post_id: string
  parent_reply_id: string | null
  pseudonym_id: string | null
  content: string
  is_mark_as_helpful: boolean
  helpful_count: number
  reaction_count: number
  report_count: number
  is_deleted: boolean
  deleted_at: string | null
  moderation_status: 'pending' | 'approved' | 'flagged' | 'removed'
  created_at: string
  updated_at: string
  depth: number
  pseudonym?: Pseudonym
  replies?: Reply[] // Nested replies
}

export interface Reaction {
  id: string
  user_id: string
  post_id: string | null
  reply_id: string | null
  reaction_type: 'heart' | 'hand' | 'celebration'
  created_at: string
}

export interface Save {
  id: string
  user_id: string
  post_id: string
  folder_name: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'reply' | 'mention' | 'save' | 'moderation' | 'crisis-resources'
  entity_type: 'post' | 'reply' | null
  entity_id: string
  message: string
  is_read: boolean
  metadata: Record<string, any> | null
  created_at: string
}

export interface CommunityState {
  categories: Category[]
  selectedCategory: string | null
  posts: Post[]
  isLoading: boolean
  sortBy: 'hot' | 'new' | 'top' | 'rising'
  timeRange: 'day' | 'week' | 'month' | 'all'
}
