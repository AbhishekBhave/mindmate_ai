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
