'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Smile, Frown, Meh, Brain, Sparkles, TrendingUp, Heart, Lightbulb, Target, BookOpen } from 'lucide-react'

interface DetailedAnalysisProps {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  insights: string[]
  emotions: string[]
  suggestions: string[]
  patterns: string[]
  growthAreas: string[]
}

export function DetailedAnalysis({ sentiment, confidence, insights, emotions, suggestions, patterns, growthAreas }: DetailedAnalysisProps) {
  const sentimentIcons = {
    positive: <Smile className="h-8 w-8 text-green-500" />,
    negative: <Frown className="h-8 w-8 text-red-500" />,
    neutral: <Meh className="h-8 w-8 text-yellow-500" />
  }

  const sentimentColors = {
    positive: 'from-green-400 to-emerald-500',
    negative: 'from-red-400 to-rose-500',
    neutral: 'from-yellow-400 to-amber-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {sentimentIcons[sentiment]}
        </motion.div>
        <div className="ml-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {sentiment} Emotional State
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {confidence}% confidence • AI Analysis Complete
          </div>
        </div>
      </div>

      {/* Main Insights */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          Key Insights
        </h3>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 dark:text-gray-300">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Emotions Detected */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Heart className="h-5 w-5 text-red-500 mr-2" />
          Emotions Detected
        </h3>
        <div className="flex flex-wrap gap-2">
          {emotions.map((emotion, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="px-3 py-1 bg-red-500/20 text-red-800 dark:text-red-200 text-sm rounded-full border border-red-500/30"
            >
              {emotion}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Actionable Suggestions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          Personalized Suggestions
        </h3>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3"
            >
              <Target className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Patterns & Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            Patterns Noticed
          </h3>
          <div className="space-y-2">
            {patterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-600 dark:text-gray-400 bg-blue-500/10 p-2 rounded-lg"
              >
                {pattern}
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <BookOpen className="h-5 w-5 text-green-500 mr-2" />
            Growth Opportunities
          </h3>
          <div className="space-y-2">
            {growthAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-600 dark:text-gray-400 bg-green-500/10 p-2 rounded-lg"
              >
                {area}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface DashboardAnalyzerProps {
  onAnalysisComplete?: (analysis: DetailedAnalysisProps) => void
}

export function DashboardAnalyzer({ onAnalysisComplete }: DashboardAnalyzerProps) {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<DetailedAnalysisProps | null>(null)

  const analyzeText = async (inputText: string) => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/analyze-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryText: inputText
        }),
      })

      const data = await response.json()
      
      if (data.ok) {
        // Enhanced analysis with more descriptive feedback
        const enhancedAnalysis = await generateEnhancedAnalysis(inputText, data.data)
        setAnalysis(enhancedAnalysis)
        onAnalysisComplete?.(enhancedAnalysis)
      } else {
        // Fallback to mock analysis
        const mockAnalysis = generateMockAnalysis(inputText)
        setAnalysis(mockAnalysis)
        onAnalysisComplete?.(mockAnalysis)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      // Fallback to mock analysis
      const mockAnalysis = generateMockAnalysis(inputText)
      setAnalysis(mockAnalysis)
      onAnalysisComplete?.(mockAnalysis)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateEnhancedAnalysis = async (inputText: string, basicAnalysis: any) => {
    // This would call a more advanced AI model for detailed analysis
    // For now, we'll enhance the basic analysis with more descriptive content
    
    const emotions = detectEmotions(inputText)
    const suggestions = generateSuggestions(basicAnalysis.sentiment, inputText)
    const patterns = detectPatterns(inputText)
    const growthAreas = identifyGrowthAreas(basicAnalysis.sentiment, inputText)
    
    return {
      sentiment: basicAnalysis.sentiment,
      confidence: basicAnalysis.confidence,
      insights: [
        basicAnalysis.suggestion,
        `Your entry shows ${basicAnalysis.sentiment} emotional patterns that are worth exploring further.`,
        `The confidence level of ${basicAnalysis.confidence}% indicates ${basicAnalysis.confidence > 80 ? 'strong' : 'moderate'} emotional clarity in your expression.`
      ],
      emotions,
      suggestions,
      patterns,
      growthAreas
    }
  }

  const generateMockAnalysis = (inputText: string): DetailedAnalysisProps => {
    const emotions = detectEmotions(inputText)
    const sentiment = determineSentiment(inputText)
    const suggestions = generateSuggestions(sentiment, inputText)
    const patterns = detectPatterns(inputText)
    const growthAreas = identifyGrowthAreas(sentiment, inputText)
    
    return {
      sentiment,
      confidence: 85,
      insights: [
        `Your entry reflects a ${sentiment} emotional state with clear patterns of ${emotions.slice(0, 2).join(' and ')}.`,
        `This type of reflection shows emotional awareness and self-reflection skills.`,
        `Consider how these feelings might be connected to recent events or ongoing situations in your life.`
      ],
      emotions,
      suggestions,
      patterns,
      growthAreas
    }
  }

  const detectEmotions = (text: string): string[] => {
    const emotions: string[] = []
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('excited')) emotions.push('Joy')
    if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('depressed')) emotions.push('Sadness')
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous')) emotions.push('Anxiety')
    if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('upset')) emotions.push('Anger')
    if (lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('appreciate')) emotions.push('Gratitude')
    if (lowerText.includes('calm') || lowerText.includes('peaceful') || lowerText.includes('relaxed')) emotions.push('Calm')
    if (lowerText.includes('confused') || lowerText.includes('uncertain') || lowerText.includes('lost')) emotions.push('Confusion')
    if (lowerText.includes('proud') || lowerText.includes('accomplished') || lowerText.includes('achieved')) emotions.push('Pride')
    
    return emotions.length > 0 ? emotions : ['Reflective']
  }

  const determineSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const lowerText = text.toLowerCase()
    const positiveWords = ['great', 'good', 'happy', 'excited', 'amazing', 'wonderful', 'fantastic', 'love', 'enjoy']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'sad', 'depressed', 'worried', 'anxious']
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  const generateSuggestions = (sentiment: string, text: string): string[] => {
    const suggestions: string[] = []
    
    if (sentiment === 'positive') {
      suggestions.push(
        "Consider journaling about what specifically contributed to these positive feelings",
        "Think about how you can maintain this positive energy throughout your week",
        "Share your positive experience with someone who might benefit from hearing it"
      )
    } else if (sentiment === 'negative') {
      suggestions.push(
        "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste",
        "Consider what specific aspects of the situation you can control or influence",
        "Practice self-compassion - remind yourself that difficult feelings are temporary and valid"
      )
    } else {
      suggestions.push(
        "Explore what might be underlying these neutral feelings - sometimes calmness masks deeper emotions",
        "Consider what activities or people typically bring you joy and how you might incorporate more of them",
        "Reflect on whether you're feeling content or if there's something you're avoiding thinking about"
      )
    }
    
    return suggestions
  }

  const detectPatterns = (text: string): string[] => {
    const patterns: string[] = []
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('always') || lowerText.includes('never') || lowerText.includes('every time')) {
      patterns.push("Use of absolute language suggests strong emotional reactions")
    }
    if (lowerText.includes('should') || lowerText.includes('must') || lowerText.includes('have to')) {
      patterns.push("High expectations or pressure language detected")
    }
    if (lowerText.includes('but') || lowerText.includes('however') || lowerText.includes('although')) {
      patterns.push("Mixed or contradictory feelings expressed")
    }
    if (lowerText.includes('i feel') || lowerText.includes('i think') || lowerText.includes('i believe')) {
      patterns.push("Strong self-awareness and emotional vocabulary")
    }
    
    return patterns.length > 0 ? patterns : ["Clear emotional expression with good self-awareness"]
  }

  const identifyGrowthAreas = (sentiment: string, text: string): string[] => {
    const growthAreas: string[] = []
    
    if (sentiment === 'negative') {
      growthAreas.push("Developing coping strategies for difficult emotions")
      growthAreas.push("Building resilience through challenging experiences")
    } else if (sentiment === 'positive') {
      growthAreas.push("Maintaining positive momentum and energy")
      growthAreas.push("Sharing positive experiences to strengthen relationships")
    } else {
      growthAreas.push("Exploring deeper emotional awareness")
      growthAreas.push("Identifying sources of fulfillment and joy")
    }
    
    growthAreas.push("Regular reflection practice to build emotional intelligence")
    growthAreas.push("Developing mindfulness and present-moment awareness")
    
    return growthAreas
  }

  const handleSubmit = () => {
    if (text.trim()) {
      analyzeText(text)
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Deep AI Analysis
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Get comprehensive insights into your emotional patterns, growth opportunities, and personalized guidance.
        </p>
      </div>

      {/* Text input */}
      <div className="mb-6">
        <Textarea
          placeholder="Describe your thoughts, feelings, or experiences for detailed AI analysis..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] backdrop-blur-xl bg-white/5 border-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
        />
      </div>

      {/* Submit button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mb-6"
      >
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-black text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mr-2"
              >
                <Brain className="h-4 w-4" />
              </motion.div>
              Analyzing Deeply...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Get Detailed Analysis
            </>
          )}
        </Button>
      </motion.div>

      {/* Analysis Results */}
      {analysis && (
        <DetailedAnalysis {...analysis} />
      )}
    </div>
  )
}
