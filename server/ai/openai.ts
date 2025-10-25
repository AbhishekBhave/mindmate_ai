import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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
