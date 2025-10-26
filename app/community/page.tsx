import { requireAuth } from '@/lib/auth'
import CommunityClient from './community-client'

export default async function CommunityPage() {
  const { user } = await requireAuth()
  
  return <CommunityClient user={user} />
}

export const dynamic = 'force-dynamic'

