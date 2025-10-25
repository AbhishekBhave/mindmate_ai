import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SignInClient from './sign-in-client'

export default async function SignInPage() {
  // Redirect authenticated users to dashboard
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }
  
  return <SignInClient />
}