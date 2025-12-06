import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase configuration for browser components
// These are safe to expose as they're public keys
// IMPORTANT: NEXT_PUBLIC_* variables are replaced at build time by Next.js
// They must be available when the app is built/started

// Get environment variables - these are replaced at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate configuration
const hasValidConfig = supabaseUrl && 
  supabaseAnonKey && 
  typeof supabaseUrl === 'string' &&
  typeof supabaseAnonKey === 'string' &&
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co')

// Log configuration status (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!hasValidConfig) {
    console.error(
      '❌ [SUPABASE CLIENT] Missing or invalid Supabase environment variables!\n' +
      'Please check your .env.local file and restart your dev server.\n' +
      'Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      `Current URL: ${supabaseUrl || 'NOT SET'}\n` +
      `Current Key: ${supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'NOT SET'}`
    )
  } else {
    console.log('✅ [SUPABASE CLIENT] Configuration valid:', {
      url: supabaseUrl.substring(0, 30) + '...',
      keyLength: supabaseAnonKey.length
    })
  }
}

// Create client with actual values - throw error if missing to prevent silent failures
if (!hasValidConfig) {
  console.error('❌ [SUPABASE CLIENT] Cannot create client - invalid configuration')
}

// Create the Supabase client
// IMPORTANT: Use actual values - if they're not set, the client will fail
// but we need to create it anyway to prevent module errors
const client = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// If config is invalid, override auth methods to show clear errors
if (!hasValidConfig) {
  const originalSignUp = client.auth.signUp.bind(client.auth)
  const originalSignIn = client.auth.signInWithPassword.bind(client.auth)
  
  client.auth.signUp = async (...args: any[]) => {
    console.error('❌ [SUPABASE] Cannot sign up - Supabase not configured!')
    console.error('Current URL:', supabaseUrl || 'NOT SET')
    console.error('Please check your .env.local file and restart the dev server.')
    throw new Error('Supabase is not configured. Check .env.local and restart dev server.')
  }
  
  client.auth.signInWithPassword = async (...args: any[]) => {
    console.error('❌ [SUPABASE] Cannot sign in - Supabase not configured!')
    console.error('Current URL:', supabaseUrl || 'NOT SET')
    console.error('Please check your .env.local file and restart the dev server.')
    throw new Error('Supabase is not configured. Check .env.local and restart dev server.')
  }
}

export const supabase = client

// Export a helper to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidConfig

// Export the URL for debugging (safe to expose - it's public)
export const getSupabaseUrl = () => supabaseUrl || null
