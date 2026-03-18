'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/lib/supabase/types'

type BaseUser = Database['public']['Tables']['users']['Row']
type UserRow = BaseUser & { team_name?: string; department_name?: string }

type TeamOption = { id: string; name: string; department_name: string }

export default function UsersClient({
  initialUsers,
  teams,
  currentUserId
}: {
  initialUsers: UserRow[]
  teams: TeamOption[]
  currentUserId: string
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  
  // Edit Team Modal
  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [teamId, setTeamId] = useState<string>('')
  const [submittingTeam, setSubmittingTeam] = useState(false)

  // Status Action
  const [statusActionId, setStatusActionId] = useState<string | null>(null)
  const [statusActionType, setStatusActionType] = useState<'activate' | 'deactivate' | null>(null)
  const [submittingStatus, setSubmittingStatus] = useState(false)

  function openEditTeam(user: UserRow) {
    setEditingUser(user)
    setTeamId(user.team_id ?? '')
    setEditTeamModalOpen(true)
  }

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setSubmittingTeam(true)

    const payload = teamId ? { team_id: teamId } : { team_id: null }

    const res = await fetch(`/api/users/${editingUser.id}/team`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    
    const json = await res.json()
    setSubmittingTeam(false)

    if (!res.ok) {
        toast.error(json.error ?? 'Failed to update team')
        return
    }

    toast.success('User team updated')
    setEditTeamModalOpen(false)
    router.refresh()
    
    const teamName = teams.find(t => t.id === teamId)?.name
    const deptName = teams.find(t => t.id === teamId)?.department_name
    
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, team_id: teamId || null, team_name: teamName, department_name: deptName } : u))
  }

  async function handleToggleStatus() {
    if (!statusActionId || !statusActionType) return
    setSubmittingStatus(true)
    
    const res = await fetch(`/api/users/${statusActionId}/${statusActionType}`, { method: 'POST' })
    const json = await res.json()
    setSubmittingStatus(false)
    
    if (!res.ok) {
        toast.error(json.error ?? `Failed to ${statusActionType} user`)
        setStatusActionId(null)
        setStatusActionType(null)
        return
    }
    
    toast.success(`User ${statusActionType}d`)
    const newStatus = statusActionType === 'activate' ? 'active' : 'inactive'
    setUsers(prev => prev.map(u => u.id === statusActionId ? { ...u, status: newStatus } : u))
    
    setStatusActionId(null)
    setStatusActionType(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Users</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Manage employee accounts, teams, and access.</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Name</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Email</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Role / Status</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Department / Team</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B] text-right w-44">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {users.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#9B9B9B]">No users found.</td>
                </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 font-medium text-[#0A0A0A]">{u.full_name}</td>
                <td className="px-6 py-4 text-[#6B6B6B]">{u.email}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 items-center">
                    <Badge variant={u.role === 'admin' ? 'active' : 'hardware'}>{u.role}</Badge>
                    {u.status === 'inactive' && <Badge variant="deactivated">Inactive</Badge>}
                  </div>
                </td>
                <td className="px-6 py-4 text-[#6B6B6B]">
                    {u.department_name ? `${u.department_name} · ${u.team_name}` : 'No team assigned'}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openEditTeam(u)} className="text-[#6B6B6B] hover:text-[#0A0A0A]">Change Team</button>
                  {u.id !== currentUserId && (
                    <button 
                        onClick={() => { setStatusActionId(u.id); setStatusActionType(u.status === 'active' ? 'deactivate' : 'activate') }} 
                        className={u.status === 'active' ? 'text-[#991B1B] hover:text-red-800' : 'text-[#059669] hover:text-green-800'}
                    >
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editTeamModalOpen} onClose={() => setEditTeamModalOpen(false)} title="Change User Team">
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <p className="text-sm text-[#6B6B6B]">Assigning {editingUser?.full_name} to a team determines their resource access limits.</p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0A0A0A]">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none">
                <option value="">None</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.department_name} - {t.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setEditTeamModalOpen(false)} type="button">Cancel</Button>
            <Button loading={submittingTeam} type="submit">Save changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!statusActionId}
        onClose={() => { setStatusActionId(null); setStatusActionType(null) }}
        onConfirm={handleToggleStatus}
        title={statusActionType === 'activate' ? 'Activate User?' : 'Deactivate User?'}
        description={statusActionType === 'activate' ? 'This user will regain access to log in.' : 'This will prevent the user from logging in. Active loans must be returned manually.'}
        confirmText={statusActionType === 'activate' ? 'Activate' : 'Deactivate'}
      />
    </div>
  )
}
