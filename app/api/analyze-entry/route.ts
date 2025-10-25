import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { entryText } = await request.json()

    if (!entryText || typeof entryText !== 'string') {
      return NextResponse.json(
        { error: 'Entry text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const prompt = `Analyze this journal entry comprehensively and provide detailed, supportive guidance. 

Entry: "${entryText}"

Please respond in the following JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": number (0-100),
  "suggestion": "A detailed, gentle, supportive suggestion based on the entry content",
  "emotions": ["array of specific emotions detected"],
  "insights": ["array of 2-3 deeper insights about the emotional patterns"],
  "suggestions": ["array of 3-4 actionable suggestions"],
  "patterns": ["array of 2-3 behavioral or emotional patterns noticed"],
  "growthAreas": ["array of 2-3 areas for personal growth"]
}

Guidelines:
- For positive entries: Provide detailed affirmations, encourage sharing positive energy, suggest ways to maintain momentum
- For negative entries: Offer specific coping strategies, validate feelings, provide gentle reframing techniques
- For neutral entries: Provide prompts for deeper reflection, explore underlying emotions, suggest mindfulness practices
- Be descriptive and specific in all responses
- Confidence should reflect how clear the sentiment is (higher for very positive/negative, lower for mixed/neutral)
- Make suggestions actionable and personalized to the content
- Identify specific emotions, not just general mood
- Provide insights that help the user understand their emotional patterns
- Suggest concrete steps for growth and improvement`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive AI companion that analyzes journal entries and provides gentle, helpful suggestions. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysis = {
        sentiment: 'neutral',
        confidence: 50,
        suggestion: 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.'
      }
    }

    // Validate and sanitize the response
    const validSentiment = ['positive', 'negative', 'neutral'].includes(analysis.sentiment) 
      ? analysis.sentiment 
      : 'neutral'
    
    const validConfidence = typeof analysis.confidence === 'number' 
      ? Math.max(0, Math.min(100, analysis.confidence))
      : 50

    const validSuggestion = typeof analysis.suggestion === 'string' 
      ? analysis.suggestion
      : 'Thank you for sharing your thoughts.'

    const validEmotions = Array.isArray(analysis.emotions) 
      ? analysis.emotions.filter((e: any) => typeof e === 'string')
      : ['Reflective']

    const validInsights = Array.isArray(analysis.insights) 
      ? analysis.insights.filter((i: any) => typeof i === 'string')
      : ['Your entry shows emotional awareness and self-reflection skills.']

    const validSuggestions = Array.isArray(analysis.suggestions) 
      ? analysis.suggestions.filter((s: any) => typeof s === 'string')
      : ['Consider reflecting on what brought you to write this entry today.']

    const validPatterns = Array.isArray(analysis.patterns) 
      ? analysis.patterns.filter((p: any) => typeof p === 'string')
      : ['Clear emotional expression with good self-awareness']

    const validGrowthAreas = Array.isArray(analysis.growthAreas) 
      ? analysis.growthAreas.filter((g: any) => typeof g === 'string')
      : ['Regular reflection practice to build emotional intelligence']

    return NextResponse.json({
      ok: true,
      data: {
        sentiment: validSentiment,
        confidence: validConfidence,
        suggestion: validSuggestion,
        emotions: validEmotions,
        insights: validInsights,
        suggestions: validSuggestions,
        patterns: validPatterns,
        growthAreas: validGrowthAreas
      }
    })

  } catch (error) {
    console.error('AI Analysis Error:', error)
    
    // Fallback response
    return NextResponse.json({
      ok: true,
      data: {
        sentiment: 'neutral',
        confidence: 50,
        suggestion: 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.',
        emotions: ['Reflective'],
        insights: ['Your entry shows emotional awareness and self-reflection skills.'],
        suggestions: ['Consider reflecting on what brought you to write this entry today.'],
        patterns: ['Clear emotional expression with good self-awareness'],
        growthAreas: ['Regular reflection practice to build emotional intelligence']
      }
    })
  }
}
