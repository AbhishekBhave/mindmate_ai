import { getServerSupabase } from '@/server/supabase/server-client'
import type { NextRequest } from 'next/server'
import type { ApiResponse, Post } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || 'all'
    const sort = searchParams.get('sort') || 'hot'

    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(*),
        pseudonym:pseudonyms(*)
      `)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'pending'])

    // Filter by category
    if (category !== 'all') {
      query = query.eq('category_id', category)
    }

    // Apply sorting
    switch (sort) {
      case 'hot':
        query = query.order('score', { ascending: false })
        break
      case 'new':
        query = query.order('created_at', { ascending: false })
        break
      case 'top':
        query = query.order('reaction_count', { ascending: false })
        break
      case 'rising':
        // Rising posts are recent posts with high interaction
        query = query
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('reply_count', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching posts:', error)
      return Response.json({
        ok: false,
        error: 'Failed to fetch posts'
      } as ApiResponse)
    }

    return Response.json({
      ok: true,
      data: data || []
    } as ApiResponse<Post[]>)
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
    
    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (err) {
      console.error('Error parsing request body:', err)
      return Response.json({
        ok: false,
        error: 'Invalid request body'
      } as ApiResponse, { status: 400 })
    }
    
    const { category_id, title, content, content_warnings, mood_tags } = body

    // Validate required fields
    if (!category_id || !title || !content) {
      return Response.json({
        ok: false,
        error: 'Missing required fields: category_id, title, and content are required'
      } as ApiResponse, { status: 400 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return Response.json({
        ok: false,
        error: 'Unauthorized - Please sign in to post'
      } as ApiResponse, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    // Check if user has pseudonym (get any existing one, regardless of category)
    let existingPseudonym = null
    let pseudonymLookupError = null
    
    // Try to get existing pseudonym
    const { data, error } = await supabase
      .from('pseudonyms')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (error) {
      // If error is "relation does not exist" (42P01), the table doesn't exist yet
      if (error.code === '42P01') {
        console.error('pseudonyms table does not exist. Please run: supabase/create-pseudonyms-table.sql')
        return Response.json({
          ok: false,
          error: 'Database table missing. Please contact support.'
        } as ApiResponse, { status: 500 })
      }
      
      pseudonymLookupError = error
      console.error('Error looking up pseudonym:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      existingPseudonym = data
    }

    let pseudonym = existingPseudonym

    // Create pseudonym if it doesn't exist (without category_id)
    if (!pseudonym && !pseudonymLookupError) {
      console.log('Creating new pseudonym for user:', user.id)
      const result = await generateAndInsertPseudonym(supabase, user.id, null)
      
      // Check if result has an error property (from fallback failure)
      if (!result || (result as any).error) {
        const error = result && (result as any).error
        console.error('Failed to create pseudonym. Last error:', error)
        
        let errorMessage = 'Failed to create anonymous identity. '
        if (error) {
          if (error.code === '42P01') {
            errorMessage += 'The pseudonyms table does not exist. Please run supabase/create-pseudonyms-table.sql in Supabase.'
          } else if (error.code === '42501') {
            errorMessage += 'Permission denied. Check RLS policies.'
          } else if (error.code === '42703') {
            errorMessage += 'Column does not exist. Check database schema.'
          } else {
            errorMessage += `Database error: ${error.message}`
          }
        } else {
          errorMessage += 'Please check your database connection and ensure the pseudonyms table exists.'
        }
        
        return Response.json({
          ok: false,
          error: errorMessage
        } as ApiResponse, { status: 500 })
      }
      pseudonym = result
    } else if (pseudonymLookupError) {
      return Response.json({
        ok: false,
        error: `Database error: ${pseudonymLookupError.message}`
      } as ApiResponse, { status: 500 })
    } else if (!pseudonym) {
      return Response.json({
        ok: false,
        error: 'Could not create or retrieve pseudonym'
      } as ApiResponse, { status: 500 })
    }

    console.log('Using pseudonym:', pseudonym?.id)

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        category_id,
        pseudonym_id: pseudonym.id,
        title,
        content,
        content_warnings: content_warnings || [],
        mood_tags: mood_tags || [],
        moderation_status: 'pending'
      })
      .select(`
        *,
        category:categories(*),
        pseudonym:pseudonyms(*)
      `)
      .single()

    if (postError) {
      console.error('Error creating post:', {
        code: postError.code,
        message: postError.message,
        details: postError.details,
        hint: postError.hint
      })
      return Response.json({
        ok: false,
        error: postError.message || 'Failed to create post'
      } as ApiResponse, { status: 500 })
    }

    console.log('Post created successfully:', post.id)

    return Response.json({
      ok: true,
      data: post
    } as ApiResponse<Post>)
  } catch (error: any) {
    console.error('Unexpected error in POST handler:', {
      error,
      message: error?.message,
      stack: error?.stack
    })
    return Response.json({
      ok: false,
      error: error?.message || 'An unexpected error occurred'
    } as ApiResponse, { status: 500 })
  }
}

// Helper function to generate and insert pseudonym
async function generateAndInsertPseudonym(supabase: any, userId: string, categoryId: string | null) {
  const adjectives = [
    'Gentle', 'Calm', 'Kind', 'Bright', 'Peaceful', 'Tranquil', 'Serene', 'Warm', 
    'Hopeful', 'Brave', 'Quiet', 'Soft', 'Clear', 'Pure', 'Safe', 'Secure',
    'Understanding', 'Caring', 'Supportive', 'Encouraging', 'Thoughtful', 'Wise'
  ]

  const nouns = [
    'Cloud', 'Ocean', 'Mountain', 'River', 'Star', 'Moon', 'Sun', 'Breeze', 
    'Wave', 'Forest', 'Meadow', 'Lighthouse', 'Shelter', 'Harbor', 'Garden',
    'Reflection', 'Path', 'Journey', 'Light', 'Dawn', 'Dusk', 'Hope'
  ]

  const colors = [
    '#B794F6', '#9F7AEA', '#805AD5', '#6366F1', '#8B5CF6', '#A78BFA',
    '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF', '#EDE9FE'
  ]

  let attempts = 0
  let pseudonym = null
  let lastError = null

  while (attempts < 10 && !pseudonym) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(1000 + Math.random() * 9000)
    const username = `${adj}${noun}${num}`
    const color = colors[Math.floor(Math.random() * colors.length)]

    // Build insert object without category_id to avoid column errors
    const insertData: any = {
      user_id: userId,
      anonymous_username: username,
      color_accent: color
    }

    const { data, error } = await supabase
      .from('pseudonyms')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      lastError = error
      console.error(`Attempt ${attempts + 1} failed to create pseudonym:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // If it's a unique constraint violation (duplicate username), try again
      if (error.code === '23505') {
        console.log('Username collision, trying again with new name...')
      } else if (error.code === '42501') {
        // RLS policy violation
        console.error('RLS policy blocked insert:', error)
        break
      } else if (error.code === '42P01') {
        // Table doesn't exist
        console.error('TABLE MISSING: pseudonyms table does not exist')
        break
      } else {
        console.error('Non-recoverable error during pseudonym creation:', error)
        // Continue to fallback
      }
    } else if (data) {
      pseudonym = data
      console.log('Successfully created pseudonym:', pseudonym.id)
      break
    }

    attempts++
  }

  if (!pseudonym) {
    console.log('All attempts failed, trying fallback pseudonym creation...')
    // Fallback - without category_id
    const fallbackData: any = {
      user_id: userId,
      anonymous_username: `Anonymous${Math.floor(Math.random() * 10000)}`,
      color_accent: '#B794F6'
    }

    const { data: fallbackResult, error: fallbackError } = await supabase
      .from('pseudonyms')
      .insert(fallbackData)
      .select()
      .single()
    
    if (fallbackError) {
      console.error('Fallback pseudonym creation also failed:', {
        code: fallbackError.code,
        message: fallbackError.message,
        details: fallbackError.details,
        hint: fallbackError.hint
      })
      
      // Return error info for better debugging
      return { error: fallbackError }
    }
    
    return fallbackResult
  }

  return pseudonym
}

