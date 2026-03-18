import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ExploreSearchForm } from '@/components/forms/ExploreSearchForm'
import { ResourceCard, type ExploreResource } from '@/components/ui/ResourceCard'
import { Inbox } from 'lucide-react'

export const metadata: Metadata = { title: 'Explore Resources' }
export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = { search?: string; type?: string; department?: string; team?: string; status?: string; page?: string }

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const search = params.search ?? ''
  const type = params.type ?? ''
  const department = params.department ?? ''
  const team = params.team ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const pageSize = 25
  const from = (page - 1) * pageSize

  let query = supabase
    .from('resources')
    .select('*, teams(name, departments(name))', { count: 'exact' })
    .is('deleted_at', null)
    .order('name')
    .range(from, from + pageSize - 1)

  if (search) query = query.or(`name.ilike.%${search}%,serial_number.ilike.%${search}%`)
  if (type) query = query.eq('type', type)
  if (team) {
    query = query.eq('team_id', team)
  } else if (department) {
    const { data: deptTeams } = await supabase.from('teams').select('id').eq('department_id', department)
    const teamIds = deptTeams?.map(t => t.id) ?? []
    if (teamIds.length > 0) {
      query = query.in('team_id', teamIds)
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Force empty match
    }
  }

  const [{ data: resources, count }, { data: pendingRequests }] = await Promise.all([
    query,
    supabase.from('requests').select('id, resource_id, created_at, resources(name, type)').eq('requester_id', user.id).eq('status', 'pending'),
  ])
  const total = count ?? 0
  const totalPages = Math.ceil(total / pageSize)
  const pendingMap = new Map(pendingRequests?.map((r) => [r.resource_id, r.id]) ?? [])

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Explore Resources</h1>
        <p className="text-sm text-[#6B6B6B] mt-1">Browse all hardware assets and software licences</p>
      </div>

      {/* Filters */}
      <ExploreSearchForm 
        initialSearch={search} 
        initialType={type} 
        initialDepartment={department} 
        initialTeam={team} 
      />

      {/* Results */}
      {resources && resources.length > 0 ? (
        <>
          <p className="text-xs text-[#9B9B9B] mb-4">{total} result{total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => {
              const res = r as unknown as ExploreResource
              return (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  currentUserId={user.id}
                  pendingRequestId={pendingMap.get(res.id) || null}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/explore?search=${search}&type=${type}&page=${page - 1}`} className="h-9 px-4 rounded-md border border-[#D1D1D1] text-sm hover:bg-[#F4F4F4] flex items-center">Previous</Link>
              )}
              <span className="text-sm text-[#6B6B6B]">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/explore?search=${search}&type=${type}&page=${page + 1}`} className="h-9 px-4 rounded-md border border-[#D1D1D1] text-sm hover:bg-[#F4F4F4] flex items-center">Next</Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24 text-[#9B9B9B] bg-[#FAFBFD] rounded-xl border border-dashed border-slate-200">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-2xl flex items-center justify-center">
              <Inbox className="w-8 h-8" />
            </div>
          </div>
          <p className="font-semibold text-lg text-[#0A0A0A]">No resources found</p>
          <p className="text-sm mt-1 max-w-sm mx-auto">Try adjusting your filters, selecting a different department or team, or searching for a different keyword.</p>
        </div>
      )}
    </PageWrapper>
  )
}
