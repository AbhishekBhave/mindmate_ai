'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

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
}

export function AIInsightsSection({ entries }: AIInsightsSectionProps) {
  const [lastSentiment, setLastSentiment] = useState<{ label: string; score: number } | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [emotions, setEmotions] = useState<string[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (entries.length > 0) {
      const lastEntry = entries[0] // Most recent entry
      if (lastEntry.sentiment) {
        setLastSentiment({
          label: lastEntry.sentiment.label,
          score: lastEntry.sentiment.score
        })
        // Ensure confidence is a valid number between 0-100
        const confidenceValue = typeof lastEntry.sentiment.score === 'number' 
          ? Math.max(0, Math.min(100, lastEntry.sentiment.score * 100))
          : 50
        setConfidence(confidenceValue)
        
        // Detect emotions (simplified)
        const content = lastEntry.content.toLowerCase()
        const detectedEmotions: string[] = []
        if (content.includes('happy') || content.includes('great') || content.includes('excited')) detectedEmotions.push('Joy')
        if (content.includes('sad') || content.includes('down') || content.includes('unhappy')) detectedEmotions.push('Sadness')
        if (content.includes('anxious') || content.includes('worried') || content.includes('nervous')) detectedEmotions.push('Anxiety')
        if (content.includes('grateful') || content.includes('thankful') || content.includes('appreciate')) detectedEmotions.push('Gratitude')
        if (content.includes('angry') || content.includes('frustrated') || content.includes('upset')) detectedEmotions.push('Frustration')
        if (content.includes('calm') || content.includes('peaceful') || content.includes('relaxed')) detectedEmotions.push('Calm')
        
        setEmotions(detectedEmotions.length > 0 ? detectedEmotions : ['Neutral'])
        
        // Set message based on sentiment
        if (lastEntry.sentiment.label === 'positive') {
          setMessage('Amazing progress! Your positive energy is inspiring! 🌟 Keep nurturing that inner light.')
        } else if (lastEntry.sentiment.label === 'negative') {
          setMessage('I hear you, and it\'s okay to feel this way. 💜 Try taking 5 deep breaths. You\'re doing your best.')
        } else {
          setMessage('Ready for today\'s reflection? I\'m here to listen. ✨')
        }
      } else {
        setMessage('Welcome! Start your journaling journey by writing your first entry. 🚀')
        setConfidence(0)
        setEmotions(['Neutral'])
      }
    } else {
      setMessage('Welcome! Start your journaling journey by writing your first entry. 🚀')
      setConfidence(0)
      setEmotions(['Neutral'])
    }
  }, [entries])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mb-8"
    >
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(183,148,246,0.3)] hover:shadow-[0_0_40px_rgba(183,148,246,0.4)] transition-all duration-300">
        <div className="flex items-start space-x-4">
          {/* Animated AI Avatar */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 0 0 rgba(147, 51, 234, 0.4)',
                '0 0 0 20px rgba(147, 51, 234, 0)',
                '0 0 0 0 rgba(147, 51, 234, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          {/* AI Message */}
          <div className="flex-1">
            <motion.p
              key={message}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="text-gray-800 dark:text-white text-lg mb-4 leading-relaxed"
            >
              {message}
            </motion.p>

            {/* Confidence Meter */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Analysis Confidence</span>
                <span className="text-sm font-semibold text-purple-600">{confidence}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                />
              </div>
            </div>

            {/* Emotion Tags */}
            {emotions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion, index) => (
                  <motion.span
                    key={emotion}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="px-3 py-1 rounded-full bg-purple-100/20 dark:bg-purple-900/20 border border-purple-300/30 dark:border-purple-700/30 text-sm text-purple-700 dark:text-purple-300"
                  >
                    {emotion}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

