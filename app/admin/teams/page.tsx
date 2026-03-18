import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamsClient from './_components/TeamsClient'

export const metadata: Metadata = { title: 'Admin — Teams' }

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  // Fetch departments
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  // Fetch teams with department info
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      department_id,
      created_at,
      departments!inner(id, name)
    `)
    .is('deleted_at', null)
    .order('name')

  // Get resource counts per team
  const { data: resourceCounts } = await supabase
    .from('resources')
    .select('team_id')
    .is('deleted_at', null)

  const resourceCountMap: Record<string, number> = {}
  resourceCounts?.forEach((r) => {
    if (r.team_id) {
      resourceCountMap[r.team_id] = (resourceCountMap[r.team_id] ?? 0) + 1
    }
  })

  // Get user counts per team
  const { data: userCounts } = await supabase
    .from('users')
    .select('team_id')
    .is('deleted_at', null)

  const userCountMap: Record<string, number> = {}
  userCounts?.forEach((u) => {
    if (u.team_id) {
      userCountMap[u.team_id] = (userCountMap[u.team_id] ?? 0) + 1
    }
  })

  const teamsWithCounts = (teams ?? []).map((t: unknown) => {
    const team = t as { id: string; name: string; department_id: string; departments: { name: string } }
    return {
      id: team.id,
      name: team.name,
      department_id: team.department_id,
      department_name: team.departments?.name ?? 'Unknown',
      resource_count: resourceCountMap[team.id] ?? 0,
      member_count: userCountMap[team.id] ?? 0,
    }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Teams</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Manage teams within departments.</p>
      </div>

      <TeamsClient 
        initialTeams={teamsWithCounts} 
        departments={departments ?? []} 
      />
    </div>
  )
}
