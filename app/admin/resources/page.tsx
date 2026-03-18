import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResourcesClient from './_components/ResourcesClient'

export const metadata: Metadata = { title: 'Admin — Resources' }

export default async function AdminResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const [resRes, deptsRes, teamsRes, usersRes] = await Promise.all([
    supabase
      .from('resources')
      .select('*, teams(id, name, departments(id, name)), users!resources_permanent_owner_id_fkey(id, full_name, email)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('departments').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('teams').select('id, name, department_id').is('deleted_at', null).order('name'),
    supabase.from('users').select('id, full_name, email, team_id, teams!left(department_id)').eq('status', 'active').order('full_name'),
  ])

  return (
    <div>
      <ResourcesClient
        initialResources={(resRes.data ?? []).map((r) => {
          const team = r.teams as { name?: string; departments?: { name?: string } } | null
          const owner = r.users as { full_name?: string } | null
          return {
            ...r,
            department_name: team?.departments?.name,
            team_name: team?.name,
            owner_name: owner?.full_name || undefined,
          }
        })}
        departments={deptsRes.data ?? []}
        teams={teamsRes.data ?? []}
        users={(usersRes.data ?? []).map(u => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          team_id: u.team_id,
          department_id: (u.teams as any)?.department_id ?? null
        }))}
      />
    </div>
  )
}
