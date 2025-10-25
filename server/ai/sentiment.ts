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
    const emotions = TextPreprocessor.extractEmotions(content)

    // Use OpenAI for sentiment analysis (more reliable)
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await this.analyzeWithOpenAI(content, emotions)
        if (result) {
          return result
        }
      } catch (error) {
        console.error('OpenAI sentiment analysis failed:', error)
      }
    }

    // Fallback to basic analysis
    const fallbackResult = this.fallbackSentimentAnalysis(content)
    return {
      finalScore: fallbackResult.score,
      finalLabel: fallbackResult.label,
      confidence: 0.3,
      emotions,
      modelResults: [fallbackResult]
    }
  }

  private static async analyzeWithOpenAI(content: string, emotions: string[]): Promise<EnsembleResult | null> {
    // Use the shared analyzeSentiment function from openai.ts
    try {
      const { analyzeSentiment } = await import('./openai')
      const result = await analyzeSentiment(content)
      
      if (!result) return null
      
      const { sentiment, confidence } = result
      
      return {
        finalScore: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? 0.2 : 0.5,
        finalLabel: sentiment,
        confidence,
        emotions,
        modelResults: [{
          score: sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? 0.2 : 0.5,
          label: sentiment,
          confidence,
          emotions,
          model: 'openai-gpt-4o-mini'
        }]
      }
    } catch (error: any) {
      // Log the error but don't fall back for quota errors anymore (user has credits now)
      console.error('OpenAI sentiment error:', error?.message || error)
      
      // Only fall back for non-quota errors
      if (error?.code !== 'insufficient_quota' && !error?.message?.includes('quota')) {
        console.warn('OpenAI API error, falling back to rule-based sentiment analysis')
        return this.ruleBasedSentiment(content, emotions)
      }
      
      // For quota errors, throw to surface the real issue
      throw error
    }
  }

  // Fallback rule-based sentiment when OpenAI fails
  private static ruleBasedSentiment(content: string, emotions: string[]): EnsembleResult {
    const positiveWords = ['great', 'amazing', 'wonderful', 'happy', 'joy', 'love', 'excited', 'grateful', 'blessed', 'fantastic', 'excellent', 'perfect', 'good', 'better', 'best', 'success', 'achieved', 'proud', 'pleased', 'delighted', 'thrilled', 'ecstatic', 'content', 'satisfied']
    const negativeWords = ['bad', 'terrible', 'horrible', 'awful', 'worst', 'hate', 'angry', 'frustrated', 'upset', 'sad', 'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed', 'hurt', 'pain', 'difficult', 'struggling', 'failing', 'disappointed', 'betrayed', 'lonely', 'empty', 'hopeless', 'guilty', 'ashamed']
    
    const lowerContent = content.toLowerCase()
    const positiveMatches = positiveWords.filter(word => lowerContent.includes(word)).length
    const negativeMatches = negativeWords.filter(word => lowerContent.includes(word)).length
    
    let label: 'positive' | 'neutral' | 'negative' = 'neutral'
    let score = 0.5
    
    if (positiveMatches > negativeMatches && positiveMatches >= 2) {
      label = 'positive'
      score = 0.6 + (Math.min(positiveMatches / 10, 0.3))
    } else if (negativeMatches > positiveMatches && negativeMatches >= 2) {
      label = 'negative'
      score = 0.4 - (Math.min(negativeMatches / 10, 0.3))
    } else if (positiveMatches > 0) {
      label = 'positive'
      score = 0.55
    } else if (negativeMatches > 0) {
      label = 'negative'
      score = 0.45
    }
    
    return {
      finalScore: score,
      finalLabel: label,
      confidence: 0.6, // Lower confidence for rule-based
      emotions,
      modelResults: [{
        score,
        label,
        confidence: 0.6,
        emotions,
        model: 'rule-based-fallback'
      }]
    }
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

      // Handle different response shapes: array of arrays or array of objects
      let data: HuggingFaceResponse[] = []
      
      if (Array.isArray(response.data)) {
        if (response.data.length > 0 && Array.isArray(response.data[0])) {
          // Flatten nested arrays: [[{label, score}, {label, score}], ...]
          data = response.data.flat()
        } else if (response.data[0] && typeof response.data[0] === 'object') {
          // Already array of objects: [{label, score}, {label, score}]
          data = response.data as HuggingFaceResponse[]
        }
      }

      if (data && data.length > 0) {
        // Find the result with highest score
        const sortedData = [...data].sort((a, b) => {
          const scoreA = typeof a.score === 'number' ? a.score : 0
          const scoreB = typeof b.score === 'number' ? b.score : 0
          return scoreB - scoreA
        })
        
        const topResult = sortedData[0]
        const mappedLabel = this.mapLabel(topResult.label, model.name)
        
        // Parse and validate score
        let score = 0.5
        let confidence = 0.5
        
        if (typeof topResult.score === 'number') {
          score = Math.max(0, Math.min(1, topResult.score))
          confidence = score
        } else if (typeof topResult.score === 'string') {
          const parsed = Number.parseFloat(topResult.score)
          if (!isNaN(parsed)) {
            score = Math.max(0, Math.min(1, parsed))
            confidence = score
          }
        }
        
        return {
          score,
          label: mappedLabel,
          confidence,
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
      
      // Validate and clamp scores
      const validScore = typeof result.score === 'number' && !isNaN(result.score)
        ? Math.max(0, Math.min(1, result.score))
        : 0.5
      
      const validConfidence = typeof result.confidence === 'number' && !isNaN(result.confidence)
        ? Math.max(0, Math.min(1, result.confidence))
        : 0.5
      
      weightedScore += validScore * weight
      totalWeight += weight
      confidenceSum += validConfidence
      labelVotes[result.label] += weight
    }

    // Calculate final score and confidence, guard against division by zero
    const finalScore = totalWeight > 0 
      ? Math.max(0, Math.min(1, weightedScore / totalWeight))
      : 0.5
    
    const averageConfidence = results.length > 0 
      ? Math.max(0, Math.min(1, confidenceSum / results.length))
      : 0.5

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