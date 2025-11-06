'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Brain, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './landing-styles.css'

// Import our new glassmorphic components
import { HeroSection } from '@/components/HeroSection'
import { FeatureCards } from '@/components/FeatureCards'
import { HowItWorks } from '@/components/HowItWorks'
import { SocialProof } from '@/components/SocialProof'
import { DemoPreview } from '@/components/DemoPreview'

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Removed automatic redirect - let users see the beautiful landing page first
  // Users can manually navigate to sign-in or sign-up when they're ready

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="launch-background"></div>
      
      {/* Original animated background mesh (keeping for compatibility) */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='a' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23B794F6' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%23B794F6' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23a)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const left = ((i * 7) % 100) + (i * 3) % 20
          const top = ((i * 11) % 100) + (i * 5) % 15
          const duration = 10 + (i % 10)
          const delay = (i % 5) * 0.5
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, 50, -50, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
              }}
            />
          )
        })}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="launch-foreground relative z-50 backdrop-blur-xl bg-white/10 border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3"
              >
                <Brain className="h-6 w-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                MindMate AI
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                How It Works
              </Link>
              <Link href="#demo" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                Demo
              </Link>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
                  Sign In
                </Button>
              </Link>
                      <Link href="/sign-up">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-black text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                            Get Started
                          </Button>
                        </motion.div>
                      </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/20 backdrop-blur-xl bg-white/10"
            >
              <div className="px-4 py-4 space-y-4">
                <Link href="#features" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                  Features
                </Link>
                <Link href="#how-it-works" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                  How It Works
                </Link>
                <Link href="#demo" className="block text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
                  Demo
                </Link>
                <div className="flex flex-col space-y-2 pt-4 border-t border-white/20">
                  <Link href="/sign-in">
                    <Button variant="ghost" className="w-full text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400">
                      Sign In
                    </Button>
                  </Link>
                          <Link href="/sign-up">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-black text-white border-0 rounded-xl transition-all duration-300 hover:scale-110">
                              Get Started
                            </Button>
                          </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="launch-foreground relative z-10">
        <HeroSection />
        <div id="features">
          <FeatureCards />
        </div>
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <SocialProof />
        <div id="demo">
          <DemoPreview />
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="launch-foreground relative z-10 backdrop-blur-xl bg-white/10 border-t border-white/20 py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3"
              >
                <Brain className="h-7 w-7 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                MindMate AI
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Your AI-Powered Mental Wellness Companion. Transform your thoughts into insights and track your emotional journey with cutting-edge technology.
            </p>

            {/* Final CTA */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mb-8"
                    >
                      <Link href="/sign-up">
                        <Button
                          size="lg"
                          className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-black text-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                        >
                          Start Your Mental Wellness Journey Today
                        </Button>
                      </Link>
                    </motion.div>

            {/* Disclaimer */}
            <div className="max-w-2xl mx-auto">
              <div className="backdrop-blur-xl bg-yellow-50/20 dark:bg-yellow-900/20 border border-yellow-200/30 dark:border-yellow-800/30 rounded-2xl p-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Disclaimer:</strong> AI can be wrong. Do not use as medical advice. 
                  This tool is for personal reflection and should not replace professional mental health support.
                </p>
              </div>
            </div>

            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              © 2024 MindMate AI. Built for HACK/OHIO. All rights reserved.
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}