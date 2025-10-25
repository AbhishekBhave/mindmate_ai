'use client'

import { motion } from 'framer-motion'

export function AnimatedBackground() {
  return (
    <>
      {/* Neural Network Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
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
        {[...Array(8)].map((_, i) => {
          const left = ((i * 13) % 100) + (i * 7) % 30
          const top = ((i * 17) % 100) + (i * 11) % 25
          
          return (
            <motion.div
              key={i}
              className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-purple-400/20 to-indigo-500/20 blur-3xl"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                x: [0, 150, -150, 0],
                y: [0, -150, 150, 0],
                scale: [1, 1.3, 0.8, 1],
              }}
              transition={{
                duration: 20 + i * 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )
        })}

        {/* Pulsing Synapses */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-3 h-3 bg-purple-400 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(183, 148, 246, 0.7)',
              '0 0 0 30px rgba(183, 148, 246, 0)',
              '0 0 0 0 rgba(183, 148, 246, 0)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-3 h-3 bg-indigo-400 rounded-full"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(99, 102, 241, 0.7)',
              '0 0 0 30px rgba(99, 102, 241, 0)',
              '0 0 0 0 rgba(99, 102, 241, 0)',
            ],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: 0.5,
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const left = ((i * 7) % 100) + (i * 3) % 20
          const top = ((i * 11) % 100) + (i * 5) % 15
          const duration = 12 + (i % 12)
          const delay = (i % 6) * 0.5
          
          return (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-purple-400/30 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -150, 0],
                x: [0, 80, -80, 0],
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
    </>
  )
}

