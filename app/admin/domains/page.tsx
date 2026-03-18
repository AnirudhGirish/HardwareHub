import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DomainsClient from './_components/DomainsClient'

export const metadata: Metadata = { title: 'Admin — Allowed Domains' }

export default async function AdminDomainsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const { data: domains } = await supabase
    .from('allowed_domains')
    .select('*')
    .order('domain')

  return (
    <div>
      <DomainsClient initialDomains={domains ?? []} />
    </div>
  )
}
