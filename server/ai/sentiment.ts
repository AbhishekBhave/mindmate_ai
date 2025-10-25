import axios from 'axios'

interface HuggingFaceResponse {
  label: string
  score: number
}

export async function scoreSentiment(content: string): Promise<{ score: number; label: 'positive' | 'neutral' | 'negative' }> {
  // Try Hugging Face API first
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const response = await axios.post(
        'https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
        { inputs: content },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      )

      const data = response.data[0] as HuggingFaceResponse[]
      if (data && data.length > 0) {
        const result = data[0]
        const label = result.label.toLowerCase()
        
        // Map Hugging Face labels to our labels
        let mappedLabel: 'positive' | 'neutral' | 'negative'
        if (label.includes('positive') || label.includes('LABEL_2')) {
          mappedLabel = 'positive'
        } else if (label.includes('negative') || label.includes('LABEL_0')) {
          mappedLabel = 'negative'
        } else {
          mappedLabel = 'neutral'
        }

        return {
          score: result.score,
          label: mappedLabel
        }
      }
    } catch (err: unknown) {
      console.error('Hugging Face API error:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Fallback to rule-based sentiment analysis
  return fallbackSentimentAnalysis(content)
}

function fallbackSentimentAnalysis(content: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
  const positiveWords = [
    'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'loved',
    'good', 'better', 'best', 'excellent', 'perfect', 'beautiful', 'grateful', 'thankful',
    'blessed', 'lucky', 'success', 'achievement', 'accomplish', 'proud', 'confident', 'hopeful',
    'smile', 'laugh', 'enjoy', 'pleased', 'satisfied', 'content', 'peaceful', 'calm'
  ]
  
  const negativeWords = [
    'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stressed', 'tired',
    'exhausted', 'hurt', 'pain', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'bad',
    'terrible', 'awful', 'hate', 'hated', 'upset', 'mad', 'depressed', 'lonely', 'scared',
    'fear', 'afraid', 'worried', 'concerned', 'annoyed', 'irritated', 'furious', 'devastated'
  ]

  const words = content.toLowerCase().split(/\s+/)
  
  let positiveCount = 0
  let negativeCount = 0
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) {
      positiveCount++
    }
    if (negativeWords.some(nw => word.includes(nw))) {
      negativeCount++
    }
  })

  // Calculate sentiment score
  const totalWords = words.length
  const positiveRatio = positiveCount / totalWords
  const negativeRatio = negativeCount / totalWords

  if (positiveRatio > negativeRatio && positiveRatio > 0.05) {
    return { score: 0.7 + (positiveRatio * 0.3), label: 'positive' }
  } else if (negativeRatio > positiveRatio && negativeRatio > 0.05) {
    return { score: 0.3 - (negativeRatio * 0.3), label: 'negative' }
  } else {
    return { score: 0.5, label: 'neutral' }
  }
}
