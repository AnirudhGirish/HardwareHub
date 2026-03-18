import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './_components/UsersClient'
import type { Database } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Admin — Users' }

type UserRow = Database['public']['Tables']['users']['Row']
type TeamRow = Database['public']['Tables']['teams']['Row']

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const [usersRes, teamsRes] = await Promise.all([
    supabase
      .from('users')
      .select('*, teams(id, name, departments(id, name))')
      .order('full_name'),
    supabase
      .from('teams')
      .select('id, name, departments(name)')
      .is('deleted_at', null)
      .order('name')
  ])

  return (
    <div>
      <UsersClient
        initialUsers={(usersRes.data ?? []).map(u => ({
          ...u,
          team_name: (u.teams as unknown as { name?: string } | null)?.name,
          department_name: (u.teams as unknown as { departments?: { name: string } } | null)?.departments?.name
        }))}
        teams={(teamsRes.data ?? []).map(t => ({
          id: t.id,
          name: t.name,
          department_name: (t.departments as unknown as { name?: string } | null)?.name || 'Unknown'
        }))}
        currentUserId={user.id}
      />
    </div>
  )
}
