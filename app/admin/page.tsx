import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Users, Building2, ShieldCheck, ClipboardList, UsersRound } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin — Overview' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/forbidden')

  const [userCountRes, resourceCountRes, openRequestsRes, overdueLoansRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('resources').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
  ])

  const stats = [
    { label: 'Total users', value: userCountRes.count ?? 0 },
    { label: 'Total resources', value: resourceCountRes.count ?? 0 },
    { label: 'Pending requests', value: openRequestsRes.count ?? 0, highlight: (openRequestsRes.count ?? 0) > 0 },
    { label: 'Overdue loans', value: overdueLoansRes.count ?? 0, red: (overdueLoansRes.count ?? 0) > 0 },
  ]

  const adminLinks = [
    { href: '/admin/resources', label: 'Resources', desc: 'Add, edit, and manage hardware & licences', icon: Package },
    { href: '/admin/users', label: 'Users', desc: 'Manage users, roles, and teams', icon: Users },
    { href: '/admin/departments', label: 'Departments', desc: 'Manage organizational departments', icon: Building2 },
    { href: '/admin/teams', label: 'Teams', desc: 'Manage teams within departments', icon: UsersRound },
    { href: '/admin/domains', label: 'Allowed Domains', desc: 'Control which email domains can register', icon: ShieldCheck },
    { href: '/admin/audit', label: 'Audit Log', desc: 'Full immutable action history. Export CSV.', icon: ClipboardList },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#1A1A1A] text-white text-xs font-semibold">A</span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Admin</h1>
          <p className="text-sm text-[#6B6B6B]">Hardware Hub management console</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#FAFBFD] rounded-xl p-5 flex flex-col justify-between">
            <p className={`text-3xl font-semibold tracking-tight ${s.red ? 'text-red-600' : s.highlight ? 'text-amber-600' : 'text-[#0A0A0A]'}`}>{s.value}</p>
            <p className="text-sm font-medium text-[#6B6B6B] mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-zinc-300 transition-all flex items-start gap-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-200 transition-all">
              <link.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-[#0A0A0A] group-hover:text-zinc-900 transition-colors">{link.label}</p>
              <p className="text-sm text-[#6B6B6B] mt-1 leading-relaxed">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
