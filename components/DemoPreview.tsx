'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, Smile, Frown, Meh, TrendingUp, Brain, Sparkles } from 'lucide-react'

interface SentimentDisplayProps {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  insights: string[]
}

export function SentimentDisplay({ sentiment, confidence, insights }: SentimentDisplayProps) {
  const sentimentIcons = {
    positive: <Smile className="h-6 w-6 text-green-500" />,
    negative: <Frown className="h-6 w-6 text-red-500" />,
    neutral: <Meh className="h-6 w-6 text-yellow-500" />
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
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6"
    >
      <div className="flex items-center mb-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {sentimentIcons[sentiment]}
        </motion.div>
        <div className="ml-3">
          <div className="font-semibold text-gray-900 dark:text-white capitalize">
            {sentiment} Mood
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {confidence}% confidence
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
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
    </motion.div>
  )
}

export function MockEntry() {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SentimentDisplayProps | null>(null)

  const sampleEntries = [
    "I had a really productive day today! Finished my project and felt accomplished.",
    "Feeling overwhelmed with all the assignments due this week. Need to prioritize better.",
    "Had a great conversation with my friend today. It reminded me why I value our friendship so much."
  ]

  const analyzeText = async (inputText: string) => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock analysis based on keywords
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    let confidence = 75
    let insights: string[] = []

    if (inputText.toLowerCase().includes('great') || inputText.toLowerCase().includes('productive') || inputText.toLowerCase().includes('accomplished')) {
      sentiment = 'positive'
      confidence = 89
      insights = [
        "You're showing signs of achievement and satisfaction",
        "Consider celebrating this positive momentum",
        "This energy could help with future challenges"
      ]
    } else if (inputText.toLowerCase().includes('overwhelmed') || inputText.toLowerCase().includes('stressed') || inputText.toLowerCase().includes('difficult')) {
      sentiment = 'negative'
      confidence = 82
      insights = [
        "It's normal to feel overwhelmed during busy periods",
        "Consider breaking tasks into smaller, manageable steps",
        "Remember to take breaks and practice self-care"
      ]
    } else {
      insights = [
        "Your entry shows balanced emotional expression",
        "Consider exploring what made this day meaningful",
        "Regular reflection helps build emotional awareness"
      ]
    }

    setAnalysis({ sentiment, confidence, insights })
    setIsAnalyzing(false)
  }

  const handleSampleEntry = (sample: string) => {
    setText(sample)
    analyzeText(sample)
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
          Try It Out - No Signup Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Experience our AI analysis with a sample entry or write your own thoughts.
        </p>
      </div>

      {/* Sample entries */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Try a sample entry:</p>
        <div className="space-y-2">
          {sampleEntries.map((entry, index) => (
            <motion.button
              key={index}
              onClick={() => handleSampleEntry(entry)}
              className="block w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 text-sm text-gray-700 dark:text-gray-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {entry}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Text input */}
      <div className="mb-6">
        <Textarea
          placeholder="Write your thoughts here... (e.g., 'I had a challenging day but learned something new')"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px] backdrop-blur-xl bg-white/5 border-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
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
              Analyzing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Analyze My Entry
            </>
          )}
        </Button>
      </motion.div>

      {/* Analysis results */}
      {analysis && (
        <SentimentDisplay {...analysis} />
      )}

      {/* Loading animation */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block"
          >
            <Brain className="h-8 w-8 text-purple-500" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">AI is analyzing your entry...</p>
        </motion.div>
      )}
    </div>
  )
}

export function DemoPreview() {
  return (
    <section className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Experience{' '}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
              AI-Powered Analysis
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            See how MindMate AI understands your emotions and provides meaningful insights. Try it yourself with no commitment required.
          </p>
        </motion.div>

        <MockEntry />
      </div>
    </section>
  )
}
