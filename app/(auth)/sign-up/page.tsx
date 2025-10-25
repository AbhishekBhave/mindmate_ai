import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignUpClient from './sign-up-client'

export default async function SignUpPage() {
  // Redirect authenticated users to dashboard
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }
  
  return <SignUpClient />
}