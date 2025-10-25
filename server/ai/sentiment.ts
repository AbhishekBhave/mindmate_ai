import axios from 'axios'

interface HuggingFaceResponse {
  label: string
  score: number
}

interface SentimentResult {
  score: number
  label: 'positive' | 'neutral' | 'negative'
  confidence: number
  emotions?: string[]
  model: string
}

interface EnsembleResult {
  finalScore: number
  finalLabel: 'positive' | 'neutral' | 'negative'
  confidence: number
  emotions: string[]
  modelResults: SentimentResult[]
}

// Text preprocessing utilities
export class TextPreprocessor {
  private static stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its',
    'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'this', 'these',
    'those', 'my', 'your', 'our', 'their', 'me', 'him', 'her', 'us', 'them', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'shall'
  ])

  static preprocess(text: string): string {
    // Normalize punctuation and whitespace
    let processed = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Remove stop words
    const words = processed.split(' ')
    const filteredWords = words.filter(word => 
      word.length > 2 && !this.stopWords.has(word)
    )

    return filteredWords.join(' ')
  }

  static splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10) // Filter out very short sentences
  }

  static extractEmotions(text: string): string[] {
    const emotionKeywords = {
      'joy': ['happy', 'joyful', 'excited', 'elated', 'thrilled', 'ecstatic', 'cheerful', 'delighted'],
      'sadness': ['sad', 'depressed', 'melancholy', 'gloomy', 'down', 'blue', 'sorrowful', 'mournful'],
      'anger': ['angry', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated', 'livid'],
      'fear': ['afraid', 'scared', 'terrified', 'anxious', 'worried', 'nervous', 'frightened', 'alarmed'],
      'surprise': ['surprised', 'shocked', 'amazed', 'astonished', 'startled', 'bewildered', 'stunned'],
      'disgust': ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'horrified'],
      'love': ['love', 'adore', 'cherish', 'treasure', 'fond', 'affectionate', 'devoted', 'passionate'],
      'gratitude': ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'indebted']
    }

    const emotions: string[] = []
    const lowerText = text.toLowerCase()

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        emotions.push(emotion)
      }
    }

    return emotions
  }
}

// Enhanced sentiment analysis with multiple models
export class EnhancedSentimentAnalyzer {
  private static readonly MODELS = [
    {
      name: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      url: 'https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      weight: 0.4
    },
    {
      name: 'j-hartmann/emotion-english-distilroberta-base',
      url: 'https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base',
      weight: 0.3
    },
    {
      name: 'distilbert-base-uncased-finetuned-sst-2-english',
      url: 'https://router.huggingface.co/hf-inference/models/distilbert-base-uncased-finetuned-sst-2-english',
      weight: 0.3
    }
  ]

  static async analyzeSentiment(content: string): Promise<EnsembleResult> {
    const preprocessedText = TextPreprocessor.preprocess(content)
    const sentences = TextPreprocessor.splitIntoSentences(content)
    const emotions = TextPreprocessor.extractEmotions(content)

    // Analyze with multiple models
    const modelResults: SentimentResult[] = []
    
    for (const model of this.MODELS) {
      try {
        const result = await this.analyzeWithModel(preprocessedText, model)
        if (result) {
          modelResults.push(result)
        }
      } catch (error) {
        console.error(`Model ${model.name} failed:`, error)
        // Continue with other models
      }
    }

    // If all models fail, use fallback
    if (modelResults.length === 0) {
      const fallbackResult = this.fallbackSentimentAnalysis(content)
      return {
        finalScore: fallbackResult.score,
        finalLabel: fallbackResult.label,
        confidence: 0.3, // Low confidence for fallback
        emotions,
        modelResults: [fallbackResult]
      }
    }

    // Calculate ensemble result
    return this.calculateEnsembleResult(modelResults, emotions)
  }

  private static async analyzeWithModel(
    text: string, 
    model: { name: string; url: string; weight: number }
  ): Promise<SentimentResult | null> {
    if (!process.env.HUGGINGFACE_API_KEY) {
      return null
    }

    try {
      const response = await axios.post(
        model.url,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )

      const data = response.data[0] as HuggingFaceResponse[]
      if (data && data.length > 0) {
        const result = data[0]
        const mappedLabel = this.mapLabel(result.label, model.name)
        
        return {
          score: result.score,
          label: mappedLabel,
          confidence: result.score,
          emotions: [],
          model: model.name
        }
      }
    } catch (error) {
      console.error(`Error with model ${model.name}:`, error)
    }

    return null
  }

  private static mapLabel(label: string, modelName: string): 'positive' | 'neutral' | 'negative' {
    const lowerLabel = label.toLowerCase()
    
    // Handle different model output formats
    if (modelName.includes('emotion')) {
      // Emotion model outputs
      if (lowerLabel.includes('joy') || lowerLabel.includes('love')) return 'positive'
      if (lowerLabel.includes('anger') || lowerLabel.includes('sadness') || lowerLabel.includes('fear')) return 'negative'
      return 'neutral'
    }
    
    // Standard sentiment models
    if (lowerLabel.includes('positive') || lowerLabel.includes('label_2')) return 'positive'
    if (lowerLabel.includes('negative') || lowerLabel.includes('label_0')) return 'negative'
    return 'neutral'
  }

  private static calculateEnsembleResult(
    results: SentimentResult[], 
    emotions: string[]
  ): EnsembleResult {
    // Weighted average of scores
    let weightedScore = 0
    let totalWeight = 0
    let confidenceSum = 0

    const labelVotes: { [key: string]: number } = { positive: 0, neutral: 0, negative: 0 }

    for (const result of results) {
      const weight = this.getModelWeight(result.model)
      weightedScore += result.score * weight
      totalWeight += weight
      confidenceSum += result.confidence
      labelVotes[result.label] += weight
    }

    const finalScore = weightedScore / totalWeight
    const averageConfidence = confidenceSum / results.length

    // Determine final label by weighted voting
    const finalLabel = Object.entries(labelVotes)
      .sort(([,a], [,b]) => b - a)[0][0] as 'positive' | 'neutral' | 'negative'

    return {
      finalScore,
      finalLabel,
      confidence: Math.min(averageConfidence, 0.95), // Cap confidence at 95%
      emotions,
      modelResults: results
    }
  }

  private static getModelWeight(modelName: string): number {
    const model = this.MODELS.find(m => m.name === modelName)
    return model?.weight || 0.33 // Default equal weight
  }

  private static fallbackSentimentAnalysis(content: string): SentimentResult {
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

    let score: number
    let label: 'positive' | 'neutral' | 'negative'

    if (positiveRatio > negativeRatio && positiveRatio > 0.05) {
      score = 0.7 + (positiveRatio * 0.3)
      label = 'positive'
    } else if (negativeRatio > positiveRatio && negativeRatio > 0.05) {
      score = 0.3 - (negativeRatio * 0.3)
      label = 'negative'
    } else {
      score = 0.5
      label = 'neutral'
    }

    return {
      score,
      label,
      confidence: 0.3, // Low confidence for fallback
      emotions: TextPreprocessor.extractEmotions(content),
      model: 'fallback'
    }
  }
}

// Legacy function for backward compatibility
export async function scoreSentiment(content: string): Promise<{ score: number; label: 'positive' | 'neutral' | 'negative' }> {
  const result = await EnhancedSentimentAnalyzer.analyzeSentiment(content)
  return {
    score: result.finalScore,
    label: result.finalLabel
  }
}

// New enhanced function
export async function analyzeSentimentEnhanced(content: string): Promise<EnsembleResult> {
  return EnhancedSentimentAnalyzer.analyzeSentiment(content)
}