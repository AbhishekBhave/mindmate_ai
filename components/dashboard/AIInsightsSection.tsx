'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Brain, Sparkles, Heart, Lightbulb, TrendingUp, BookOpen } from 'lucide-react'

interface Entry {
  id: string
  content: string
  created_at: string
  sentiment?: {
    score: number
    label: string
    summary?: string
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
  // Use comprehensive analysis if available, otherwise fall back to basic sentiment
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

    // Set message based on sentiment
    let suggestion = 'Ready for today\'s reflection? I\'m here to listen. ✨'
    if (entry.sentiment.label === 'positive') {
      suggestion = 'Amazing progress! Your positive energy is inspiring! 🌟 Keep nurturing that inner light.'
    } else if (entry.sentiment.label === 'negative') {
      suggestion = 'I hear you, and it\'s okay to feel this way. 💜 Try taking 5 deep breaths. You\'re doing your best.'
    }

    return {
      sentiment: entry.sentiment.label,
      confidence: confidenceValue,
      suggestion,
      emotions,
      insights: [
        `Your entry reflects a ${entry.sentiment.label} emotional state with clear patterns.`,
        'This type of reflection shows emotional awareness and self-reflection skills.',
        'Consider how these feelings might be connected to recent events or ongoing situations in your life.'
      ],
      suggestions: [
        'Consider reflecting on what brought you to write this entry today.',
        'Think about how you can maintain or improve your current emotional state.',
        'Practice gratitude for the positive aspects of your day.'
      ],
      patterns: ['Clear emotional expression with good self-awareness'],
      growthAreas: ['Regular reflection practice to build emotional intelligence']
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
        {/* Emotions Detected */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Emotions Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {displayAnalysis.emotions.map((emotion, index) => (
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