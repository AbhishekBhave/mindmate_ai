import OpenAI from "openai";

// Create a singleton OpenAI client
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Export the client for reuse
export const openaiClient = client;

export async function summarizeText(content: string) {
  if (!client) {
    console.warn('OpenAI API key not configured. Returning fallback summary.');
    return { summary: "Summary unavailable - OpenAI API key not configured" };
  }

  try {
    const prompt = `
    Summarize the user's journal entry in 1–2 concise, empathetic sentences.
    Reflect the overall tone without giving advice.
    Text: """${content}"""
    `;
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const summary = response.choices[0].message?.content ?? "Summary unavailable";
    return { summary };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error("OpenAI error:", errorMessage);
    
    // Handle specific error types
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return { summary: "Summary unavailable - OpenAI quota exceeded. Please check your billing." };
    } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return { summary: "Summary unavailable - OpenAI API key invalid." };
    } else if (errorMessage.includes('rate limit')) {
      return { summary: "Summary unavailable - OpenAI rate limit exceeded. Please try again later." };
    }
    
    return { summary: "Summary unavailable" };
  }
}

// Sentiment analysis function using the shared client
export async function analyzeSentiment(text: string): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; confidence: number } | null> {
  if (!client) {
    console.warn('OpenAI API key not configured. Cannot analyze sentiment.');
    return null;
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis expert. Analyze the emotional tone of the journal entry and respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this journal entry's sentiment: "${text}" Respond with JSON: { "sentiment": "positive or negative or neutral", "confidence": 0-1, "reasoning": "brief explanation" }`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) return null;

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return null;
      }
    }

    const sentiment = parsed.sentiment?.toLowerCase() || 'neutral';
    const label: 'positive' | 'negative' | 'neutral' = 
      sentiment.includes('positive') ? 'positive' 
      : sentiment.includes('negative') ? 'negative' 
      : 'neutral';
    
    const confidence = typeof parsed.confidence === 'number' 
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.7;

    return { sentiment: label, confidence };
  } catch (error) {
    console.error('OpenAI sentiment error:', error);
    return null;
  }
}

// Comprehensive analysis function that generates insights, suggestions, patterns, and growthAreas
export interface ComprehensiveAnalysis {
  insights: string[]
  suggestions: string[]
  patterns: string[]
  growthAreas: string[]
}

export async function analyzeComprehensive(entryText: string): Promise<ComprehensiveAnalysis | null> {
  if (!client) {
    console.warn('OpenAI API key not configured. Cannot perform comprehensive analysis.');
    return null;
  }

  try {
    const prompt = `Analyze this journal entry and provide personalized, empathetic guidance. Reference specific details from the entry.

User Entry: "${entryText.trim()}"

Respond in JSON format ONLY:
{
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
- Keep suggestions actionable and specific`

    const completion = await client.chat.completions.create({
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

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      console.error('OpenAI returned empty response for comprehensive analysis')
      return null
    }

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse comprehensive analysis JSON:', parseError)
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0])
        } catch {
          return null
        }
      } else {
        return null
      }
    }

    // Validate and sanitize the response
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

    return {
      insights: validInsights,
      suggestions: validSuggestions,
      patterns: validPatterns,
      growthAreas: validGrowthAreas
    }
  } catch (error) {
    console.error('OpenAI comprehensive analysis error:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}
