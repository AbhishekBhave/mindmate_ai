import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const details = {
      supabaseUrl: supabaseUrl ? new URL(supabaseUrl).hostname : 'MISSING',
      anonKeyPresent: !!supabaseAnonKey,
      cookies: {
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      }
    }
    
    const remediation = []
    
    if (!supabaseUrl) {
      remediation.push('Set NEXT_PUBLIC_SUPABASE_URL in environment variables')
    }
    
    if (!supabaseAnonKey) {
      remediation.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables')
    }
    
    // Test basic Supabase connection
    let connectionStatus = false
    try {
      const supabase = await createServerSupabaseClient()
      const { error } = await supabase.auth.getSession()
      connectionStatus = !error
    } catch (error) {
      console.error('Supabase connection test error:', error)
    }
    
    return NextResponse.json({
      ok: true,
      details: {
        ...details,
        connectionStatus,
        timestamp: new Date().toISOString()
      },
      remediation: remediation.length > 0 ? remediation : ['All checks passed']
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      ok: false,
      details: { error: 'Health check failed' },
      remediation: ['Check server logs for details']
    }, { status: 500 })
  }
}
