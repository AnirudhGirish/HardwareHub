import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Input } from '@/components/ui/Input'
import { Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, departments(name), teams(name)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const departmentName = (profile.departments as unknown as { name: string } | null)?.name ?? 'N/A'
  const teamName = (profile.teams as unknown as { name: string } | null)?.name ?? 'N/A'

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-zinc-100 text-zinc-600 flex items-center justify-center rounded-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Settings</h1>
            <p className="text-sm text-[#6B6B6B]">Manage your account preferences and profile details.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-1">Profile Details</h2>
            <p className="text-sm text-[#6B6B6B] mb-8">
              Your profile is linked to MBRDI enterprise directory. These details are read-only and can only be updated by your administrator.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Full Name</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B]">
                  {profile.full_name}
                </div>
              </div>

              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Email</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B]">
                  {profile.email}
                </div>
              </div>

              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Employee ID</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B]">
                  {profile.employee_id || 'Not assigned'}
                </div>
              </div>

              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Role</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B] capitalize">
                  {profile.role}
                </div>
              </div>

              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Department</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B]">
                  {departmentName}
                </div>
              </div>

              <div className="space-y-1.5 cursor-not-allowed">
                <label className="text-sm font-medium text-[#0A0A0A]">Team</label>
                <div className="h-10 w-full rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 flex items-center text-sm text-[#6B6B6B]">
                  {teamName}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#FAFAFA] px-6 py-4 sm:px-8 border-t border-[#E5E5E5] flex justify-end">
            <p className="text-xs text-[#9B9B9B]">Contact your admin to make changes.</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
