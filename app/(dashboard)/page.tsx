'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { User, LogOut, Moon, Sun, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

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

export default function DashboardPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      // For now, we'll use a simple approach
      // In production, you'd verify the session properly
      const storedUserId = localStorage.getItem('userId')
      if (!storedUserId) {
        router.push('/sign-in')
        return
      }
      setUserId(storedUserId)
      fetchEntries(storedUserId)
    }

    checkAuth()
  }, [router])

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
    if (!newEntry.trim() || !userId) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newEntry,
          userId: userId
        }),
      })

      const data = await response.json()

      if (data.ok) {
        toast.success('Entry saved successfully!')
        setNewEntry('')
        fetchEntries(userId)
      } else {
        toast.error(data.error || 'Failed to save entry')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('userId')
    router.push('/sign-in')
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
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
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
          {/* New Entry Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>New Entry</CardTitle>
                <CardDescription>
                  Share your thoughts and feelings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEntry} className="space-y-4">
                  <Textarea
                    placeholder="How are you feeling today? What's on your mind?"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  <Button type="submit" className="w-full" disabled={isLoading || !newEntry.trim()}>
                    {isLoading ? 'Saving...' : 'Save Entry'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Chart and History Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Mood Over Time</CardTitle>
                <CardDescription>
                  Your emotional journey (last 30 entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No mood data available yet. Start writing entries to see your mood chart!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>
                  Your latest journal entries with AI insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length > 0 ? (
                  <div className="space-y-4">
                    {entries.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          {entry.sentiment && (
                            <span className={`text-sm font-medium ${getMoodColor(entry.sentiment.label)}`}>
                              {entry.sentiment.label}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          {entry.content.length > 150 
                            ? `${entry.content.substring(0, 150)}...` 
                            : entry.content
                          }
                        </p>
                        {entry.sentiment?.summary && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>AI Insight:</strong> {entry.sentiment.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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

      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Disclaimer:</strong> AI can be wrong. Do not use as medical advice. 
            This tool is for personal reflection and should not replace professional mental health support.
          </p>
        </div>
      </div>
    </div>
  )
}
