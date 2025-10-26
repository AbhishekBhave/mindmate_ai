import { getServerSupabase } from '@/server/supabase/server-client'
import type { NextRequest } from 'next/server'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({
        ok: false,
        error: 'Unauthorized'
      } as ApiResponse, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category')

    let query = supabase
      .from('pseudonyms')
      .select('*')
      .eq('user_id', user.id)

    if (categoryId && categoryId !== 'null') {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Error fetching pseudonym:', error)
      return Response.json({
        ok: false,
        error: 'Failed to fetch pseudonym'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data: data
    } as ApiResponse)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({
        ok: false,
        error: 'Unauthorized'
      } as ApiResponse, { status: 401 })
    }

    const body = await request.json()
    const { category_id } = body

    // Generate pseudonym
    const adjectives = [
      'Gentle', 'Calm', 'Kind', 'Bright', 'Peaceful', 'Tranquil', 'Serene', 'Warm'
    ]
    const nouns = ['Cloud', 'Ocean', 'Mountain', 'River', 'Star', 'Moon', 'Sun']
    const colors = ['#B794F6', '#9F7AEA', '#805AD5', '#6366F1', '#8B5CF6', '#A78BFA']

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    const username = `${adj}${noun}${num}`
    const color = colors[Math.floor(Math.random() * colors.length)]

    const { data, error } = await supabase
      .from('pseudonyms')
      .insert({
        user_id: user.id,
        category_id,
        anonymous_username: username,
        color_accent: color
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pseudonym:', error)
      return Response.json({
        ok: false,
        error: 'Failed to create pseudonym'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data
    } as ApiResponse)
  } catch (error) {
    console.error('Unexpected error:', error)
    return Response.json({
      ok: false,
      error: 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

