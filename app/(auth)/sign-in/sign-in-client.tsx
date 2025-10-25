'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { signInSchema, type SignInFormData } from '@/lib/validations/auth'
import { Mail, AlertCircle } from 'lucide-react'

export default function SignInClient() {
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<SignInFormData>>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
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

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (error) {
        console.error('Sign in error:', error)
        
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
        toast.success('Welcome back!')
        router.push('/dashboard')
      } else {
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
        console.error('Unexpected error:', error)
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
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">MindMate AI</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your personal journal companion</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>
            Sign in to continue your journaling journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showEmailConfirmation && (
            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email and click the confirmation link to activate your account.
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={handleResendConfirmation}
                >
                  Resend confirmation email
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                required
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}