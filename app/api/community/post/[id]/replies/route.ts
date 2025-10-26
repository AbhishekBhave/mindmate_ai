import { getServerSupabase } from '@/server/supabase/server-client'
import type { NextRequest } from 'next/server'
import type { ApiResponse, Reply } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getServerSupabase()
    
    const { data, error } = await supabase
      .from('replies')
      .select(`
        *,
        pseudonym:pseudonyms(*)
      `)
      .eq('post_id', id)
      .eq('is_deleted', false)
      .eq('moderation_status', 'approved')
      .order('is_mark_as_helpful', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching replies:', error)
      return Response.json({
        ok: false,
        error: 'Failed to fetch replies'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data: data || []
    } as ApiResponse<Reply[]>)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getServerSupabase()
    const body = await request.json()
    const { content, parent_reply_id } = body

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({
        ok: false,
        error: 'Unauthorized'
      } as ApiResponse, { status: 401 })
    }

    // Get pseudonym (users may have multiple pseudonyms per category, so get any one)
    const { data: pseudonymList } = await supabase
      .from('pseudonyms')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    let pseudonym = pseudonymList?.[0]

    if (!pseudonym) {
      // Create a pseudonym for this user
      const adjectives = ['Gentle', 'Calm', 'Kind', 'Bright', 'Peaceful', 'Tranquil', 'Serene']
      const nouns = ['Cloud', 'Ocean', 'Mountain', 'River', 'Star', 'Moon', 'Sun']
      const colors = ['#B794F6', '#9F7AEA', '#805AD5', '#6366F1']

      let attempts = 0
      let created = false

      while (attempts < 10 && !created) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
        const noun = nouns[Math.floor(Math.random() * nouns.length)]
        const num = Math.floor(1000 + Math.random() * 9000)
        const username = `${adj}${noun}${num}`
        const color = colors[Math.floor(Math.random() * colors.length)]

        const { data: newPseudonym, error: pseudoError } = await supabase
          .from('pseudonyms')
          .insert({
            user_id: user.id,
            category_id: null,
            anonymous_username: username,
            color_accent: color
          })
          .select()
          .single()

        if (!pseudoError && newPseudonym) {
          pseudonym = newPseudonym
          created = true
        }

        attempts++
      }

      if (!pseudonym) {
        return Response.json({
          ok: false,
          error: 'Failed to create anonymous identity'
        } as ApiResponse)
      }
    }

    // Create the reply
    const { data: reply, error } = await supabase
      .from('replies')
      .insert({
        post_id: id,
        parent_reply_id: parent_reply_id || null,
        pseudonym_id: pseudonym.id,
        content,
        depth: parent_reply_id ? 1 : 0
      })
      .select(`
        *,
        pseudonym:pseudonyms(*)
      `)
      .single()

    if (error) {
      console.error('Error creating reply:', error)
      return Response.json({
        ok: false,
        error: 'Failed to create reply'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data: reply
    } as ApiResponse<Reply>)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

