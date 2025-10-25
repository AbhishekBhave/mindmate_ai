import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get user analytics data
    const { data: analyticsData, error: analyticsError } = await supabaseAdmin
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30)

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Calculate weekly and monthly stats
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const weeklyData = analyticsData?.filter(item => 
      new Date(item.date) >= weekAgo
    ) || []

    const monthlyData = analyticsData?.filter(item => 
      new Date(item.date) >= monthAgo
    ) || []

    // Calculate weekly stats
    const weeklyEntries = weeklyData.reduce((sum, item) => sum + item.entries_count, 0)
    const weeklyMoodSum = weeklyData.reduce((sum, item) => sum + (item.avg_mood_score * item.entries_count), 0)
    const weeklyTotalEntries = weeklyData.reduce((sum, item) => sum + item.entries_count, 0)
    const avgMoodScore = weeklyTotalEntries > 0 ? weeklyMoodSum / weeklyTotalEntries : 0.5

    // Calculate mood distribution
    const moodDistribution = weeklyData.reduce((acc, item) => {
      const dist = item.mood_distribution || { positive: 0, neutral: 0, negative: 0 }
      acc.positive += dist.positive || 0
      acc.neutral += dist.neutral || 0
      acc.negative += dist.negative || 0
      return acc
    }, { positive: 0, neutral: 0, negative: 0 })

    // Calculate streak
    let streak = 0
    const sortedData = [...analyticsData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (let i = 0; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].date)
      const expectedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      
      // Check if dates match (within 1 day tolerance)
      const diffDays = Math.abs(currentDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (diffDays <= 1) {
        streak++
      } else {
        break
      }
    }

    // Get unique emotions
    const allEmotions = new Set<string>()
    weeklyData.forEach(item => {
      if (item.emotions_detected) {
        item.emotions_detected.forEach((emotion: string) => allEmotions.add(emotion))
      }
    })

    // Calculate total words
    const totalWords = weeklyData.reduce((sum, item) => sum + item.word_count_total, 0)

    const analytics = {
      weeklyEntries,
      avgMoodScore,
      moodDistribution,
      emotionsDetected: Array.from(allEmotions),
      streak,
      totalWords,
      weeklyData: weeklyData.map(item => ({
        date: item.date,
        entriesCount: item.entries_count,
        avgMoodScore: item.avg_mood_score,
        moodDistribution: item.mood_distribution,
        emotionsDetected: item.emotions_detected,
        wordCount: item.word_count_total
      })),
      monthlyData: monthlyData.map(item => ({
        date: item.date,
        entriesCount: item.entries_count,
        avgMoodScore: item.avg_mood_score,
        moodDistribution: item.mood_distribution,
        emotionsDetected: item.emotions_detected,
        wordCount: item.word_count_total
      }))
    }

    return NextResponse.json({
      ok: true,
      data: analytics
    })

  } catch (error: unknown) {
    console.error('Analytics API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
