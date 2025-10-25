'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, Sparkles, TrendingUp, Target, Heart, Lightbulb, 
  BookOpen, AlertCircle, ChevronDown, ChevronUp, Loader2,
  Eye, EyeOff, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'

interface DeepAnalysisData {
  emotionalPatterns: string
  growthAreas: string
  strengths: string
  challenges: string
  recommendations: string
  insightSummary: string
  confidence: number
}

interface DashboardAnalyzerProps {
  onAnalysisComplete?: (analysis: DeepAnalysisData) => void
}

export function DashboardAnalyzer({ onAnalysisComplete }: DashboardAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<DeepAnalysisData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true)
    
    try {
      // Get current user ID from localStorage or context
      const userData = localStorage.getItem('user')
      if (!userData) {
        toast.error('Please sign in to run deep analysis')
        return
      }

      const user = JSON.parse(userData)
      if (!user.id) {
        toast.error('User ID not found')
        return
      }

      const response = await fetch('/api/deep-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setAnalysis(data.data)
        setIsExpanded(true)
        onAnalysisComplete?.(data.data)
        
        toast.success('Deep analysis completed! 🧠✨', {
          description: 'Your personalized insights are ready',
          duration: 4000
        })
      } else {
        toast.error(data.error || 'Failed to run deep analysis')
      }
    } catch (error) {
      console.error('Deep analysis error:', error)
      toast.error('An error occurred during analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-orange-600 bg-orange-100'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence'
    if (confidence >= 60) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center"
            >
              <Brain className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-200">
                Deep AI Analysis
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Get personalized insights from your journaling patterns
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {analysis && (
              <Badge 
                variant="secondary" 
                className={getConfidenceColor(analysis.confidence)}
              >
                {getConfidenceLabel(analysis.confidence)}
              </Badge>
            )}
            
            {analysis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!analysis ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4"
              >
                <Brain className="h-8 w-8 text-purple-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Unlock Deep Insights
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Analyze your last 10 entries to discover emotional patterns, growth areas, and personalized recommendations for your wellness journey.
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={runDeepAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Your Patterns...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Run Deep Analysis
                  </>
                )}
              </Button>
            </motion.div>

            <div className="mt-4 text-xs text-slate-500">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              This analysis is for reflective support only and not psychological advice
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Insight Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Your Personal Insight
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(analysis.insightSummary, 'summary')}
                  >
                    {copiedSection === 'summary' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                  {analysis.insightSummary}
                </p>
              </div>

              {/* Analysis Sections */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* Emotional Patterns */}
                    <AnalysisSection
                      title="Emotional Patterns"
                      content={analysis.emotionalPatterns}
                      icon={TrendingUp}
                      color="blue"
                      onCopy={() => copyToClipboard(analysis.emotionalPatterns, 'patterns')}
                      copied={copiedSection === 'patterns'}
                    />

                    {/* Strengths */}
                    <AnalysisSection
                      title="Your Strengths"
                      content={analysis.strengths}
                      icon={Sparkles}
                      color="green"
                      onCopy={() => copyToClipboard(analysis.strengths, 'strengths')}
                      copied={copiedSection === 'strengths'}
                    />

                    {/* Growth Areas */}
                    <AnalysisSection
                      title="Growth Opportunities"
                      content={analysis.growthAreas}
                      icon={Target}
                      color="purple"
                      onCopy={() => copyToClipboard(analysis.growthAreas, 'growth')}
                      copied={copiedSection === 'growth'}
                    />

                    {/* Challenges */}
                    <AnalysisSection
                      title="Areas to Explore"
                      content={analysis.challenges}
                      icon={BookOpen}
                      color="orange"
                      onCopy={() => copyToClipboard(analysis.challenges, 'challenges')}
                      copied={copiedSection === 'challenges'}
                    />

                    {/* Recommendations */}
                    <AnalysisSection
                      title="Personalized Recommendations"
                      content={analysis.recommendations}
                      icon={Lightbulb}
                      color="yellow"
                      onCopy={() => copyToClipboard(analysis.recommendations, 'recommendations')}
                      copied={copiedSection === 'recommendations'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500">
                  Analysis completed • {analysis.confidence}% confidence
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runDeepAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-1" />
                    )}
                    Refresh Analysis
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  )
}

interface AnalysisSectionProps {
  title: string
  content: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'yellow'
  onCopy: () => void
  copied: boolean
}

function AnalysisSection({ title, content, icon: Icon, color, onCopy, copied }: AnalysisSectionProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg p-4 border ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold flex items-center">
          <Icon className="h-4 w-4 mr-2" />
          {title}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-6 w-6 p-0"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <p className="text-sm leading-relaxed opacity-90">
        {content}
      </p>
    </motion.div>
  )
}