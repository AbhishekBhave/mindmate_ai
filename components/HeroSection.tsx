'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Brain, Sparkles } from 'lucide-react'

interface GlowingTitleProps {
  children: React.ReactNode
  className?: string
}

export function GlowingTitle({ children, className = '' }: GlowingTitleProps) {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 bg-clip-text text-transparent ${className}`}
      style={{
        textShadow: '0 0 30px rgba(183, 148, 246, 0.5)',
        filter: 'drop-shadow(0 0 20px rgba(183, 148, 246, 0.3))'
      }}
    >
      {children}
    </motion.h1>
  )
}

interface TypingEffectProps {
  text: string
  speed?: number
  className?: string
}

export function TypingEffect({ text, speed = 100, className = '' }: TypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className={`text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed ${className}`}
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-purple-500"
      >
        |
      </motion.span>
    </motion.p>
  )
}

interface CTAButtonsProps {
  className?: string
}

export function CTAButtons({ className = '' }: CTAButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      className={`flex flex-col sm:flex-row justify-center items-center gap-4 ${className}`}
    >
      <Link href="/sign-up">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          <Button
            size="lg"
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:bg-black text-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-20 blur-xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </Link>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        <Button
          variant="outline"
          size="lg"
          className="px-8 py-4 text-lg font-semibold bg-white border-2 border-purple-600 text-purple-600 hover:bg-black hover:text-white rounded-2xl transition-all duration-300 hover:scale-110"
        >
          <Play className="mr-2 h-5 w-5" />
          Watch Demo
        </Button>
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-10 blur-xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  )
}

export function BackgroundElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
      {/* Neural Network Pattern */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239F7AEA' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3Cpath d='M30 30h30v30H30z' stroke='%239F7AEA' stroke-opacity='0.1' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Gradient Orbs */}
      {[...Array(6)].map((_, i) => {
        // Use deterministic positioning based on index to avoid hydration mismatch
        const left = ((i * 13) % 100) + (i * 7) % 30
        const top = ((i * 17) % 100) + (i * 11) % 25
        
        return (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-400/20 to-indigo-500/20 blur-xl"
            style={{
              left: `${left}%`,
              top: `${top}%`,
            }}
            animate={{
              x: [0, 100, -100, 0],
              y: [0, -100, 100, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )
      })}

      {/* Brain Synapses */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(183, 148, 246, 0.7)',
            '0 0 0 20px rgba(183, 148, 246, 0)',
            '0 0 0 0 rgba(183, 148, 246, 0)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-2 h-2 bg-indigo-400 rounded-full"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(99, 102, 241, 0.7)',
            '0 0 0 20px rgba(99, 102, 241, 0)',
            '0 0 0 0 rgba(99, 102, 241, 0)',
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: 0.5,
        }}
      />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundElements />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Logo with pulse animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_0_30px_rgba(183,148,246,0.3)]"
          >
            <Brain className="h-10 w-10 text-purple-500" />
          </motion.div>
        </motion.div>

        <GlowingTitle className="mb-6">
          MindMate AI
        </GlowingTitle>

        <TypingEffect 
          text="Your AI-Powered Mental Wellness Companion" 
          speed={80}
        />

        <CTAButtons />

        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            // Use deterministic positioning based on index to avoid hydration mismatch
            const left = ((i * 19) % 100) + (i * 3) % 15
            const top = ((i * 23) % 100) + (i * 7) % 20
            const delay = (i % 10) * 0.2
            
            return (
              <motion.div
                key={i}
                className="absolute text-purple-400/30"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay,
                }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
