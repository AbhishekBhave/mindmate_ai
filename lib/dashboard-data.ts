import { redirect } from 'next/navigation'
import { getServerSupabase } from '@/server/supabase/server-client'
import { supabaseAdmin } from '@/server/supabase/admin'

export interface DashboardData {
  entries: Array<{
    id: string
    content: string
    created_at: string
    word_count?: number
    reading_time?: number
    sentiment?: {
      id: string
      entry_id: string
      score: number
      label: 'positive' | 'neutral' | 'negative'
      confidence: number
      emotions?: string[]
      summary?: string
      ai_feedback?: string
      created_at: string
    }
  }>
  moodGraph: Array<{
    date: string // YYYY-MM-DD
    avgScore: number
    label: 'positive' | 'neutral' | 'negative'
  }>
  insights: {
    weeklyEntries: number
    avgMoodScore: number
    moodDistribution: {
      positive: number
      neutral: number
      negative: number
    }
    streak: number
  }
}

/**
 * Server-side function to fetch all dashboard data for a user
 * Uses two separate queries to avoid RLS join issues
 */
export async function getDashboardData(): Promise<DashboardData> {
  // Get authenticated user using server client
  const supabase = await getServerSupabase()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('[DASHBOARD] Auth error:', {
      error: userError?.message || 'No user'
    })
    redirect('/sign-in')
  }

  const userId = user.id
  console.log('[DASHBOARD] Fetching data for user:', userId)

  // Calculate date range for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString()

  // Query 1: Fetch entries (last 30 days) using explicit RLS-aware query
  const entriesResult = await supabaseAdmin
    .from('entries')
    .select('id, content, created_at, word_count, reading_time')
    .eq('user_id', userId)
    .gte('created_at', cutoffDate)
    .order('created_at', { ascending: true })
    .limit(100)

  if (entriesResult.error) {
    console.error('[DASHBOARD] Error fetching entries:', {
      message: entriesResult.error.message,
      code: entriesResult.error.code,
      details: entriesResult.error.details,
      hint: entriesResult.error.hint,
      error: JSON.stringify(entriesResult.error, null, 2)
    })
    // Return empty state rather than throwing
    return {
      entries: [],
      moodGraph: [],
      insights: {
        weeklyEntries: 0,
        avgMoodScore: 0.5,
        moodDistribution: { positive: 0, neutral: 0, negative: 0 },
        streak: 0
      }
    }
  }

  const entries = entriesResult.data

  if (!entries || entries.length === 0) {
    console.log('[DASHBOARD] No entries found for user')
    return {
      entries: [],
      moodGraph: [],
      insights: {
        weeklyEntries: 0,
        avgMoodScore: 0.5,
        moodDistribution: { positive: 0, neutral: 0, negative: 0 },
        streak: 0
      }
    }
  }

  console.log('[DASHBOARD] Found entries:', entries.length)

  // Query 2: Fetch sentiments for these entries separately
  const entryIds = entries.map(e => e.id)
  
  const sentimentsResult = await supabaseAdmin
    .from('sentiments')
    .select('id, entry_id, score, label, confidence, summary, ai_feedback, emotions')
    .in('entry_id', entryIds)

  if (sentimentsResult.error) {
    console.error('[DASHBOARD] Error fetching sentiments:', {
      message: sentimentsResult.error.message,
      code: sentimentsResult.error.code,
      details: sentimentsResult.error.details,
      hint: sentimentsResult.error.hint,
      error: JSON.stringify(sentimentsResult.error, null, 2)
    })
    // Continue with entries even if sentiments fail
  }

  const sentiments = sentimentsResult.data

  // Stitch entries with sentiments by entry_id
  const sentimentMap = new Map(
    (sentiments || []).map(s => [s.entry_id, s])
  )

  const processedEntries = entries.map(entry => {
    const sentiment = sentimentMap.get(entry.id)
    return {
      ...entry,
      sentiment: sentiment ? {
        id: sentiment.id,
        entry_id: sentiment.entry_id,
        score: sentiment.score,
        label: sentiment.label as 'positive' | 'neutral' | 'negative',
        confidence: sentiment.confidence,
        emotions: sentiment.emotions,
        summary: sentiment.summary,
        ai_feedback: sentiment.ai_feedback,
        created_at: entry.created_at // Use entry's created_at since sentiments doesn't have one
      } : undefined
    }
  })

  console.log('[DASHBOARD] Processed entries with sentiments:', processedEntries.filter(e => e.sentiment).length)

  // Transform data for mood graph - bucket by day
  const moodGraph = transformEntriesToMoodGraph(processedEntries)

  // Calculate insights
  const insights = calculateInsights(processedEntries)

  // Return data ordered by created_at desc for recent entries display
  const orderedEntries = [...processedEntries].reverse()

  return {
    entries: orderedEntries,
    moodGraph,
    insights
  }
}

