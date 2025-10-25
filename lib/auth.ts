import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    redirect('/sign-in')
  }
  
  return session
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}
