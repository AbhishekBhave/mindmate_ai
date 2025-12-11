import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This helps debug what the client should be using
  return NextResponse.json({
    message: 'Client-side Supabase configuration',
    note: 'NEXT_PUBLIC_* variables are replaced at build time in the client bundle',
    serverSide: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + '...' : 
        'NOT SET',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 
        'NOT SET',
    },
    instructions: {
      step1: 'Stop the dev server completely (Ctrl+C)',
      step2: 'Wait 2 seconds',
      step3: 'Run: npm run dev',
      step4: 'Wait for "Ready" message',
      step5: 'Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)',
      step6: 'Check browser console for Supabase client logs'
    },
    troubleshooting: {
      issue: 'If client still shows placeholder values',
      fix: 'The client bundle was built before env vars were set. Restart dev server and hard refresh browser.'
    }
  }, {
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}

