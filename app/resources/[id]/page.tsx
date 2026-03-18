import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatDate'
import ResourceActions from './_components/ResourceActions'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('resources').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Resource' }
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: resource } = await supabase
    .from('resources')
    .select(`*, teams(name, departments(name)), users!resources_permanent_owner_id_fkey(id, full_name, email)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!resource) notFound()

  const [loanRes, historyRes, hasPendingReqRes, myLoanRes, myProfileRes] = await Promise.all([
    supabase.from('loans').select('*, users!loans_borrower_id_fkey(id, full_name)').eq('resource_id', id).eq('status', 'active').maybeSingle(),
    supabase.from('loans').select('*, users!loans_borrower_id_fkey(id, full_name)').eq('resource_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('requests').select('id').eq('resource_id', id).eq('requester_id', user.id).eq('status', 'pending').maybeSingle(),
    supabase.from('loans').select('id').eq('resource_id', id).eq('borrower_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).single(),
  ])

  const activeLoan = loanRes.data
  const loanHistory = historyRes.data ?? []
  const hasPendingRequest = !!hasPendingReqRes.data
  const myActiveLoan = myLoanRes.data
  const isAdmin = myProfileRes.data?.role === 'admin'
  const owner = (resource as unknown as { users: { id: string; full_name: string; email: string } | null }).users
  const isOwner = owner?.id === user.id
  const team = (resource as unknown as { teams: { name: string; departments: { name: string } } | null }).teams

  return (
    <PageWrapper>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Badge variant={resource.type as 'hardware' | 'licence'}>{resource.type}</Badge>
              <Badge variant={resource.status as 'free' | 'on_loan' | 'maintenance' | 'retired'}>
                {resource.status === 'on_loan' ? 'On loan' : resource.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">{resource.name}</h1>
            {resource.serial_number && (
              <p className="text-sm font-mono text-[#6B6B6B] mt-1">{resource.serial_number}</p>
            )}
          </div>
          <ResourceActions
            resource={resource as { id: string; name: string; status: string; permanent_owner_id: string | null }}
            currentUserId={user.id}
            isAdmin={isAdmin}
            isOwner={isOwner}
            hasPendingRequest={hasPendingRequest}
            myActiveLoanId={myActiveLoan?.id ?? null}
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-lg p-6">
            <h2 className="font-medium text-[#0A0A0A] mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              {resource.description && (
                <div>
                  <dt className="text-[#9B9B9B] mb-0.5">Description</dt>
                  <dd className="text-[#0A0A0A]">{resource.description}</dd>
                </div>
              )}
              {team && (
                <div className="flex gap-8">
                  <div>
                    <dt className="text-[#9B9B9B] mb-0.5">Department</dt>
                    <dd className="text-[#0A0A0A]">{team.departments?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[#9B9B9B] mb-0.5">Team</dt>
                    <dd className="text-[#0A0A0A]">{team.name}</dd>
                  </div>
                </div>
              )}
              {owner && (
                <div>
                  <dt className="text-[#9B9B9B] mb-0.5">Owner</dt>
                  <dd className="text-[#0A0A0A]">{owner.full_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-[#9B9B9B] mb-0.5">Added</dt>
                <dd className="text-[#0A0A0A]">{formatDate(resource.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Current loan */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg p-6">
            <h2 className="font-medium text-[#0A0A0A] mb-4">Current loan</h2>
            {activeLoan ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#9B9B9B] mb-0.5">Borrower</dt>
                  <dd className="text-[#0A0A0A]">{((activeLoan as unknown as { users: { full_name: string } | null }).users)?.full_name}</dd>
                </div>
                <div>
                  <dt className="text-[#9B9B9B] mb-0.5">Due date</dt>
                  <dd className="text-[#0A0A0A]">{formatDate(activeLoan.end_date)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[#9B9B9B]">Not currently on loan</p>
            )}
          </div>
        </div>

        {/* Loan history */}
        <div className="bg-white border border-[#E5E5E5] rounded-lg">
          <div className="px-6 py-4 border-b border-[#E5E5E5]">
            <h2 className="font-medium text-[#0A0A0A]">Loan history</h2>
          </div>
          {loanHistory.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[#9B9B9B]">No loan history</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">Borrower</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9B9B9B] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F4]">
                  {loanHistory.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-6 py-4 text-[#0A0A0A]">{((loan as unknown as { users: { full_name: string } | null }).users)?.full_name}</td>
                      <td className="px-6 py-4 text-[#6B6B6B]">{formatDate(loan.start_date)}</td>
                      <td className="px-6 py-4 text-[#6B6B6B]">{formatDate(loan.end_date)}</td>
                      <td className="px-6 py-4"><Badge variant={loan.status as 'active' | 'returned' | 'overdue'}>{loan.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
