import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { OwnedResourcesPanel, type OwnedResource } from '@/components/ui/OwnedResourcesPanel'
import { IncomingRequestsPanel, type IncomingRequest } from '@/components/ui/IncomingRequestsPanel'
import { ActiveLoansClient, type LoanRowClient } from '@/components/ui/ActiveLoansClient'
import { isOverdue } from '@/lib/utils/formatDate'
import { Link2, Search, Inbox, AlertTriangle, Package, Clock, ShieldCheck, Server } from 'lucide-react'
import { MyRequestsButton } from '@/components/ui/MyRequestsButton'
import type { Database } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

type LoanRow = {
  id: string; end_date: string; status: string
  resources: { id: string; name: string; type: string }
}

type RequestRow = {
  id: string; requested_duration_days: number; status: string
  resources: { id: string; name: string; type: string; permanent_owner_id: string | null }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, loansRes, requestsRes, incomingRes, ownedRes] = await Promise.all([
    supabase.from('users').select('*, teams(name, departments(name))').eq('id', user.id).single(),
    supabase.from('loans').select('*, resources(id, name, type)').eq('borrower_id', user.id).in('status', ['active', 'overdue']).order('end_date'),
    supabase.from('requests').select('*, resources(id, name, type, permanent_owner_id)').eq('requester_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('requests').select('*, users!requests_requester_id_fkey(id, full_name), resources(id, name, type, permanent_owner_id)').eq('status', 'pending').in('resource_id', 
      (await supabase.from('resources').select('id').eq('permanent_owner_id', user.id).is('deleted_at', null)).data?.map((r) => r.id) ?? []
    ).order('created_at', { ascending: false }),
    supabase
      .from('resources')
      .select('id, name, type, status, serial_number, teams(name)')
      .eq('permanent_owner_id', user.id)
      .is('deleted_at', null)
      .order('name'),
  ])

  const profile = profileRes.data
  const activeLoans = (loansRes.data ?? []) as unknown as LoanRowClient[]
  const pendingRequests = (requestsRes.data ?? []) as unknown as RequestRow[]
  const incomingRequests = (incomingRes.data ?? []) as unknown as IncomingRequest[]
  const incomingCount = incomingRequests.length
  const ownedResources = (ownedRes.data ?? []) as unknown as OwnedResource[]
  const overdueLoans = activeLoans.filter((l) => isOverdue(l.end_date, null))

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {(() => {
              const t = profile?.teams as { name?: string; departments?: { name?: string } } | null
              return [t?.name, t?.departments?.name].filter(Boolean).join(' · ')
            })()}
          </p>
        </div>
        <MyRequestsButton initialRequests={pendingRequests as any} />
      </div>

      {/* Alert: overdue */}
      {overdueLoans.length > 0 && (
        <div className="mb-8 flex items-start gap-3 bg-red-50 text-red-700 rounded-xl p-4 border border-red-100">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            You have {overdueLoans.length} overdue loan{overdueLoans.length > 1 ? 's' : ''}. Please return the resource{overdueLoans.length > 1 ? 's' : ''} immediately.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Active loans', value: activeLoans.length, icon: Package },
          { label: 'Overdue', value: overdueLoans.length, red: overdueLoans.length > 0, icon: AlertTriangle },
          { label: 'My requests', value: pendingRequests.length, icon: Clock },
          { label: 'Incoming', value: incomingCount, icon: Inbox },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#FAFBFD] rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.red ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'}`}>
                <stat.icon className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className={`text-3xl font-semibold tracking-tight ${stat.red ? 'text-red-600' : 'text-[#0A0A0A]'}`}>
                {stat.value}
              </p>
              <p className="text-sm text-[#6B6B6B] font-medium mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Active loans */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-4">
            <h2 className="font-semibold text-lg text-[#0A0A0A]">Active Loans</h2>
          </div>
          <ActiveLoansClient initialLoans={activeLoans} />
        </div>

        {/* Incoming requests */}
        <div>
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-4">
            <h2 className="font-semibold text-lg text-[#0A0A0A]">Incoming Requests</h2>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden p-4 sm:p-5">
            <IncomingRequestsPanel requests={incomingRequests} />
          </div>
        </div>
      </div>

      {/* What I Own — client panel with Add Resource modal */}
      <div className="mt-10">
        <OwnedResourcesPanel initialResources={ownedResources} userId={user.id} />
      </div>
    </PageWrapper>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
