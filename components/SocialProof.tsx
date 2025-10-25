'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

interface TestimonialProps {
  name: string
  role: string
  university: string
  content: string
  rating: number
  avatar?: string
}

export function TestimonialCard({ name, role, university, content, rating, avatar }: TestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300"
    >
      <div className="flex items-center mb-4">
        <Quote className="h-8 w-8 text-purple-500 mr-3" />
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Star 
                className={`h-5 w-5 ${
                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`} 
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg leading-relaxed">
        "{content}"
      </p>
      
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg mr-4">
          {name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{role}</div>
          <div className="text-sm text-purple-600 dark:text-purple-400">{university}</div>
        </div>
      </div>
    </motion.div>
  )
}

export function TestimonialCarousel() {
  const testimonials: TestimonialProps[] = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      university: "Ohio State University",
      content: "MindMate AI has completely transformed how I understand my emotions. The AI insights are surprisingly accurate and help me process difficult days. It's like having a personal therapist available 24/7.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Psychology Major",
      university: "University of Cincinnati",
      content: "As someone studying mental health, I'm impressed by the sophistication of the mood analysis. The privacy features give me confidence to be completely honest in my entries.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Graduate Student",
      university: "Case Western Reserve",
      content: "The progress tracking has been incredible. I can actually see my emotional growth over time, which motivates me to keep journaling. The interface is beautiful and intuitive.",
      rating: 5
    },
    {
      name: "David Kim",
      role: "Engineering Student",
      university: "Miami University",
      content: "I was skeptical about AI-powered journaling, but MindMate AI proved me wrong. The insights are thoughtful and the mood charts help me identify patterns I never noticed before.",
      rating: 5
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [testimonials.length])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
      >
        <TestimonialCard {...testimonials[currentIndex]} />
      </motion.div>

      {/* Navigation buttons */}
      <button
        onClick={prevTestimonial}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 hover:bg-white/30 transition-all duration-300"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>
      
      <button
        onClick={nextTestimonial}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 backdrop-blur-xl bg-white/20 border border-white/30 rounded-full p-2 hover:bg-white/30 transition-all duration-300"
      >
        <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-purple-500 w-8' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function StatsCounter() {
  const stats = [
    { label: "Students from 50+ Universities", value: "50+", suffix: "" },
    { label: "Report improved self-awareness", value: "93", suffix: "%" },
    { label: "Average mood improvement", value: "2.4", suffix: "x" },
    { label: "Entries analyzed daily", value: "10K", suffix: "+" }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
        >
          <motion.div
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent mb-2"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            {stat.value}{stat.suffix}
          </motion.div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function SocialProof() {
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
            Trusted by{' '}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Students Everywhere
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join thousands of students who have transformed their mental wellness journey with MindMate AI.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="mb-16">
          <TestimonialCarousel />
        </div>

        {/* Stats */}
        <StatsCounter />
      </div>
    </section>
  )
}
