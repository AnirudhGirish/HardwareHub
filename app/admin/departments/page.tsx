import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DepartmentsClient from './_components/DepartmentsClient'
import type { Tables } from '@/lib/supabase/types'

type DepartmentWithTeams = Tables<'departments'> & {
  teams: Pick<Tables<'teams'>, 'id'>[]
}

export const metadata: Metadata = { title: 'Admin — Departments' }

export default async function AdminDepartmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const { data: rawDepartments } = await supabase
    .from('departments')
    .select('*, teams(id)')
    .is('deleted_at', null)
    .order('name')
    
  const departments = rawDepartments as DepartmentWithTeams[] | null

  return (
    <div>
      <DepartmentsClient
        initialDepartments={(departments ?? []).map((d) => ({
          ...d,
          teamCount: d.teams.length,
        }))}
      />
    </div>
  )
}
