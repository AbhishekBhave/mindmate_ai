import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabase/admin'
import { getServerSupabase } from '@/server/supabase/server-client'
import { summarizeText } from '@/server/ai/openai'
import { analyzeSentimentEnhanced } from '@/server/ai/sentiment'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await getServerSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { content } = await request.json()

    if (!content) {
      return NextResponse.json(
        { ok: false, error: 'Content is required' },
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

    // Analyze the entry with enhanced AI
    let sentimentData: any = {
      entry_id: entry.id,
      score: 0.5,
      label: 'neutral',
      summary: 'Summary unavailable',
      ai_feedback: 'Analysis in progress...',
      confidence: 0.5,
      emotions: []
    }

    try {
      console.log('[API/ENTRIES] Starting AI analysis for entry:', entry.id)
      
      // Get AI analysis
      const [summaryResult, sentimentResult] = await Promise.all([
        summarizeText(content),
        analyzeSentimentEnhanced(content)
      ])

      // Update sentiment data with AI results
      sentimentData = {
        entry_id: entry.id,
        score: sentimentResult.finalScore,
        label: sentimentResult.finalLabel,
        summary: summaryResult.summary,
        ai_feedback: summaryResult.summary, // Use summary as AI feedback
        confidence: sentimentResult.confidence,
        emotions: sentimentResult.emotions,
        model_results: sentimentResult.modelResults
      }

      console.log('[API/ENTRIES] AI analysis complete:', {
        label: sentimentData.label,
        score: sentimentData.score,
        confidence: sentimentData.confidence
      })

    } catch (aiError: unknown) {
      console.error('[API/ENTRIES] AI analysis error:', {
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        error: aiError
      })
      // Use fallback sentiment data already set above
    }

    // Save sentiment analysis
    const { data: savedSentiment, error: sentimentError } = await supabaseAdmin
      .from('sentiments')
      .insert(sentimentData)
      .select()
      .single()

    if (sentimentError) {
      console.error('[API/ENTRIES] Error saving sentiment:', {
        message: sentimentError.message,
        code: sentimentError.code,
        details: sentimentError.details
      })
    }

    // Read back the complete entry with sentiment
    const { data: completeEntry, error: readError } = await supabaseAdmin
      .from('entries')
      .select(`
        *,
        sentiment:sentiments(
          id,
          entry_id,
          score,
          label,
          confidence,
          summary,
          ai_feedback,
          emotions
        )
      `)
      .eq('id', entry.id)
      .single()

    if (readError) {
      console.error('[API/ENTRIES] Error reading back entry:', readError)
    }

    return NextResponse.json({
      ok: true,
      data: completeEntry || entry
    })
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
    console.log('📥 [ENTRIES-PUT] Received request to update sentiment')
    const { entryId, sentiment } = await request.json()

    if (!entryId || !sentiment) {
      console.log('❌ [ENTRIES-PUT] Missing entryId or sentiment')
      return NextResponse.json(
        { ok: false, error: 'entryId and sentiment are required' },
        { status: 400 }
      )
    }

    console.log('📊 [ENTRIES-PUT] Updating sentiment for entry:', entryId)
    console.log('📊 [ENTRIES-PUT] Sentiment data:', {
      label: sentiment.sentiment,
      confidence: sentiment.confidence,
      hasSuggestion: !!sentiment.suggestion,
      hasAiFeedback: !!sentiment.ai_feedback
    })

    // Convert confidence from percentage to decimal if needed
    const score = typeof sentiment.confidence === 'number' 
      ? (sentiment.confidence > 1 ? sentiment.confidence / 100 : sentiment.confidence)
      : 0.5

    // Update the sentiment for the entry with ai_feedback
    const { data, error: sentimentError } = await supabaseAdmin
      .from('sentiments')
      .upsert({
        entry_id: entryId,
        score: score,
        label: sentiment.sentiment,
        confidence: score,
        summary: sentiment.suggestion || sentiment.summary,
        ai_feedback: sentiment.ai_feedback || sentiment.suggestion, // Store AI feedback
        emotions: Array.isArray(sentiment.emotions) ? sentiment.emotions : []
      }, {
        onConflict: 'entry_id'
      })
      .select()
      .single()

    if (sentimentError) {
      console.error('❌ [ENTRIES-PUT] Error updating sentiment:', sentimentError)
      return NextResponse.json(
        { ok: false, error: 'Failed to update sentiment' },
        { status: 500 }
      )
    }

    console.log('✅ [ENTRIES-PUT] Successfully updated sentiment')

    return NextResponse.json({
      ok: true,
      data: { message: 'Sentiment updated successfully', sentiment: data }
    })
  } catch (error: unknown) {
    console.error('❌ [ENTRIES-PUT] Error:', error instanceof Error ? error.message : 'Unknown error')
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
        sentiment:sentiments(
          id,
          entry_id,
          score,
          label,
          confidence,
          summary,
          ai_feedback,
          emotions,
          created_at
        )
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

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const entryId = url.searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json(
        { ok: false, error: 'entryId is required' },
        { status: 400 }
      )
    }

    // Delete the entry (sentiment will be cascade deleted)
    const { error } = await supabaseAdmin
      .from('entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Error deleting entry:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to delete entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: { message: 'Entry deleted successfully' }
    })
  } catch (error: unknown) {
    console.error('API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