/**
 * Transform entries into mood graph data
 * Buckets entries by day, averages scores, determines labels
 */
function transformEntriesToMoodGraph(entries: any[]) {
  const dayBuckets = new Map<string, { scores: number[], labels: string[] }>()

  // Group entries by day
  entries.forEach(entry => {
    if (!entry.sentiment) return

    const date = new Date(entry.created_at)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!dayBuckets.has(dateKey)) {
      dayBuckets.set(dateKey, { scores: [], labels: [] })
    }

    const bucket = dayBuckets.get(dateKey)!
    bucket.scores.push(entry.sentiment.score)
    bucket.labels.push(entry.sentiment.label)
  })

  // Convert to graph data points
  const graphData = Array.from(dayBuckets.entries())
    .map(([date, bucket]) => {
      const avgScore = bucket.scores.reduce((sum, score) => sum + score, 0) / bucket.scores.length
      
      // Determine label based on average score
      let label: 'positive' | 'neutral' | 'negative'
      if (avgScore >= 0.6) {
        label = 'positive'
      } else if (avgScore <= 0.4) {
        label = 'negative'
      } else {
        label = 'neutral'
      }

      // Clamp score to [0, 1]
      const clampedScore = Math.max(0, Math.min(1, avgScore))

      return {
        date,
        avgScore: clampedScore,
        label
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date)) // Sort ascending for time series

  console.log('📊 [DASHBOARD] Mood graph points:', graphData.length)
  if (graphData.length > 0) {
    console.log('📊 [DASHBOARD] First point:', graphData[0])
    console.log('📊 [DASHBOARD] Last point:', graphData[graphData.length - 1])
  }

  return graphData
}

/**
 * Calculate insights from entries
 * Computes weekly entries, average mood, distribution, streak
 */
function calculateInsights(entries: any[]) {
  if (entries.length === 0) {
    return {
      weeklyEntries: 0,
      avgMoodScore: 0.5,
      moodDistribution: { positive: 0, neutral: 0, negative: 0 },
      streak: 0
    }
  }

  // Filter last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentEntries = entries.filter(entry => 
    new Date(entry.created_at) >= sevenDaysAgo && entry.sentiment
  )

  // Weekly entries count
  const weeklyEntries = recentEntries.length

  // Average mood score
  const avgMoodScore = recentEntries.reduce((sum, entry) => {
    return sum + (entry.sentiment?.score || 0.5)
  }, 0) / (recentEntries.length || 1)

  // Mood distribution (last 14 days)
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const moodDistribution = { positive: 0, neutral: 0, negative: 0 }
  entries
    .filter(entry => 
      new Date(entry.created_at) >= fourteenDaysAgo && 
      entry.sentiment
    )
    .forEach(entry => {
      const label = entry.sentiment.label
      if (label === 'positive') moodDistribution.positive++
      else if (label === 'negative') moodDistribution.negative++
      else moodDistribution.neutral++
    })

  // Calculate streak
  const streak = calculateStreak(entries)

  return {
    weeklyEntries,
    avgMoodScore,
    moodDistribution,
    streak
  }
}

/**
 * Calculate consecutive day streak from entries
 */
function calculateStreak(entries: any[]): number {
  if (entries.length === 0) return 0

  // Get unique dates with entries
  const entryDates = new Set(
    entries.map(entry => {
      const date = new Date(entry.created_at)
      return date.toISOString().split('T')[0]
    })
  )

  const sortedDates = Array.from(entryDates).sort((a, b) => b.localeCompare(a))
  
  let streak = 0
  const today = new Date().toISOString().split('T')[0]

  // Check if there's an entry today
  let checkDate = today
  for (const entryDate of sortedDates) {
    const date1 = new Date(checkDate)
    const date2 = new Date(entryDate)
    const diffTime = date1.getTime() - date2.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0 || diffDays === 1) {
      streak++
      checkDate = entryDate
    } else {
      break
    }
  }

  return streak
}

