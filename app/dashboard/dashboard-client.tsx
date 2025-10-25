'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { User as UserIcon, LogOut, Moon, Sun, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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

interface ChartData {
  date: string
  mood: number
}

interface DashboardClientProps {
  user: SupabaseUser
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id)
    }
  }, [user])

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
    try {
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
        toast.success('Entry saved successfully!')
        setNewEntry('')
        fetchEntries(user.id)
      } else {
        toast.error(data.error || 'Failed to save entry')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Prepare chart data
  const chartData: ChartData[] = entries
    .filter(entry => entry.sentiment)
    .slice(0, 30) // Last 30 entries
    .map(entry => ({
      date: new Date(entry.created_at).toLocaleDateString(),
      mood: entry.sentiment!.score
    }))
    .reverse()

  const getMoodColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                MindMate AI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.email}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.id}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: New Entry */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>New Entry</CardTitle>
              <CardDescription>Share your thoughts and feelings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitEntry} className="space-y-4">
                <Textarea
                  placeholder="How are you feeling today? What's on your mind?"
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  rows={6}
                  required
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Entry'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right Panel: Mood Chart and Recent Entries */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mood Over Time</CardTitle>
                <CardDescription>Your emotional journey (last 30 entries)</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="mood" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No mood data available yet. Start writing entries to see your mood chart!
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your latest journal entries with AI insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {entries.length > 0 ? (
                  entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                        {entry.sentiment && (
                          <span className={`text-sm font-medium ${getMoodColor(entry.sentiment.label)}`}>
                            {entry.sentiment.label}
                          </span>
                        )}
                      </div>
                      <p className="text-lg mb-2">{entry.content}</p>
                      {entry.sentiment?.summary && (
                        <p className="text-sm italic text-gray-600 dark:text-gray-400">
                          AI Summary: {entry.sentiment.summary}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No entries yet. Start writing your first entry!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> AI can be wrong. Do not use as medical advice. This tool is for personal reflection and should not replace professional mental health support.
          </p>
        </div>
      </div>
    </div>
  )
}
