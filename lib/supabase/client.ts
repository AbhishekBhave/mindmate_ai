import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase configuration for browser components
// These are safe to expose as they're public keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
