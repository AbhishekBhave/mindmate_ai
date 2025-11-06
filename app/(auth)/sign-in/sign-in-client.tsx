'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { signInSchema, type SignInFormData } from '@/lib/validations/auth'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, Brain, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function SignInClient() {
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<SignInFormData>>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = signInSchema.parse(formData)
      console.log('[SIGN-IN] Attempting sign-in for:', validatedData.email)

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        console.error('[SIGN-IN] Sign-in error:', error)
        
        // Handle specific error cases
        if (error.message.includes('email_not_confirmed')) {
          setShowEmailConfirmation(true)
          toast.error('Please check your email and click the confirmation link')
          return
        }
        
        if (error.message.includes('invalid_credentials')) {
          toast.error('Invalid email or password')
          return
        }
        
        if (error.message.includes('rate_limit_exceeded')) {
          toast.error('Too many attempts. Please try again later')
          return
        }
        
        toast.error(`Sign in failed: ${error.message}`)
        return
      }

      if (data.session) {
        console.log('[SIGN-IN] Session created successfully')
        
        // Verify session is accessible
        const { data: sessionCheck } = await supabase.auth.getSession()
        console.log('[SIGN-IN] Session verification:', { 
          hasSession: !!sessionCheck.session,
          userId: sessionCheck.session?.user?.id 
        })
        
        toast.success('Welcome back!')
        
        // Use window.location.href for full page reload to ensure server-side
        // can read the session cookies. This is more reliable than router.push()
        // which may navigate before cookies are synchronized.
        window.location.href = '/dashboard'
      } else {
        console.error('[SIGN-IN] No session in response')
        toast.error('Sign in failed. Please try again.')
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        // Handle validation errors
        const zodError = error as any
        const fieldErrors: Partial<SignInFormData> = {}
        zodError.errors.forEach((err: any) => {
          fieldErrors[err.path[0] as keyof SignInFormData] = err.message
        })
        setErrors(fieldErrors)
        toast.error('Please fix the form errors')
      } else {
        console.error('[SIGN-IN] Unexpected error:', error)
        toast.error('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address first')
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      })

      if (error) {
        toast.error(`Failed to resend confirmation: ${error.message}`)
      } else {
        toast.success('Confirmation email sent! Check your inbox.')
      }
    } catch (error) {
      console.error('Resend confirmation error:', error)
      toast.error('Failed to resend confirmation email')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 relative overflow-hidden">
      {/* Animated background mesh */}
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

      {/* Floating particles with glowing effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const left = ((i * 7) % 100) + (i * 3) % 20
          const top = ((i * 11) % 100) + (i * 5) % 15
          const duration = 8 + (i % 10)
          const delay = (i % 5) * 0.3
          const glowDuration = 2 + (i % 3)
          
          return (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-purple-400 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, 50, -50, 0],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
                boxShadow: [
                  '0 0 0px rgba(183, 148, 246, 0.3)',
                  '0 0 20px rgba(183, 148, 246, 0.8)',
                  '0 0 0px rgba(183, 148, 246, 0.3)',
                ],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
                boxShadow: {
                  duration: glowDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            />
          )
        })}
      </div>

      {/* Brain silhouette in background */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        animate={{
          opacity: [0.05, 0.08, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Brain 
          className="w-[600px] h-[600px] text-purple-400/20"
          strokeWidth={0.5}
        />
      </motion.div>

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

      {/* Back to Home Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-6 left-6 z-50"
      >
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Back to Home</span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8"
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
              className="inline-flex items-center justify-center w-16 h-16 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_0_30px_rgba(183,148,246,0.3)] mb-4"
            >
              <Brain className="h-8 w-8 text-purple-500" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              MindMate AI
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Welcome back to your journaling journey</p>
          </motion.div>

          {/* Sign In Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(183,148,246,0.3)] hover:shadow-[0_0_60px_rgba(183,148,246,0.4)] transition-all duration-300"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h2>
              <p className="text-gray-600 dark:text-gray-300">Continue your mental wellness journey</p>
            </div>

            {showEmailConfirmation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <Alert className="backdrop-blur-xl bg-yellow-50/20 dark:bg-yellow-900/20 border-yellow-200/30 dark:border-yellow-800/30">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Please check your email and click the confirmation link to activate your account.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto ml-1 text-purple-500 hover:text-purple-400"
                      onClick={handleResendConfirmation}
                    >
                      Resend confirmation email
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                  className={`backdrop-blur-sm bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 ${errors.email ? 'border-red-500 focus:ring-red-400/50' : ''}`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </motion.p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={`backdrop-blur-sm bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all duration-300 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-400/50' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white/5 border-white/20 rounded focus:ring-purple-400/50 focus:ring-2"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-300">
                    Remember me
                  </Label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-purple-500 hover:text-purple-400 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0 rounded-xl backdrop-blur-xl bg-white/10 border-white/20 shadow-[0_0_20px_rgba(183,148,246,0.3)] hover:shadow-[0_0_30px_rgba(183,148,246,0.5)] transition-all duration-300 py-3 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
                    />
                  ) : null}
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </motion.div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/sign-up" 
                  className="text-purple-500 hover:text-purple-400 font-medium transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}