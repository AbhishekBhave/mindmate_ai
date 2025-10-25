'use client'

import { motion } from 'framer-motion'
import { PenTool, Brain, Lightbulb, BarChart3, ArrowRight } from 'lucide-react'

interface TimelineStepProps {
  step: number
  icon: React.ReactNode
  title: string
  description: string
  isActive?: boolean
}

export function TimelineStep({ step, icon, title, description, isActive = false }: TimelineStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative flex items-start space-x-4"
    >
      {/* Step number */}
      <motion.div
        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
          isActive 
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-[0_0_20px_rgba(183,148,246,0.5)]' 
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {step}
      </motion.div>

      {/* Content */}
      <div className="flex-1 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center mb-3">
          <motion.div
            className="mr-3"
            animate={isActive ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </motion.div>
  )
}

export function ProgressConnector() {
  return (
    <motion.div
      className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-indigo-600"
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      transition={{ duration: 2, delay: 0.5 }}
      viewport={{ once: true }}
    />
  )
}

export function HowItWorks() {
  const steps = [
    {
      step: 1,
      icon: <PenTool className="h-6 w-6 text-purple-600" />,
      title: "Write Your Thoughts",
      description: "Express yourself freely in our intuitive journaling interface. No pressure, no judgment - just your authentic thoughts and feelings.",
      isActive: true
    },
    {
      step: 2,
      icon: <Brain className="h-6 w-6 text-blue-600" />,
      title: "AI Analysis",
      description: "Our advanced AI analyzes your entry for sentiment, themes, and patterns. It understands context and emotional nuances to provide meaningful insights.",
      isActive: true
    },
    {
      step: 3,
      icon: <Lightbulb className="h-6 w-6 text-yellow-600" />,
      title: "Get Insights",
      description: "Receive personalized reflections, mood analysis, and gentle suggestions. Our AI helps you understand yourself better and grow.",
      isActive: true
    },
    {
      step: 4,
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      title: "Track Progress",
      description: "Visualize your emotional journey with beautiful charts and progress reports. See how you've grown and celebrate your achievements.",
      isActive: true
    }
  ]

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239F7AEA' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            How It{' '}
            <span className="bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Simple, powerful, and designed for your mental wellness journey. Here's how MindMate AI transforms your thoughts into insights.
          </p>
        </motion.div>

        <div className="relative">
          <ProgressConnector />
          
          <div className="space-y-12">
            {steps.map((step, index) => (
              <TimelineStep
                key={index}
                {...step}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-8 py-4 hover:bg-white/15 transition-all duration-300"
          >
            <span className="text-lg font-semibold text-gray-900 dark:text-white mr-3">
              Ready to start your journey?
            </span>
            <ArrowRight className="h-5 w-5 text-purple-600" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
