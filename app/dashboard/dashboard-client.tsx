'use client'

// WARNING: This is a complete dashboard redesign for glassmorphic UI
// All database operations, authentication, and entry saving functionality are preserved
// Only the UI presentation has been transformed

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Plus, Edit2, Trash2, Search, TrendingUp, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { JournalHeader } from '@/components/dashboard/JournalHeader'
import { AnimatedBackground } from '@/components/dashboard/AnimatedBackground'
import { AIInsightsSection } from '@/components/dashboard/AIInsightsSection'
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

interface DashboardClientProps {
  user: SupabaseUser
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle')
  const [characterCount, setCharacterCount] = useState(0)
  const [placeholderText, setPlaceholderText] = useState('How are you feeling today? What\'s on your mind?')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const moods = ['😊', '😔', '😐', '😡', '😰', '😴']
  const suggestedPrompts = [
    'What made you smile today?',
    'Describe a challenge you overcame',
    'What are you grateful for?',
    'How are you feeling right now?',
    'What lesson did you learn today?'
  ]

  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id)
    }
  }, [user])

  useEffect(() => {
    setCharacterCount(newEntry.length)
  }, [newEntry])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newEntry])

  const fetchEntries = async (userId: string) => {
    try {
      const response = await fetch(`/api/entries?userId=${userId}`)
      const data = await response.json()
      
      if (data.ok) {
        setEntries(data.data || [])
      } else {
        toast.error('Failed to fetch entries')
      }
    } catch {
      toast.error('Failed to fetch entries')
    }
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
          description: 'Your thoughts have been recorded',
        })
        setNewEntry('')
        setAutoSaveStatus('saved')
        fetchEntries(user.id)
        
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

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getMoodEmoji = (sentiment?: { label: string }) => {
    if (!sentiment) return '😐'
    switch (sentiment.label) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  // Prepare chart data
  const chartData = entries
    .filter(entry => entry.sentiment)
    .slice(0, 30)
    .map(entry => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry.sentiment!.score * 100
    }))
    .reverse()

  // Calculate stats
  const streak = 5 // This would come from database in real app
  const totalEntries = entries.length
  const avgMood = entries
    .filter(e => e.sentiment)
    .reduce((acc, e) => acc + (e.sentiment!.score * 100), 0) / (entries.filter(e => e.sentiment).length || 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Gradient Background Mesh */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='a' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23B794F6' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%23B794F6' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23a)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }} />
      </div>

      {/* Fixed Header */}
      <JournalHeader userEmail={user.email || ''} onSignOut={handleSignOut} />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Insights Section */}
        <AIInsightsSection entries={entries} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Main Entry Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(183,148,246,0.4)] hover:shadow-[0_0_50px_rgba(183,148,246,0.5)] transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Share your thoughts</h2>

              {/* Entry Form */}
              <form onSubmit={handleSubmitEntry} className="space-y-4">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder={placeholderText}
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    className="backdrop-blur-sm bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 min-h-[200px]"
                    required
                  />
                  
                  {/* Character counter */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: characterCount > 0 ? 1 : 0 }}
                    className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {characterCount}
                  </motion.div>
                </div>

                {/* Suggested Prompts */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.button
                      key={prompt}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePromptClick(prompt)}
                      className="px-4 py-2 rounded-full backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>

                {/* Auto-save indicator */}
                <AnimatePresence>
                  {autoSaveStatus === 'saving' && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      Saving...
                    </motion.p>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-green-500"
                    >
                      ✓ Saved successfully!
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0 rounded-xl backdrop-blur-xl shadow-[0_0_20px_rgba(183,148,246,0.3)] hover:shadow-[0_0_30px_rgba(183,148,246,0.5)] transition-all duration-300 py-3 text-lg font-semibold relative overflow-hidden group"
                  >
                    {isLoading ? 'Saving...' : (
                      <>
                        <Send className="h-5 w-5 inline mr-2" />
                        Save Entry
                      </>
                    )}
                    <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Chart and Stats */}
          <div className="space-y-6">
            {/* Mood Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(183,148,246,0.2)]"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mood Over Time</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(156,163,175,0.8)" />
                    <YAxis stroke="rgba(156,163,175,0.8)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="mood" stroke="#9333EA" fill="url(#colorMood)" strokeWidth={2} />
                    <Line type="monotone" dataKey="mood" stroke="#9333EA" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  <p>Start writing to see your mood chart!</p>
                </div>
              )}
            </motion.div>

            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(183,148,246,0.2)]"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Progress</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                    className="text-3xl mb-2"
                  >
                    🔥
                  </motion.div>
                  <div className="text-2xl font-bold text-purple-600">{streak}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Day streak</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring' }}
                    className="text-3xl mb-2"
                  >
                    📝
                  </motion.div>
                  <div className="text-2xl font-bold text-purple-600">{totalEntries}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total entries</div>
                </div>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.0, type: 'spring' }}
                    className="text-3xl mb-2"
                  >
                    😊
                  </motion.div>
                  <div className="text-2xl font-bold text-purple-600">{Math.round(avgMood)}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Avg mood</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(183,148,246,0.2)]"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Entries</h3>
          
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.slice(0, 5).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{
                    boxShadow: '0 0 30px rgba(147, 51, 234, 0.5)',
                    scale: 1.01
                  }}
                  className="backdrop-blur-sm bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMoodEmoji(entry.sentiment)}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(entry.created_at)}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="p-1 rounded-lg hover:bg-white/10">
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 rounded-lg hover:bg-red-50/10">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">{entry.content}</p>
                  {entry.sentiment?.summary && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-purple-100/20 dark:bg-purple-900/20 border border-purple-200/30 dark:border-purple-700/30">
                      <p className="text-sm italic text-purple-700 dark:text-purple-300">
                        AI Insight: {entry.sentiment.summary}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No entries yet</p>
              <p className="text-sm">Start writing your first entry above!</p>
            </div>
          )}
        </motion.div>

        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg hover:shadow-xl flex items-center justify-center z-50"
          onClick={() => textareaRef.current?.focus()}
        >
          <Plus className="h-6 w-6 text-white" />
        </motion.button>
      </main>
    </div>
  )
}
