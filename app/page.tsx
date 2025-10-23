'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Brain, Heart } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const userId = localStorage.getItem('userId')
    if (userId) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                MindMate AI
              </h1>
            </div>
            <div className="space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Your Personal Journal Companion
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Transform your thoughts into insights with AI-powered journaling. 
              Track your mood, get gentle reflections, and understand your emotional patterns.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/sign-up">
                <Button size="lg" className="px-8">
                  Start Journaling
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get gentle summaries and reflection suggestions for your entries
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Mood Tracking</CardTitle>
                <CardDescription>
                  Visualize your emotional journey with beautiful mood charts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Personal & Private</CardTitle>
                <CardDescription>
                  Your thoughts are yours alone - secure and confidential
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Disclaimer */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Disclaimer:</strong> AI can be wrong. Do not use as medical advice. 
                This tool is for personal reflection and should not replace professional mental health support.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}