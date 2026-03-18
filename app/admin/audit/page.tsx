import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditClient from './_components/AuditClient'

export const metadata: Metadata = { title: 'Admin — Audit Log' }

export default async function AdminAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <AuditClient
        initialLogs={(logs ?? []).map(l => ({
          ...l,
          actor_name: (l.users as unknown as { full_name?: string } | null)?.full_name || 'System',
          actor_email: (l.users as unknown as { email?: string } | null)?.email || ''
        }))}
      />
    </div>
  )
}
