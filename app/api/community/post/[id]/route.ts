import { getServerSupabase } from '@/server/supabase/server-client'
import type { NextRequest } from 'next/server'
import type { ApiResponse, Post } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getServerSupabase()
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        pseudonym:pseudonyms(*)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return Response.json({
        ok: false,
        error: 'Failed to fetch post'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data
    } as ApiResponse<Post>)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

