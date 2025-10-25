import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabase/admin'
import { summarizeText } from '@/server/ai/openai'
import { scoreSentiment } from '@/server/ai/sentiment'

export async function POST(request: NextRequest) {
  try {
    const { content, userId } = await request.json()

    if (!content || !userId) {
      return NextResponse.json(
        { ok: false, error: 'Content and userId are required' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 5000) {
      return NextResponse.json(
        { ok: false, error: 'Entry content too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Create the entry
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('entries')
      .insert({
        user_id: userId,
        content: content.trim()
      })
      .select()
      .single()

    if (entryError) {
      console.error('Error creating entry:', entryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to create entry' },
        { status: 500 }
      )
    }

    // Analyze the entry with AI
    try {
      const [summaryResult, sentimentResult] = await Promise.all([
        summarizeText(content),
        scoreSentiment(content)
      ])

      // Save sentiment analysis
      const { error: sentimentError } = await supabaseAdmin
        .from('sentiments')
        .insert({
          entry_id: entry.id,
          score: sentimentResult.score,
          label: sentimentResult.label,
          summary: summaryResult.summary
        })

      if (sentimentError) {
        console.error('Error saving sentiment:', sentimentError)
      }

      return NextResponse.json({
        ok: true,
        data: {
          entry,
          analysis: {
            summary: summaryResult.summary,
            sentiment: sentimentResult
          }
        }
      })
    } catch (aiError: unknown) {
      console.error('AI analysis error:', aiError instanceof Error ? aiError.message : 'Unknown error')
      
      // Save entry with default sentiment if AI fails
      await supabaseAdmin
        .from('sentiments')
        .insert({
          entry_id: entry.id,
          score: 0.5,
          label: 'neutral',
          summary: 'Summary unavailable'
        })

      return NextResponse.json({
        ok: true,
        data: {
          entry,
          analysis: {
            summary: 'Summary unavailable',
            sentiment: { score: 0.5, label: 'neutral' as const }
          }
        }
      })
    }
  } catch (error: unknown) {
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { entryId, sentiment } = await request.json()

    if (!entryId || !sentiment) {
      return NextResponse.json(
        { ok: false, error: 'entryId and sentiment are required' },
        { status: 400 }
      )
    }

    // Update the sentiment for the entry
    const { error: sentimentError } = await supabaseAdmin
      .from('sentiments')
      .upsert({
        entry_id: entryId,
        score: sentiment.confidence / 100, // Convert percentage to decimal
        label: sentiment.sentiment,
        summary: sentiment.suggestion
      })

    if (sentimentError) {
      console.error('Error updating sentiment:', sentimentError)
      return NextResponse.json(
        { ok: false, error: 'Failed to update sentiment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: { message: 'Sentiment updated successfully' }
    })
  } catch (error: unknown) {
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { data: entries, error } = await supabaseAdmin
      .from('entries')
      .select(`
        *,
        sentiment:sentiments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching entries:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: entries
    })
  } catch (error: unknown) {
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
