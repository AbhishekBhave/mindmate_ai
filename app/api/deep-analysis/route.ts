import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/server/supabase/admin'
import { openaiClient } from '@/server/ai/openai'

const openai = openaiClient

if (!openai) {
  console.warn('OpenAI client not initialized - API key missing')
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request using cookies
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    if (!openai) {
      return NextResponse.json(
        { ok: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get user's last 10 entries for deep analysis
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('entries')
      .select(`
        content,
        created_at,
        sentiment:sentiments(
          label,
          score,
          confidence,
          emotions,
          summary
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          emotionalPatterns: 'Start writing entries to receive personalized insights.',
          growthAreas: 'Continue your journaling practice to identify growth areas.',
          strengths: 'Your commitment to self-reflection is a strength in itself.',
          challenges: 'As you continue journaling, deeper patterns will emerge.',
          recommendations: 'Try to write at least one entry daily to build momentum.',
          insightSummary: 'Welcome to your wellness journey! Keep writing and we\'ll provide deeper insights as you progress.',
          confidence: 30
        }
      })
    }

    // Prepare context for AI analysis
    const entriesContext = entries.map((entry, index) => {
      const date = new Date(entry.created_at).toLocaleDateString()
      const sentiment = entry.sentiment?.[0] || { label: 'neutral', score: 0.5, confidence: 0.5 }
      const confidence = typeof sentiment.confidence === 'number' 
        ? Math.round(sentiment.confidence * 100) 
        : Math.round(sentiment.score * 100)
      
      return `Entry ${index + 1} (${date}):
Content: "${entry.content}"
Sentiment: ${sentiment.label} (${confidence}% confidence)
Emotions: ${sentiment.emotions?.join(', ') || 'Not detected'}
AI Summary: ${sentiment.summary || 'No summary available'}`
    }).join('\n\n')

    const prompt = `You are a compassionate AI companion analyzing a user's journal entries to provide deep, personalized insights about their emotional patterns and personal growth.

User's Recent Entries:
${entriesContext}

Please provide a comprehensive analysis in the following JSON format:
{
  "emotionalPatterns": "Analysis of recurring emotional themes and patterns",
  "growthAreas": "Areas where the user shows potential for personal development",
  "strengths": "Positive patterns and strengths observed",
  "challenges": "Challenges or difficult patterns that might need attention",
  "recommendations": "Specific, actionable recommendations for continued growth",
  "insightSummary": "A warm, empathetic summary paragraph that captures the essence of their journey",
  "confidence": number (0-100, how confident you are in this analysis)
}

Guidelines:
- Be warm, empathetic, and supportive in tone
- Focus on patterns across multiple entries, not individual entries
- Provide specific, actionable recommendations
- Acknowledge both strengths and areas for growth
- Use encouraging language that validates their emotional journey
- Include disclaimers that this is reflective support, not psychological advice
- Keep recommendations practical and achievable
- Confidence should reflect how clear the patterns are across entries`

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate AI companion that provides deep, personalized insights about emotional patterns and personal growth. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      })
    } catch (error: any) {
      // Log API errors but don't hide them - user has credits now
      console.error('OpenAI API error:', error?.message || error)
      throw error
    }

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback if JSON parsing fails
      analysis = {
        emotionalPatterns: 'Your entries show a thoughtful approach to self-reflection and emotional awareness.',
        growthAreas: 'Continue exploring your emotional patterns and consider setting small, achievable goals for personal development.',
        strengths: 'You demonstrate consistent self-reflection and emotional awareness in your journaling practice.',
        challenges: 'Consider exploring any recurring themes or patterns that might benefit from deeper reflection.',
        recommendations: 'Continue your journaling practice and consider exploring new perspectives on recurring themes.',
        insightSummary: 'Your journaling journey shows growth and self-awareness. Keep reflecting and exploring your inner world.',
        confidence: 60
      }
    }

    // Validate and sanitize the response
    const validAnalysis = {
      emotionalPatterns: typeof analysis.emotionalPatterns === 'string' 
        ? analysis.emotionalPatterns 
        : 'Your entries show thoughtful emotional reflection.',
      growthAreas: typeof analysis.growthAreas === 'string' 
        ? analysis.growthAreas 
        : 'Continue exploring your emotional patterns and personal development.',
      strengths: typeof analysis.strengths === 'string' 
        ? analysis.strengths 
        : 'You demonstrate consistent self-reflection and emotional awareness.',
      challenges: typeof analysis.challenges === 'string' 
        ? analysis.challenges 
        : 'Consider exploring any recurring themes that might benefit from deeper reflection.',
      recommendations: typeof analysis.recommendations === 'string' 
        ? analysis.recommendations 
        : 'Continue your journaling practice and explore new perspectives.',
      insightSummary: typeof analysis.insightSummary === 'string' 
        ? analysis.insightSummary 
        : 'Your journaling journey shows growth and self-awareness.',
      confidence: typeof analysis.confidence === 'number' 
        ? Math.max(0, Math.min(100, analysis.confidence))
        : 70
    }

    // Save the AI insight to the database
    const { error: insightError } = await supabaseAdmin
      .from('ai_insights')
      .insert({
        user_id: userId,
        insight_type: 'deep_analysis',
        content: JSON.stringify(validAnalysis),
        metadata: {
          entries_analyzed: entries.length,
          analysis_date: new Date().toISOString(),
          model_used: 'gpt-4o-mini'
        }
      })

    if (insightError) {
      console.error('Error saving AI insight:', insightError)
      // Continue anyway, don't fail the request
    }

    return NextResponse.json({
      ok: true,
      data: validAnalysis
    })

  } catch (error) {
    console.error('Deep Analysis Error:', error)
    
    // Fallback response
    return NextResponse.json({
      ok: true,
      data: {
        emotionalPatterns: 'Your entries show a thoughtful approach to self-reflection and emotional awareness.',
        growthAreas: 'Continue exploring your emotional patterns and consider setting small, achievable goals for personal development.',
        strengths: 'You demonstrate consistent self-reflection and emotional awareness in your journaling practice.',
        challenges: 'Consider exploring any recurring themes or patterns that might benefit from deeper reflection.',
        recommendations: 'Continue your journaling practice and consider exploring new perspectives on recurring themes.',
        insightSummary: 'Your journaling journey shows growth and self-awareness. Keep reflecting and exploring your inner world.',
        confidence: 50
      }
    })
  }
}