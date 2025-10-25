'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, BarChart3, Heart, ArrowRight, TrendingUp, Users, Shield } from 'lucide-react'

interface InteractiveCardProps {
  icon: React.ReactNode
  title: string
  description: string
  stats: string
  learnMore: string
  className?: string
}

export function InteractiveCard({ 
  icon, 
  title, 
  description, 
  stats, 
  learnMore, 
  className = '' 
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`relative ${className}`}
    >
      <motion.div
        whileHover={{ 
          scale: 1.02,
          rotateY: 5,
          rotateX: 5,
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative group"
      >
        <Card className="h-full backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="relative">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Icon with rotation animation */}
            <motion.div
              className="mb-4 inline-block"
              animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6 }}
            >
              {icon}
            </motion.div>

            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </CardTitle>
            
            <CardDescription className="text-gray-600 dark:text-gray-300 mb-4">
              {description}
            </CardDescription>

            {/* Animated counter */}
            <motion.div
              className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {stats}
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: '85%' }}
                transition={{ delay: 0.7, duration: 1 }}
              />
            </motion.div>
          </CardHeader>

          {/* Learn More Section */}
          <motion.div
            className="px-6 pb-6"
            animate={{ height: isExpanded ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
              whileHover={{ x: 5 }}
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Show Less' : 'Learn More'}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="ml-1 h-4 w-4" />
              </motion.div>
            </motion.button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 text-sm text-gray-600 dark:text-gray-300"
              >
                {learnMore}
              </motion.div>
            )}
          </motion.div>

          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 blur-xl -z-10"
            animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Card>
      </motion.div>
    </motion.div>
  )
}

export function FeatureCards() {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "AI-Powered Insights",
      description: "Get gentle summaries and reflection suggestions for your entries",
      stats: "2.3M+ reflections analyzed",
      learnMore: "Our advanced AI analyzes your journal entries to provide personalized insights, mood patterns, and gentle suggestions for self-improvement. The AI learns from your writing style and emotional patterns to offer increasingly relevant guidance."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Mood Tracking",
      description: "Visualize your emotional journey with beautiful mood charts",
      stats: "94% accuracy rate",
      learnMore: "Track your emotional patterns over time with our sophisticated mood analysis. Visualize trends, identify triggers, and celebrate progress with interactive charts and personalized reports."
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Personal & Private",
      description: "Your thoughts are yours alone - secure and confidential",
      stats: "100% encrypted",
      learnMore: "Your privacy is our priority. All data is encrypted end-to-end, and we never share your personal thoughts. You have complete control over your data with options to export or delete at any time."
    }
  ]

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
              MindMate AI
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of mental wellness with cutting-edge AI technology designed specifically for your personal growth journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <InteractiveCard
              key={index}
              {...feature}
              className="group"
            />
          ))}
        </div>

        {/* Additional stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">87%</div>
            <div className="text-gray-600 dark:text-gray-300">Report improved self-awareness</div>
          </div>
          
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50+</div>
            <div className="text-gray-600 dark:text-gray-300">Universities represented</div>
          </div>
          
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">100%</div>
            <div className="text-gray-600 dark:text-gray-300">Privacy guaranteed</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
