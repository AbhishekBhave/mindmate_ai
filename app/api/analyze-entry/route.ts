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

    const prompt = `Analyze this journal entry for sentiment and provide supportive guidance. 

Entry: "${entryText}"

Please respond in the following JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": number (0-100),
  "suggestion": "A brief, gentle, supportive suggestion based on the entry content"
}

Guidelines:
- For positive entries: Provide affirmations and encouragement to share positive energy
- For negative entries: Offer gentle coping strategies and validation
- For neutral entries: Provide gentle prompts for deeper reflection
- Keep suggestions actionable and supportive
- Confidence should reflect how clear the sentiment is (higher for very positive/negative, lower for mixed/neutral)`

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

    return NextResponse.json({
      ok: true,
      data: {
        sentiment: validSentiment,
        confidence: validConfidence,
        suggestion: validSuggestion
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
        suggestion: 'Thank you for sharing your thoughts. Consider reflecting on what brought you to write this entry today.'
      }
    })
  }
}
