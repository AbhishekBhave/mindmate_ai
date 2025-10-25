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
import { signUpSchema, type SignUpFormData } from '@/lib/validations/auth'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignUpClient() {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    displayName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<SignUpFormData>>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
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
      const validatedData = signUpSchema.parse(formData)

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            display_name: validatedData.displayName || validatedData.email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        
        // Handle specific error cases
        if (error.message.includes('email_address_already_registered')) {
          toast.error('An account with this email already exists. Please sign in instead.')
          return
        }
        
        if (error.message.includes('password_too_short')) {
          toast.error('Password must be at least 6 characters long')
          return
        }
        
        if (error.message.includes('rate_limit_exceeded')) {
          toast.error('Too many attempts. Please try again later')
          return
        }
        
        toast.error(`Sign up failed: ${error.message}`)
        return
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // User is immediately confirmed (if email confirmation is disabled)
          toast.success('Account created successfully!')
          router.push('/dashboard')
        } else {
          // User needs to confirm email
          setShowEmailConfirmation(true)
          toast.success('Account created! Please check your email to confirm your account.')
        }
      } else {
        toast.error('Sign up failed. Please try again.')
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        // Handle validation errors
        const zodError = error as any
        const fieldErrors: Partial<SignUpFormData> = {}
        zodError.errors.forEach((err: any) => {
          fieldErrors[err.path[0] as keyof SignUpFormData] = err.message
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
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Sign up to start your journaling journey with AI insights
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
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Your name"
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.displayName}
                </p>
              )}
            </div>
            
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
                placeholder="Create a password"
                required
                minLength={6}
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}