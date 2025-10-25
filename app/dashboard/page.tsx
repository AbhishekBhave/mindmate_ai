import { requireAuth } from '@/lib/auth'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await requireAuth()
  
  return <DashboardClient user={session.user} />
}