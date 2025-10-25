import { requireAuth } from '@/lib/auth'
import { getDashboardData } from '@/lib/dashboard-data'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  // Server-side authentication check
  const { user } = await requireAuth()
  
  // Fetch dashboard data server-side
  const dashboardData = await getDashboardData()
  
  return <DashboardClient user={user} initialData={dashboardData} />
}

// Add dynamic rendering
export const dynamic = 'force-dynamic'