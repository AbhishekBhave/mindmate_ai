import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/server/ai/openai'

const openai = openaiClient

if (!openai) {
  console.warn('OpenAI client not initialized - API key missing')
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 [ANALYZE-ENTRY] Received request')
    const body = await request.json()
    const { entryText, entryId } = body
    
    console.log('📝 [ANALYZE-ENTRY] Entry text length:', entryText?.length || 0)
    console.log('📝 [ANALYZE-ENTRY] Entry ID:', entryId || 'not provided')

    // Validate and sanitize input
    if (!entryText || typeof entryText !== 'string') {
      console.log('❌ [ANALYZE-ENTRY] Invalid entry text provided')
      return NextResponse.json(
        { ok: false, error: 'Entry text is required' },
        { status: 400 }
      )
    }

    const trimmedText = entryText.trim()
    if (!trimmedText) {
      console.log('❌ [ANALYZE-ENTRY] Empty entry text after trimming')
      return NextResponse.json(
        { ok: false, error: 'Entry text cannot be empty' },
        { status: 400 }
      )
    }

    if (!openai) {
      console.warn('⚠️ [ANALYZE-ENTRY] OpenAI client not available - returning demo fallback')
      // Return a graceful fallback for demo purposes when OpenAI is not configured
      return NextResponse.json({
        ok: true,
        data: {
          sentiment: 'neutral',
          confidence: 50,
          suggestion: 'Thank you for sharing your thoughts. This is a demo response - configure your OpenAI API key for full AI analysis.',
          ai_feedback: 'Thank you for sharing your thoughts. This is a demo response - configure your OpenAI API key for full AI analysis.',
          emotions: ['Reflective'],
          insights: ['Your entry shows emotional awareness and self-reflection skills. Configure OpenAI API key for personalized insights.'],
          suggestions: ['Consider reflecting on what brought you to write this entry today.', 'Set up your OpenAI API key in .env.local to enable full AI analysis.'],
          patterns: ['Clear emotional expression with good self-awareness'],
          growthAreas: ['Regular reflection practice to build emotional intelligence']
        }
      })
    }

    console.log('✅ [ANALYZE-ENTRY] OpenAI client available, proceeding...')

    // Create personalized prompt with the actual user entry
    const prompt = `Analyze this journal entry and provide personalized, empathetic guidance. Reference specific details from the entry.

User Entry: "${trimmedText}"

Respond in JSON format ONLY:
{
  "sentiment": "positive or negative or neutral",
  "confidence": number 0-100,
  "suggestion": "A specific, empathetic 1-2 sentence suggestion that references details from the entry",
  "emotions": ["specific emotions detected in the entry"],
  "insights": ["2-3 insights about the emotional patterns"],
  "suggestions": ["3-4 actionable suggestions specific to this entry"],
  "patterns": ["1-2 behavioral or emotional patterns"],
  "growthAreas": ["1-2 areas for personal growth"]
}

Requirements:
- For positive entries: celebrate specific achievements, encourage momentum
- For negative entries: validate feelings specifically, offer concrete coping strategies
- For neutral entries: prompt deeper reflection with specific questions
- Reference concrete details from the entry
- Keep suggestions actionable and specific
- Confidence reflects clarity of sentiment (high 80-95, medium 50-79, low 30-49)`

    console.log('🚀 [ANALYZE-ENTRY] Calling OpenAI API...')
    
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a supportive AI companion that analyzes journal entries and provides empathetic, personalized guidance. You MUST respond with valid JSON only. Include specific details from the entry in your suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
      })
      
      console.log('✅ [ANALYZE-ENTRY] OpenAI API call successful')
      console.log('📊 [ANALYZE-ENTRY] Choices returned:', completion.choices?.length || 0)
    } catch (error: any) {
      console.error('❌ [ANALYZE-ENTRY] OpenAI API error:', {
        message: error?.message,
        code: error?.code,
        type: error?.type,
        status: error?.status
      })
      
      // Handle specific OpenAI API errors gracefully
      if (error?.status === 401 || error?.message?.includes('Incorrect API key') || error?.message?.includes('401')) {
        console.warn('⚠️ [ANALYZE-ENTRY] OpenAI API key error - returning fallback')
        return NextResponse.json({
          ok: true,
          data: {
            sentiment: 'neutral',
            confidence: 50,
            suggestion: 'Thank you for sharing your thoughts. There was an issue with the AI service - please check your OpenAI API key configuration.',
            ai_feedback: 'Thank you for sharing your thoughts. There was an issue with the AI service - please check your OpenAI API key configuration.',
            emotions: ['Reflective'],
            insights: ['Your entry shows emotional awareness and self-reflection skills.'],
            suggestions: ['Consider reflecting on what brought you to write this entry today.'],
            patterns: ['Clear emotional expression with good self-awareness'],
            growthAreas: ['Regular reflection practice to build emotional intelligence']
          }
        })
      }
      
      // For other errors, throw to be caught by outer catch block
      throw error
    }

    // Guard against empty choices
    if (!completion.choices || completion.choices.length === 0) {
      console.error('❌ [ANALYZE-ENTRY] No choices returned from OpenAI')
      throw new Error('OpenAI returned no choices')
    }

    const responseText = completion.choices[0]?.message?.content
    console.log('📄 [ANALYZE-ENTRY] Response length:', responseText?.length || 0)
    
    if (!responseText) {
      console.error('❌ [ANALYZE-ENTRY] Empty response from OpenAI')
      throw new Error('OpenAI returned empty response')
    }

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(responseText)
      console.log('✅ [ANALYZE-ENTRY] Successfully parsed JSON')
    } catch (parseError) {
      console.error('❌ [ANALYZE-ENTRY] JSON parse error:', parseError)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Validate and sanitize the response
    const validSentiment = ['positive', 'negative', 'neutral'].includes(analysis.sentiment) 
      ? analysis.sentiment 
      : 'neutral'
    
    const validConfidence = typeof analysis.confidence === 'number' 
      ? Math.max(0, Math.min(100, analysis.confidence))
      : 50

    const validSuggestion = typeof analysis.suggestion === 'string' && analysis.suggestion.trim()
      ? analysis.suggestion.trim()
      : 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.'

    const validEmotions = Array.isArray(analysis.emotions) && analysis.emotions.length > 0
      ? analysis.emotions.filter((e: any) => typeof e === 'string' && e.length > 0).slice(0, 5)
      : ['Reflective']

    const validInsights = Array.isArray(analysis.insights) && analysis.insights.length > 0
      ? analysis.insights.filter((i: any) => typeof i === 'string' && i.length > 0).slice(0, 3)
      : ['Your entry shows emotional awareness and self-reflection skills.']

    const validSuggestions = Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0
      ? analysis.suggestions.filter((s: any) => typeof s === 'string' && s.length > 0).slice(0, 4)
      : ['Consider reflecting on what brought you to write this entry today.']

    const validPatterns = Array.isArray(analysis.patterns) && analysis.patterns.length > 0
      ? analysis.patterns.filter((p: any) => typeof p === 'string' && p.length > 0).slice(0, 2)
      : ['Clear emotional expression with good self-awareness']

    const validGrowthAreas = Array.isArray(analysis.growthAreas) && analysis.growthAreas.length > 0
      ? analysis.growthAreas.filter((g: any) => typeof g === 'string' && g.length > 0).slice(0, 2)
      : ['Regular reflection practice to build emotional intelligence']

    console.log('✅ [ANALYZE-ENTRY] Returning analysis:', {
      sentiment: validSentiment,
      confidence: validConfidence,
      suggestionLength: validSuggestion.length,
      emotionsCount: validEmotions.length,
      insightsCount: validInsights.length
    })

    return NextResponse.json({
      ok: true,
      data: {
        sentiment: validSentiment,
        confidence: validConfidence,
        suggestion: validSuggestion,
        ai_feedback: validSuggestion, // Store in ai_feedback for database
        emotions: validEmotions,
        insights: validInsights,
        suggestions: validSuggestions,
        patterns: validPatterns,
        growthAreas: validGrowthAreas
      }
    })

  } catch (error) {
    console.error('❌ [ANALYZE-ENTRY] Error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Return error state, not fallback
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'AI analysis failed',
      data: {
        sentiment: 'neutral',
        confidence: 50,
        suggestion: 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.',
        ai_feedback: 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.',
        emotions: ['Reflective'],
        insights: ['Your entry shows emotional awareness and self-reflection skills.'],
        suggestions: ['Consider reflecting on what brought you to write this entry today.'],
        patterns: ['Clear emotional expression with good self-awareness'],
        growthAreas: ['Regular reflection practice to build emotional intelligence']
      }
    })
  }
}
