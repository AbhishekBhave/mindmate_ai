import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/server/supabase/server-client'
import { supabaseAdmin } from '@/server/supabase/admin'

/**
 * Health check endpoint to verify dashboard connectivity
 * Verifies session, counts entries, returns first entry id if present
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await getServerSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Count entries for this user
    const countResult = await supabaseAdmin
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countResult.error) {
      console.error('[HEALTH] Error counting entries:', countResult.error)
      return NextResponse.json(
        { ok: false, error: 'Failed to count entries', details: countResult.error.message },
        { status: 500 }
      )
    }

    const count = countResult.count || 0

    // Get first entry id if any exist
    let sampleEntryId = null
    if (count > 0) {
      const firstEntry = await supabaseAdmin
        .from('entries')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (firstEntry.data) {
        sampleEntryId = firstEntry.data.id
      }
    }

    return NextResponse.json({
      ok: true,
      userId,
      count,
      sampleEntryId,
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('[HEALTH] Dashboard health check error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

