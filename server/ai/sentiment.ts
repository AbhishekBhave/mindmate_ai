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
        'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
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
        if (label.includes('positive')) {
          mappedLabel = 'positive'
        } else if (label.includes('negative')) {
          mappedLabel = 'negative'
        } else {
          mappedLabel = 'neutral'
        }

        return {
          score: result.score,
          label: mappedLabel
        }
      }
    } catch (error) {
      console.error('Hugging Face API error:', error)
    }
  }

  // Fallback to rule-based sentiment analysis
  return fallbackSentimentAnalysis(content)
}

function fallbackSentimentAnalysis(content: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
  const positiveWords = [
    'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'loved',
    'good', 'better', 'best', 'excellent', 'perfect', 'beautiful', 'grateful', 'thankful',
    'blessed', 'lucky', 'success', 'achievement', 'accomplish', 'proud', 'confident', 'hopeful'
  ]
  
  const negativeWords = [
    'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stressed', 'tired',
    'exhausted', 'hurt', 'pain', 'difficult', 'hard', 'struggle', 'problem', 'issue', 'bad',
    'terrible', 'awful', 'hate', 'hated', 'upset', 'mad', 'depressed', 'lonely', 'scared'
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

  if (positiveCount > negativeCount) {
    return { score: 0.7, label: 'positive' }
  } else if (negativeCount > positiveCount) {
    return { score: 0.3, label: 'negative' }
  } else {
    return { score: 0.5, label: 'neutral' }
  }
}
