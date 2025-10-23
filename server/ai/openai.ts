import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export async function summarizeText(content: string): Promise<{ summary: string; suggestions: string[] }> {
  if (!openai) {
    return {
      summary: "Summary unavailable - OpenAI API key not configured",
      suggestions: ["Take time to reflect on your feelings today", "Consider what brought you joy or peace"]
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a gentle, supportive AI assistant that helps users reflect on their journal entries. Provide a brief summary (1-2 sentences) and 2-3 gentle, encouraging suggestions for self-reflection. Keep responses warm and non-judgmental."
        },
        {
          role: "user",
          content: `Please summarize this journal entry and provide gentle reflection suggestions:\n\n${content}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || ""
    
    // Parse the response to extract summary and suggestions
    const lines = response.split('\n').filter(line => line.trim())
    const summary = lines[0] || "Summary unavailable"
    const suggestions = lines.slice(1).map(line => line.replace(/^[-•]\s*/, '').trim()).filter(s => s.length > 0)
    
    return {
      summary,
      suggestions: suggestions.length > 0 ? suggestions : ["Take time to reflect on your feelings today", "Consider what brought you joy or peace"]
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      summary: "Summary unavailable",
      suggestions: ["Take time to reflect on your feelings today", "Consider what brought you joy or peace"]
    }
  }
}
