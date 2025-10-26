import { getServerSupabase } from '@/server/supabase/server-client'
import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return Response.json({
        ok: false,
        error: 'Failed to fetch categories'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data: data || []
    } as ApiResponse)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

