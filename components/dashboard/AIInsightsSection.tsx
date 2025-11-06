'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Brain, Sparkles, Lightbulb, TrendingUp, BookOpen, Smile, Meh, Frown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Entry {
  id: string
  content: string
  created_at: string
  sentiment?: {
    score: number
    label: string
    summary?: string
    ai_feedback?: string
    comprehensive_analysis?: {
      insights?: string[]
      suggestions?: string[]
      patterns?: string[]
      growthAreas?: string[]
    } | null
  }
}

interface AIInsightsSectionProps {
  entries: Entry[]
  lastAnalysis?: {
    sentiment: string
    confidence: number
    suggestion: string
    emotions: string[]
    insights: string[]
    suggestions: string[]
    patterns: string[]
    growthAreas: string[]
  } | null
}

export function AIInsightsSection({ entries, lastAnalysis }: AIInsightsSectionProps) {
  // Prioritize lastAnalysis (from dashboard state), then check entry's comprehensive_analysis, then fall back to basic analysis
  const displayAnalysis = lastAnalysis || getBasicAnalysis(entries[0])

  function getBasicAnalysis(entry: Entry | undefined) {
    if (!entry?.sentiment) {
      return {
        sentiment: 'neutral',
        confidence: 0,
        suggestion: 'Welcome! Start your journaling journey by writing your first entry. 🚀',
        emotions: ['Neutral'],
        insights: ['Your entry shows emotional awareness and self-reflection skills.'],
        suggestions: ['Consider reflecting on what brought you to write this entry today.'],
        patterns: ['Clear emotional expression with good self-awareness'],
        growthAreas: ['Regular reflection practice to build emotional intelligence']
      }
    }

    // Check if entry has comprehensive_analysis - use it if available
    const comprehensiveAnalysis = entry.sentiment.comprehensive_analysis
    if (comprehensiveAnalysis) {
      const aiFeedback = entry.sentiment.ai_feedback || entry.sentiment.summary || 'Ready for today\'s reflection? I\'m here to listen.'
      const confidenceValue = typeof entry.sentiment.score === 'number' 
        ? Math.max(0, Math.min(100, entry.sentiment.score * 100))
        : 50
      
      return {
        sentiment: entry.sentiment.label || 'neutral',
        confidence: confidenceValue,
        suggestion: aiFeedback,
        emotions: ['Reflective'], // Will be populated from sentiment if available
        insights: comprehensiveAnalysis.insights && comprehensiveAnalysis.insights.length > 0
          ? comprehensiveAnalysis.insights
          : ['Your entry shows emotional awareness and self-reflection skills.'],
        suggestions: comprehensiveAnalysis.suggestions && comprehensiveAnalysis.suggestions.length > 0
          ? comprehensiveAnalysis.suggestions
          : ['Consider reflecting on what brought you to write this entry today.'],
        patterns: comprehensiveAnalysis.patterns && comprehensiveAnalysis.patterns.length > 0
          ? comprehensiveAnalysis.patterns
          : ['Clear emotional expression with good self-awareness'],
        growthAreas: comprehensiveAnalysis.growthAreas && comprehensiveAnalysis.growthAreas.length > 0
          ? comprehensiveAnalysis.growthAreas
          : ['Regular reflection practice to build emotional intelligence']
      }
    }

    const confidenceValue = typeof entry.sentiment.score === 'number' 
      ? Math.max(0, Math.min(100, entry.sentiment.score * 100))
      : 50

    // Detect emotions (simplified)
    const content = entry.content.toLowerCase()
    const detectedEmotions: string[] = []
    if (content.includes('happy') || content.includes('great') || content.includes('excited')) detectedEmotions.push('Joy')
    if (content.includes('sad') || content.includes('down') || content.includes('unhappy')) detectedEmotions.push('Sadness')
    if (content.includes('anxious') || content.includes('worried') || content.includes('nervous')) detectedEmotions.push('Anxiety')
    if (content.includes('grateful') || content.includes('thankful') || content.includes('appreciate')) detectedEmotions.push('Gratitude')
    if (content.includes('angry') || content.includes('frustrated') || content.includes('upset')) detectedEmotions.push('Frustration')
    if (content.includes('calm') || content.includes('peaceful') || content.includes('relaxed')) detectedEmotions.push('Calm')
    
    const emotions = detectedEmotions.length > 0 ? detectedEmotions : ['Reflective']

    // Generate contextual suggestions based on entry content
    const generateSuggestions = () => {
      const suggestions: string[] = []
      
      // Detect themes and generate relevant suggestions
      if (content.includes('work') || content.includes('job') || content.includes('boss')) {
        suggestions.push('Work stress is valid. Consider setting boundaries to protect your personal time.')
      }
      
      if (content.includes('friend') || content.includes('friends') || content.includes('social')) {
        suggestions.push('Nurture your relationships by expressing appreciation for the people who support you.')
      }
      
      if (content.includes('sleep') || content.includes('tired') || content.includes('exhausted')) {
        suggestions.push('Prioritize rest - quality sleep is essential for emotional well-being.')
      }
      
      if (content.includes('anxious') || content.includes('worried') || content.includes('stressed')) {
        suggestions.push('Try a 5-minute breathing exercise: inhale for 4 counts, hold for 4, exhale for 4.')
      }
      
      if (content.includes('sad') || content.includes('hurt') || content.includes('disappointed')) {
        suggestions.push('It\'s okay to feel this way. Consider writing about what specifically triggered these feelings.')
      }
      
      if (content.includes('grateful') || content.includes('thankful') || content.includes('blessed')) {
        suggestions.push('Keep this gratitude practice going - it builds resilience and positive emotions.')
      }
      
      if (content.includes('goal') || content.includes('plan') || content.includes('future')) {
        suggestions.push('Break your goals into smaller, achievable steps to maintain momentum.')
      }
      
      if (content.includes('family') || content.includes('parent') || content.includes('sibling')) {
        suggestions.push('Family relationships can be complex. Reflect on what boundaries might serve you.')
      }
      
      if (content.includes('exercise') || content.includes('workout') || content.includes('physical')) {
        suggestions.push('Physical activity releases endorphins. Aim to move your body in ways that bring you joy.')
      }
      
      if (content.includes('overwhelmed') || content.includes('burnout') || content.includes('too much')) {
        suggestions.push('When feeling overwhelmed, try the "2-minute rule" - tackle just one small task to regain momentum.')
      }

      // Add general suggestions if not enough contextual ones found
      if (suggestions.length < 3 && entry.sentiment) {
        if (entry.sentiment.label === 'positive') {
          suggestions.push('Journal about what specifically contributed to this positive feeling today.')
          suggestions.push('Consider how you can create more moments like this in your daily routine.')
          if (suggestions.length < 3) {
            suggestions.push('Practice gratitude for the small joys in your life.')
          }
        } else if (entry.sentiment.label === 'negative') {
          suggestions.push('Try to identify one small action you can take today to improve your emotional state.')
          suggestions.push('Remember, tough feelings are temporary. What self-care activity might help right now?')
          if (suggestions.length < 3) {
            suggestions.push('Consider reaching out to someone you trust for support.')
          }
        } else {
          suggestions.push('Reflect on what\'s on your mind today and what you need most in this moment.')
          suggestions.push('Consider what activities or practices help you feel grounded and centered.')
          if (suggestions.length < 3) {
            suggestions.push('Take time to check in with yourself - what are you feeling right now?')
          }
        }
      }
      
      // Fallback suggestions if still not enough
      if (suggestions.length === 0) {
        suggestions.push('Reflect on what brought you to write this entry today.')
        suggestions.push('Consider how you can maintain or improve your current emotional state.')
        suggestions.push('Practice gratitude for the positive aspects of your day.')
      }

      return suggestions.slice(0, 4) // Ensure we return 3-4 suggestions
    }

    // Set message based on sentiment with content awareness
    let suggestion = 'Ready for today\'s reflection? I\'m here to listen. ✨'
    if (entry.sentiment?.label === 'positive') {
      if (content.includes('accomplish') || content.includes('success') || content.includes('proud')) {
        suggestion = 'Celebrate your achievements! Take a moment to acknowledge how you got here. 🌟'
      } else if (content.includes('grateful') || content.includes('thankful')) {
        suggestion = 'Your gratitude practice is powerful. Keep nurturing this positive mindset! 🌟'
      } else {
        suggestion = 'Amazing progress! Your positive energy is inspiring! 🌟 Keep nurturing that inner light.'
      }
    } else if (entry.sentiment?.label === 'negative') {
      if (content.includes('anxious') || content.includes('worried')) {
        suggestion = 'Anxiety is understandable. Try deep breathing - you have the tools to navigate this. 💜'
      } else if (content.includes('sad') || content.includes('hurt')) {
        suggestion = 'I hear you, and these feelings matter. Self-compassion goes a long way. 💜'
      } else if (content.includes('angry') || content.includes('frustrated')) {
        suggestion = 'Anger often signals a need. What boundary or action might help address this? 💜'
      } else {
        suggestion = 'I hear you, and it\'s okay to feel this way. Try taking 5 deep breaths. You\'re doing your best. 💜'
      }
    } else {
      if (content.includes('reflect') || content.includes('think') || content.includes('consider')) {
        suggestion = 'Your reflective mind is working. What deeper understanding is emerging? ✨'
      } else {
        suggestion = 'Ready for today\'s reflection? I\'m here to listen. ✨'
      }
    }

    return {
      sentiment: entry.sentiment.label || 'neutral',
      confidence: confidenceValue,
      suggestion,
      emotions,
      insights: [
        `Your entry reflects a ${entry.sentiment.label || 'neutral'} emotional state with clear patterns.`,
        'This type of reflection shows emotional awareness and self-reflection skills.',
        'Consider how these feelings might be connected to recent events or ongoing situations in your life.'
      ],
      suggestions: generateSuggestions(),
      patterns: detectedEmotions.length > 0 
        ? [`Clear expression of ${detectedEmotions.join(', ')} emotions`]
        : ['Clear emotional expression with good self-awareness'],
      growthAreas: entry.sentiment?.label === 'positive'
        ? ['Continue building on this momentum with regular reflection']
        : ['Regular reflection practice to build emotional intelligence']
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500'
      case 'negative': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-[0_0_40px_rgba(183,148,246,0.4)] hover:shadow-[0_0_50px_rgba(183,148,246,0.5)] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-4"
        >
          <Brain className="h-8 w-8 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Guidance & Insights
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center">
              <span className="text-2xl mr-2">{getSentimentIcon(displayAnalysis.sentiment)}</span>
              <span className={`font-semibold capitalize ${getSentimentColor(displayAnalysis.sentiment)}`}>
                {displayAnalysis.sentiment} Mood
              </span>
            </span>
            {typeof displayAnalysis.confidence === 'number' && !isNaN(displayAnalysis.confidence) && displayAnalysis.confidence > 0 && (
              <span>{displayAnalysis.confidence.toFixed(0)}% confidence</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Suggestion */}
      <div className="mb-6">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-purple-800 dark:text-purple-200 font-medium text-lg">
            {displayAnalysis.suggestion}
          </p>
        </div>
      </div>

      {/* Comprehensive Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detected Emotion Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Brain className="h-5 w-5 text-purple-500 mr-2" />
            Detected Emotion
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="text-sm px-3 py-1"
                style={{
                  backgroundColor: displayAnalysis.sentiment === 'positive' ? '#10B98120' : displayAnalysis.sentiment === 'negative' ? '#EF444420' : '#F59E0B20',
                  color: displayAnalysis.sentiment === 'positive' ? '#10B981' : displayAnalysis.sentiment === 'negative' ? '#EF4444' : '#F59E0B',
                  borderColor: displayAnalysis.sentiment === 'positive' ? '#10B981' : displayAnalysis.sentiment === 'negative' ? '#EF4444' : '#F59E0B'
                }}
              >
                <div className="flex items-center gap-1">
                  {displayAnalysis.sentiment === 'positive' && <Smile className="h-4 w-4" />}
                  {displayAnalysis.sentiment === 'negative' && <Frown className="h-4 w-4" />}
                  {displayAnalysis.sentiment === 'neutral' && <Meh className="h-4 w-4" />}
                  <span className="capitalize font-semibold">{displayAnalysis.sentiment}</span>
                </div>
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {typeof displayAnalysis.confidence === 'number' && !isNaN(displayAnalysis.confidence) && displayAnalysis.confidence > 0
                  ? (displayAnalysis.confidence).toFixed(0) + '%'
                  : '--%'
                } confidence
              </span>
            </div>
            {displayAnalysis.suggestion && (
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                "{displayAnalysis.suggestion}"
              </p>
            )}
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
            Key Insights
          </h3>
          <div className="space-y-2">
            {displayAnalysis.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-2"
              >
                <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Personalized Suggestions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
            Personalized Suggestions
          </h3>
          <div className="space-y-2">
            {displayAnalysis.suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-2"
              >
                <span className="text-green-500 mt-1 text-lg">•</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Growth Opportunities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <BookOpen className="h-5 w-5 text-green-500 mr-2" />
            Growth Opportunities
          </h3>
          <div className="space-y-2">
            {displayAnalysis.growthAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-600 dark:text-gray-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20"
              >
                {area}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Patterns Section */}
      {displayAnalysis.patterns && displayAnalysis.patterns.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            Patterns Noticed
          </h3>
          <div className="space-y-2">
            {displayAnalysis.patterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-gray-600 dark:text-gray-400 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20"
              >
                {pattern}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}