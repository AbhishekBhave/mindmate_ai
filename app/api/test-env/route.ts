import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This endpoint helps debug environment variable loading
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 
      'NOT SET',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      'SET (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : 
      'NOT SET',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      'SET (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : 
      'NOT SET',
    openaiKey: process.env.OPENAI_API_KEY ? 
      'SET (' + process.env.OPENAI_API_KEY.substring(0, 15) + '...)' : 
      'NOT SET',
    hasPlaceholders: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || false,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder') || false,
    }
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

