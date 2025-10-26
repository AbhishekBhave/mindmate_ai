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
  ChevronDown, ChevronUp, Eye, EyeOff, Bell, Smile, Meh, Frown, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { DashboardData } from '@/lib/dashboard-data'
import { JournalHeader } from '@/components/dashboard/JournalHeader'
import { AnimatedBackground } from '@/components/dashboard/AnimatedBackground'
import { AIInsightsSection } from '@/components/dashboard/AIInsightsSection'
import { DashboardAnalyzer } from '@/components/dashboard/DashboardAnalyzer'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart } from 'recharts'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Entry {
  id: string
  content: string
  created_at: string
  word_count?: number
  reading_time?: number
  sentiment?: {
    id: string
    entry_id: string
    score: number
    label: string
    confidence: number
    emotions?: string[]
    summary?: string
    ai_feedback?: string
    created_at: string
  }
}

interface DashboardClientProps {
  user: SupabaseUser
  initialData: DashboardData
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

export default function DashboardClient({ user, initialData }: DashboardClientProps) {
  const [entries, setEntries] = useState<Entry[]>(initialData.entries)
  const [moodGraph, setMoodGraph] = useState(initialData.moodGraph)
  const [insights, setInsights] = useState(initialData.insights)
  const [newEntry, setNewEntry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle')
  const [placeholderText, setPlaceholderText] = useState('How are you feeling today? What\'s on your mind?')
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const [showMoodChart, setShowMoodChart] = useState(true)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Set last analysis from first entry if available
    if (entries.length > 0 && entries[0].sentiment) {
      updateLastAnalysis(entries[0].sentiment)
    }
  }, [entries])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [newEntry])

  const refreshDashboard = async () => {
    try {
      // Trigger a page reload to get fresh server data
      router.refresh()
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
    }
  }

  const updateLastAnalysis = (sentiment: Entry['sentiment']) => {
    if (!sentiment) {
      console.log('📊 [DASHBOARD] No sentiment data available')
      setLastAnalysis(null)
      return
    }

    // Use ai_feedback if available, otherwise fallback to summary
    const aiFeedback = sentiment.ai_feedback || sentiment.summary || 'Ready for today\'s reflection? I\'m here to listen.'
    
    console.log('📊 [DASHBOARD] Updating last analysis:', {
      label: sentiment.label,
      hasAiFeedback: !!sentiment.ai_feedback,
      hasSummary: !!sentiment.summary,
      feedbackLength: aiFeedback.length
    })

    setLastAnalysis({
      sentiment: sentiment.label,
      confidence: typeof sentiment.confidence === 'number' ? Math.round(sentiment.confidence * 100) : 50,
      suggestion: aiFeedback,
      emotions: sentiment.emotions || ['Reflective'],
      insights: [
        `Your entry shows ${sentiment.label} emotional patterns.`,
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

    const entryContent = newEntry
    setIsLoading(true)
    setAutoSaveStatus('saving')
    
    try {
      console.log('📝 [DASHBOARD] Submitting entry...')
      
      // Submit entry with analysis to the API
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: entryContent
        }),
      })

      const data = await response.json()

      if (data.ok && data.data) {
        console.log('✅ [DASHBOARD] Entry saved:', data.data)
        
        // Extract sentiment data from response
        const sentiment = data.data.sentiment?.[0] || data.data.sentiment
        
        // Transform to match Entry interface
        const newEntry: Entry = {
          id: data.data.id,
          content: data.data.content,
          created_at: data.data.created_at,
          word_count: data.data.word_count,
          reading_time: data.data.reading_time,
          sentiment: sentiment ? {
            id: sentiment.id,
            entry_id: sentiment.entry_id,
            score: sentiment.score,
            label: sentiment.label,
            confidence: sentiment.confidence,
            emotions: sentiment.emotions || [],
            summary: sentiment.summary,
            ai_feedback: sentiment.ai_feedback || sentiment.summary,
            created_at: data.data.created_at
          } : undefined
        }

        // Optimistically add new entry to top of list immediately
        setEntries(prev => [newEntry, ...prev])
        
        // Update mood graph by recalculating with new entry
        const updatedGraph = recalculateMoodGraph([newEntry, ...entries])
        setMoodGraph(updatedGraph)
        
        // Update insights
        const updatedInsights = calculateInsightsFromEntries([newEntry, ...entries])
        setInsights(updatedInsights)
        
        // Update last analysis for AI guidance
        if (sentiment) {
          setLastAnalysis({
            sentiment: sentiment.label,
            confidence: Math.round(sentiment.confidence * 100),
            suggestion: sentiment.ai_feedback || sentiment.summary || 'Analysis complete',
            emotions: sentiment.emotions || [],
            insights: [`Your entry shows ${sentiment.label} emotional patterns.`],
            suggestions: ['Consider reflecting on this entry later.'],
            patterns: ['Clear emotional expression'],
            growthAreas: ['Regular reflection practice']
          })
        }
        
        toast.success('Entry saved successfully! 🎉', {
          description: 'Your thoughts have been recorded and analyzed',
        })
        
        setNewEntry('')
        setAutoSaveStatus('saved')
        
        // Reset status after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } else {
        console.error('❌ [DASHBOARD] Failed to save entry:', data.error)
        toast.error(data.error || 'Failed to save entry')
        setAutoSaveStatus('idle')
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error submitting entry:', error)
      toast.error('An error occurred. Please try again.')
      setAutoSaveStatus('idle')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to recalculate mood graph on client
  const recalculateMoodGraph = (entriesList: Entry[]) => {
    const entriesWithSentiment = entriesList.filter(e => e.sentiment)
    if (entriesWithSentiment.length === 0) return []

    const dayBuckets = new Map<string, { scores: number[], labels: string[] }>()

    entriesWithSentiment.forEach(entry => {
      const date = new Date(entry.created_at)
      const dateKey = date.toISOString().split('T')[0]

      if (!dayBuckets.has(dateKey)) {
        dayBuckets.set(dateKey, { scores: [], labels: [] })
      }

      const bucket = dayBuckets.get(dateKey)!
      bucket.scores.push(entry.sentiment!.score)
      bucket.labels.push(entry.sentiment!.label)
    })

    const graphData = Array.from(dayBuckets.entries())
      .map(([date, bucket]) => {
        const avgScore = bucket.scores.reduce((sum, score) => sum + score, 0) / bucket.scores.length
        
        let label: 'positive' | 'neutral' | 'negative'
        if (avgScore >= 0.6) {
          label = 'positive'
        } else if (avgScore <= 0.4) {
          label = 'negative'
        } else {
          label = 'neutral'
        }

        const clampedScore = Math.max(0, Math.min(1, avgScore))

        return {
          date,
          avgScore: clampedScore,
          label
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return graphData
  }

  // Helper to recalculate insights on client
  const calculateInsightsFromEntries = (entriesList: Entry[]) => {
    const entriesWithSentiment = entriesList.filter(e => e.sentiment)
    
    if (entriesWithSentiment.length === 0) {
      return {
        weeklyEntries: 0,
        avgMoodScore: 0.5,
        moodDistribution: { positive: 0, neutral: 0, negative: 0 },
        streak: 0
      }
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentEntries = entriesWithSentiment.filter(entry => 
      new Date(entry.created_at) >= sevenDaysAgo
    )

    const weeklyEntries = recentEntries.length
    const avgMoodScore = recentEntries.length > 0
      ? recentEntries.reduce((sum, entry) => sum + (entry.sentiment?.score || 0.5), 0) / recentEntries.length
      : 0.5

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const moodDistribution = { positive: 0, neutral: 0, negative: 0 }
    entriesWithSentiment
      .filter(entry => new Date(entry.created_at) >= fourteenDaysAgo)
      .forEach(entry => {
        const label = entry.sentiment?.label
        if (label === 'positive') moodDistribution.positive++
        else if (label === 'negative') moodDistribution.negative++
        else moodDistribution.neutral++
      })

    // Calculate streak
    const entryDates = new Set(
      entriesWithSentiment.map(entry => {
        const date = new Date(entry.created_at)
        return date.toISOString().split('T')[0]
      })
    )
    const sortedDates = Array.from(entryDates).sort((a, b) => b.localeCompare(a))
    
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let checkDate = today
    
    for (const entryDate of sortedDates) {
      const date1 = new Date(checkDate)
      const date2 = new Date(entryDate)
      const diffDays = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0 || diffDays === 1) {
        streak++
        checkDate = entryDate
      } else {
        break
      }
    }

    return {
      weeklyEntries,
      avgMoodScore,
      moodDistribution,
      streak
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

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const response = await fetch(`/api/entries?entryId=${entryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.ok) {
        toast.success('Entry deleted successfully')
        await refreshDashboard()
      } else {
        toast.error(data.error || 'Failed to delete entry')
      }
    } catch (error) {
      toast.error('An error occurred while deleting entry')
    }
  }

  const handleEditEntry = (entry: Entry) => {
    setNewEntry(entry.content)
    textareaRef.current?.focus()
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const suggestedPrompts = [
    'What made you smile today?',
    'Describe a challenge you overcame',
    'What are you grateful for?',
    'How did you feel about your interactions today?',
    'What is one thing you want to achieve tomorrow?',
    'Reflect on a recent success or learning experience.',
  ]

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-4 w-4 text-green-500" />
      case 'negative': return <Frown className="h-4 w-4 text-red-500" />
      default: return <Meh className="h-4 w-4 text-amber-500" />
    }
  }

  // Prepare chart data from server-provided moodGraph
  const chartData = moodGraph.map(point => ({
    date: new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    mood: point.avgScore * 100,
    label: point.label
  }))

  // Prepare mood distribution data for pie chart
  const moodDistributionData = [
    { name: 'Positive', value: insights.moodDistribution.positive, color: COLORS.positive },
    { name: 'Neutral', value: insights.moodDistribution.neutral, color: COLORS.neutral },
    { name: 'Negative', value: insights.moodDistribution.negative, color: COLORS.negative }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Fixed Header */}
      <JournalHeader 
        userEmail={user.email || ''} 
        onSignOut={handleSignOut}
        onSettingsOpen={() => setShowSettings(true)}
        onNotificationsOpen={() => setShowNotifications(true)}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* AI Guidance & Insights Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <AIInsightsSection entries={entries} lastAnalysis={lastAnalysis} />
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
                                  {entry.sentiment && typeof entry.sentiment.confidence === 'number' && !isNaN(entry.sentiment.confidence) && entry.sentiment.confidence > 0 && (
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
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
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

                          {/* Detected Emotion Section */}
                          {entry.sentiment && (
                            <div className="mt-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                    Detected Emotion
                                  </span>
                                  <Badge 
                                    variant="secondary"
                                    className="text-xs px-2 py-0.5"
                                    style={{
                                      backgroundColor: getSentimentColor(entry.sentiment.label) + '20',
                                      color: getSentimentColor(entry.sentiment.label),
                                      borderColor: getSentimentColor(entry.sentiment.label)
                                    }}
                                  >
                                    <div className="flex items-center gap-1">
                                      {getSentimentIcon(entry.sentiment.label)}
                                      <span className="capitalize">{entry.sentiment.label}</span>
                                    </div>
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-500">
                                  {typeof entry.sentiment.confidence === 'number' && !isNaN(entry.sentiment.confidence) && entry.sentiment.confidence > 0
                                    ? (entry.sentiment.confidence * 100).toFixed(0) + '%'
                                    : '--%'
                                  } confidence
                                </span>
                              </div>
                              {(entry.sentiment.ai_feedback || entry.sentiment.summary) && (
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {entry.sentiment.ai_feedback || entry.sentiment.summary}
                                </p>
                              )}
                              {!entry.sentiment.ai_feedback && !entry.sentiment.summary && (
                                <p className="text-sm text-slate-500 italic">Analysis pending...</p>
                              )}
                            </div>
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
                                        {typeof data.confidence === 'number' && !isNaN(data.confidence) && data.confidence > 0 && (
                                          <p className="text-slate-600">Confidence: {data.confidence.toFixed(0)}%</p>
                                        )}
                                        {data.emotions && Array.isArray(data.emotions) && data.emotions.length > 0 && (
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
                        {insights.weeklyEntries}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Entries This Week</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {insights.streak}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">Day Streak</div>
                    </div>
                  </div>

                  {/* Mood Distribution */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Mood Distribution (Last 14 Days)
                    </h4>
                    {moodDistributionData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie
                            data={moodDistributionData.filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            dataKey="value"
                          >
                            {moodDistributionData.filter(d => d.value > 0).map((entry, index) => (
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
                      {Math.round(insights.avgMoodScore * 100)}%
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Average Mood Score</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
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

        {/* Community Posts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-xl text-slate-800 dark:text-slate-200">
                    <MessageSquare className="h-6 w-6 text-purple-500 mr-3" />
                    Community Posts
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Connect with others anonymously for support and encouragement
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Join our anonymous community space where you can share experiences, find support, and connect with others who understand what you're going through.
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => router.push('/community')}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Enter Community
                </Button>
              </motion.div>
            </CardContent>
          </Card>
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

      {/* Settings Panel */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </SheetTitle>
            <SheetDescription>
              Manage your preferences and account settings
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {user.email}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data</h3>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const dataStr = JSON.stringify(entries, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `mindmate-entries-${new Date().toISOString()}.json`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    toast.success('Entries exported successfully!')
                  } catch (error) {
                    toast.error('Failed to export entries')
                  }
                }}
              >
                Export My Data
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Panel */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Recent activity and updates
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications yet. Start journaling to see your activity!
              </p>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium">Welcome to MindMate AI</p>
                  <p className="text-xs text-muted-foreground">
                    You have {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium">Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">
                    Your latest entry has been analyzed
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}