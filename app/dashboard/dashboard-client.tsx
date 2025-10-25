'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Plus, Edit2, Trash2, TrendingUp, Calendar, Clock, Heart, 
  Brain, Sparkles, Target, BookOpen, BarChart3, Users, Settings,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { JournalHeader } from '@/components/dashboard/JournalHeader'
import { AnimatedBackground } from '@/components/dashboard/AnimatedBackground'
import { AIInsightsSection } from '@/components/dashboard/AIInsightsSection'
import { DashboardAnalyzer } from '@/components/dashboard/DashboardAnalyzer'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart } from 'recharts'

interface Entry {
  id: string
  content: string
  created_at: string
  word_count?: number
  reading_time?: number
  sentiment?: {
    score: number
    label: string
    confidence: number
    emotions?: string[]
    summary?: string
  }
}

interface AnalyticsData {
  weeklyEntries: number
  avgMoodScore: number
  moodDistribution: { positive: number; neutral: number; negative: number }
  emotionsDetected: string[]
  streak: number
  totalWords: number
}

interface DashboardClientProps {
  user: SupabaseUser
}

const COLORS = {
  positive: '#10B981', // emerald-500
  neutral: '#F59E0B', // amber-500
  negative: '#EF4444', // red-500
  background: {
    positive: '#ECFDF5', // emerald-50
    neutral: '#FFFBEB', // amber-50
    negative: '#FEF2F2' // red-50
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle')
  const [placeholderText, setPlaceholderText] = useState('How are you feeling today? What\'s on your mind?')
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [showMoodChart, setShowMoodChart] = useState(true)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const suggestedPrompts = [
    'What made you smile today?',
    'Describe a challenge you overcame',
    'What are you grateful for?',
    'How did you feel about your interactions today?',
    'What is one thing you want to achieve tomorrow?',
    'Reflect on a recent success or learning experience.',
  ]

  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id)
      fetchAnalytics(user.id)
    }
  }, [user])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [newEntry])

  const fetchEntries = async (userId: string) => {
    try {
      const response = await fetch(`/api/entries?userId=${userId}`)
      const data = await response.json()

      if (data.ok) {
        setEntries(data.data || [])
        if (data.data && data.data.length > 0) {
          updateLastAnalysis(data.data[0].sentiment)
        }
      } else {
        toast.error('Failed to fetch entries')
      }
    } catch {
      toast.error('Failed to fetch entries')
    }
  }

  const fetchAnalytics = async (userId: string) => {
    try {
      const response = await fetch(`/api/analytics?userId=${userId}`)
      const data = await response.json()

      if (data.ok) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const updateLastAnalysis = (sentiment: Entry['sentiment']) => {
    if (!sentiment) {
      setLastAnalysis(null)
      return
    }

    setLastAnalysis({
      sentiment: sentiment.label,
      confidence: sentiment.confidence,
      suggestion: sentiment.summary || 'Ready for today\'s reflection? I\'m here to listen.',
      emotions: sentiment.emotions || ['Reflective'],
      insights: [
        `Your entry shows ${sentiment.label} emotional patterns with ${Math.round(sentiment.confidence * 100)}% confidence.`,
        'This type of reflection demonstrates emotional awareness and self-reflection skills.',
        'Consider how these feelings might be connected to recent events or ongoing situations.'
      ],
      suggestions: [
        'Consider reflecting on what brought you to write this entry today.',
        'Think about how you can maintain or improve your current emotional state.',
        'Practice gratitude for the positive aspects of your day.'
      ],
      patterns: ['Clear emotional expression with good self-awareness'],
      growthAreas: ['Regular reflection practice to build emotional intelligence']
    })
  }

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.trim() || !user?.id) return

    setIsLoading(true)
    setAutoSaveStatus('saving')
    
    try {
      // First, save the entry
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newEntry,
          userId: user.id
        }),
      })

      const data = await response.json()

      if (data.ok) {
        // Then analyze the entry with AI
        try {
          const analysisResponse = await fetch('/api/analyze-entry', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entryText: newEntry
            }),
          })

          const analysisData = await analysisResponse.json()
          
          if (analysisData.ok) {
            // Store the comprehensive analysis for immediate display
            setLastAnalysis(analysisData.data)
            
            // Update the entry with AI analysis
            const updateResponse = await fetch('/api/entries', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                entryId: data.data.id,
                sentiment: analysisData.data
              }),
            })
          }
        } catch (analysisError) {
          console.error('AI Analysis failed:', analysisError)
          // Continue without AI analysis
        }

        toast.success('Entry saved successfully! 🎉', {
          description: 'Your thoughts have been recorded and analyzed',
        })
        setNewEntry('')
        setAutoSaveStatus('saved')
        fetchEntries(user.id)
        fetchAnalytics(user.id)
        
        // Reset status after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } else {
        toast.error(data.error || 'Failed to save entry')
        setAutoSaveStatus('idle')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
      setAutoSaveStatus('idle')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Failed to sign out')
      } else {
        router.push('/sign-in')
      }
    } catch {
      toast.error('An error occurred while signing out')
    }
  }

  const handlePromptClick = (prompt: string) => {
    setPlaceholderText(prompt)
    textareaRef.current?.focus()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return COLORS.positive
      case 'negative': return COLORS.negative
      default: return COLORS.neutral
    }
  }

  const getSentimentBackground = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return COLORS.background.positive
      case 'negative': return COLORS.background.negative
      default: return COLORS.background.neutral
    }
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  // Prepare chart data
  const chartData = entries
    .filter(entry => entry.sentiment && typeof entry.sentiment.score === 'number' && !isNaN(entry.sentiment.score))
    .slice(0, 30)
    .map(entry => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: Math.max(0, Math.min(100, entry.sentiment!.score * 100)),
      confidence: Math.round(entry.sentiment!.confidence * 100),
      emotions: entry.sentiment!.emotions || []
    }))
    .reverse()

  // Prepare mood distribution data for pie chart
  const moodDistributionData = analytics ? [
    { name: 'Positive', value: analytics.moodDistribution.positive, color: COLORS.positive },
    { name: 'Neutral', value: analytics.moodDistribution.neutral, color: COLORS.neutral },
    { name: 'Negative', value: analytics.moodDistribution.negative, color: COLORS.negative }
  ] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Fixed Header */}
      <JournalHeader userEmail={user.email || ''} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insights Section */}
        <AIInsightsSection entries={entries} lastAnalysis={lastAnalysis} />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Entry Creation */}
          <div className="xl:col-span-2 space-y-6">
            {/* Create New Entry Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl text-slate-800 dark:text-slate-200">
                    <Heart className="h-6 w-6 text-pink-500 mr-3" />
                    Share Your Thoughts
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Express yourself freely. Your AI companion is here to listen and provide gentle guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitEntry} className="space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder={placeholderText}
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        className="min-h-[200px] resize-none border-slate-200 focus:border-pink-300 focus:ring-pink-200 transition-all duration-300"
                        required
                      />
                      
                      {/* Character counter */}
                      <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                        {newEntry.length} characters
                      </div>
                    </div>

                    {/* Suggested Prompts */}
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick prompts:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                          <motion.button
                            key={index}
                            type="button"
                            onClick={() => handlePromptClick(prompt)}
                            className="px-3 py-1 text-sm bg-slate-100 hover:bg-pink-100 text-slate-700 rounded-full transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {prompt}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-save status */}
                    <AnimatePresence>
                      {autoSaveStatus === 'saving' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-slate-500"
                        >
                          Saving...
                        </motion.div>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-green-600"
                        >
                          ✓ Saved successfully!
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                            />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Save & Analyze Entry
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Entries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-slate-800 dark:text-slate-200">
                    <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                    Recent Entries
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Your emotional journey over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entries.length > 0 ? (
                    <div className="space-y-4">
                      {entries.slice(0, 5).map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                            expandedEntry === entry.id ? 'shadow-lg' : 'shadow-sm'
                          }`}
                          style={{
                            backgroundColor: entry.sentiment ? getSentimentBackground(entry.sentiment.label) : '#F8FAFC',
                            borderColor: entry.sentiment ? getSentimentColor(entry.sentiment.label) : '#E2E8F0'
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getSentimentEmoji(entry.sentiment?.label || 'neutral')}</span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {getTimeAgo(entry.created_at)}
                                  </span>
                                  {entry.sentiment && (
                                    <Badge 
                                      variant="secondary" 
                                      className="text-xs"
                                      style={{ 
                                        backgroundColor: getSentimentColor(entry.sentiment.label) + '20',
                                        color: getSentimentColor(entry.sentiment.label)
                                      }}
                                    >
                                      {Math.round(entry.sentiment.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                </div>
                                {entry.word_count && (
                                  <div className="text-xs text-slate-500">
                                    {entry.word_count} words • {entry.reading_time}s read
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                              >
                                {expandedEntry === entry.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className={`text-slate-700 dark:text-slate-300 ${
                            expandedEntry === entry.id ? '' : 'line-clamp-2'
                          }`}>
                            {entry.content}
                          </p>

                          {entry.sentiment?.emotions && entry.sentiment.emotions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {entry.sentiment.emotions.map((emotion, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {emotion}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {entry.sentiment?.summary && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ 
                                opacity: expandedEntry === entry.id ? 1 : 0, 
                                height: expandedEntry === entry.id ? 'auto' : 0 
                              }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 p-3 bg-white/50 rounded-lg border border-white/30"
                            >
                              <p className="text-sm italic text-slate-600 dark:text-slate-400">
                                <Brain className="h-4 w-4 inline mr-1" />
                                AI Insight: {entry.sentiment.summary}
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No entries yet</p>
                      <p className="text-sm">Start writing your first entry above!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Insights & Analytics */}
          <div className="space-y-6">
            {/* Mood Trend Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg text-slate-800 dark:text-slate-200">
                      <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                      Mood Trend
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMoodChart(!showMoodChart)}
                    >
                      {showMoodChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {showMoodChart && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" stroke="rgba(100, 116, 139, 0.8)" fontSize={12} />
                              <YAxis domain={[0, 100]} stroke="rgba(100, 116, 139, 0.8)" fontSize={12} />
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                      <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg">
                                        <p className="font-semibold text-slate-800">{label}</p>
                                        <p className="text-purple-600">Mood: {data.mood.toFixed(1)}%</p>
                                        <p className="text-slate-600">Confidence: {data.confidence}%</p>
                                        {data.emotions.length > 0 && (
                                          <p className="text-slate-600">Emotions: {data.emotions.join(', ')}</p>
                                        )}
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="mood" 
                                stroke="#8B5CF6" 
                                fill="url(#colorMood)" 
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-[200px] flex items-center justify-center text-slate-500">
                            <div className="text-center">
                              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Start journaling to see your mood trend!</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Insights */}
            {analytics && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg text-slate-800 dark:text-slate-200">
                      <Target className="h-5 w-5 text-blue-500 mr-2" />
                      Your Progress Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Weekly Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analytics.weeklyEntries}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Entries This Week</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {analytics.streak}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Day Streak</div>
                      </div>
                    </div>

                    {/* Mood Distribution */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Mood Distribution
                      </h4>
                      {moodDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie
                              data={moodDistributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                            >
                              {moodDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-4 text-slate-500">
                          <p className="text-sm">No mood data yet</p>
                        </div>
                      )}
                    </div>

                    {/* Average Mood Score */}
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {Math.round(analytics.avgMoodScore * 100)}%
                      </div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">Average Mood Score</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Deep AI Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <DashboardAnalyzer 
            onAnalysisComplete={(analysis) => {
              console.log('Analysis completed:', analysis)
              toast.success('Deep analysis completed! Check out your personalized insights below.')
            }}
          />
        </motion.div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg hover:shadow-xl flex items-center justify-center z-50"
        onClick={() => textareaRef.current?.focus()}
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.button>
    </div>
  )
}