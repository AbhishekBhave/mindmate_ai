import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/server/ai/openai'

const openai = openaiClient

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 [HEALTH] OpenAI health check requested')

    if (!openai) {
      console.error('❌ [HEALTH] OpenAI client not initialized')
      return NextResponse.json({
        ok: false,
        status: 'unhealthy',
        error: 'OpenAI client not initialized - API key missing',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    console.log('✅ [HEALTH] OpenAI client available')

    // Test with a known positive entry
    const testEntry = "I am excited about winning a robotics competition"
    console.log('🧪 [HEALTH] Testing with entry:', testEntry)

    const prompt = `Analyze this journal entry briefly in 1-2 sentences and determine sentiment.

Entry: "${testEntry}"

Respond with JSON only:
{
  "sentiment": "positive" or "negative" or "neutral",
  "confidence": 0-100,
  "suggestion": "1-2 sentence response"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analyzer. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    if (!completion.choices || completion.choices.length === 0) {
      console.error('❌ [HEALTH] No choices returned')
      return NextResponse.json({
        ok: false,
        status: 'unhealthy',
        error: 'OpenAI returned no choices',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    const responseText = completion.choices[0]?.message?.content
    console.log('📄 [HEALTH] OpenAI response:', responseText?.substring(0, 100))

    if (!responseText) {
      console.error('❌ [HEALTH] Empty response from OpenAI')
      return NextResponse.json({
        ok: false,
        status: 'unhealthy',
        error: 'OpenAI returned empty response',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Parse and validate response
    let analysis
    try {
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ [HEALTH] JSON parse error:', parseError)
      return NextResponse.json({
        ok: false,
        status: 'unhealthy',
        error: 'Failed to parse OpenAI response',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

    // Check that it's not returning neutral (should be positive for this test)
    const isPositive = analysis.sentiment === 'positive'
    const hasSpecificSuggestion = analysis.suggestion && analysis.suggestion.length > 20

    if (!isPositive || !hasSpecificSuggestion) {
      console.warn('⚠️ [HEALTH] Response does not match expectations:', {
        sentiment: analysis.sentiment,
        suggestionLength: analysis.suggestion?.length || 0
      })
    }

    console.log('✅ [HEALTH] OpenAI pipeline is healthy:', {
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      suggestionLength: analysis.suggestion?.length || 0
    })

    return NextResponse.json({
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      test: {
        input: testEntry,
        output: {
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          suggestionLength: analysis.suggestion?.length || 0,
          isPersonalized: !analysis.suggestion?.includes('generic') && analysis.suggestion?.length > 20
        }
      }
    })

  } catch (error) {
    console.error('❌ [HEALTH] OpenAI health check failed:', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.json({
      ok: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}

