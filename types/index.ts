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
