import { requireAuth } from '@/lib/auth'
import PostClient from './post-client'

export default async function PostPage({ params }: { params: { id: string } }) {
  const { user } = await requireAuth()
  
  return <PostClient user={user} postId={params.id} />
}

export const dynamic = 'force-dynamic'

