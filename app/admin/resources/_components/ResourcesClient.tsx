'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import type { Database } from '@/lib/supabase/types'

type BaseResource = Database['public']['Tables']['resources']['Row']
type ResourceRow = BaseResource & { department_name?: string; team_name?: string; owner_name?: string }

type DepartmentOption = { id: string; name: string }
type TeamOption = { id: string; name: string; department_id: string }
type UserOption = { id: string; full_name: string; email: string; team_id: string | null; department_id: string | null }

export default function ResourcesClient({
  initialResources,
  departments,
  teams,
  users
}: {
  initialResources: ResourceRow[]
  departments: DepartmentOption[]
  teams: TeamOption[]
  users: UserOption[]
}) {
  const router = useRouter()
  const [resources, setResources] = useState(initialResources)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceRow | null>(null)
  
  const [name, setName] = useState('')
  const [type, setType] = useState('hardware')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('free')
  const [serialNumber, setSerialNumber] = useState('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [teamId, setTeamId] = useState<string>('')
  const [permanentOwnerId, setPermanentOwnerId] = useState<string>('')
  
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditingResource(null)
    setName('')
    setType('hardware')
    setDescription('')
    setStatus('free')
    setSerialNumber('')
    setDepartmentId('')
    setTeamId('')
    setModalOpen(true)
  }

  function openEdit(res: ResourceRow) {
    setEditingResource(res)
    setName(res.name)
    setType(res.type)
    setDescription(res.description ?? '')
    setStatus(res.status)
    setSerialNumber(res.serial_number ?? '')
    const resourceTeam = teams.find(t => t.id === res.team_id)
    setDepartmentId(resourceTeam?.department_id ?? '')
    setTeamId(res.team_id ?? '')
    setPermanentOwnerId(res.permanent_owner_id ?? '')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const isEdit = !!editingResource
    const url = isEdit ? `/api/resources/${editingResource.id}` : '/api/resources'
    const method = isEdit ? 'PATCH' : 'POST'

    const payload = {
      name,
      type,
      description: description || undefined,
      status,
      serial_number: serialNumber || undefined,
      department_id: departmentId || undefined,
      team_id: teamId || undefined,
      permanent_owner_id: permanentOwnerId || undefined,
    }

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
        toast.error(json.error ?? 'Failed to save resource')
        return
    }

    toast.success(isEdit ? 'Resource updated' : 'Resource created')
    setModalOpen(false)
    router.refresh()
    
    const deptName = departments.find(d => d.id === departmentId)?.name
    const teamName = teams.find(t => t.id === teamId)?.name
    const ownerName = users.find(u => u.id === permanentOwnerId)?.full_name
    
    if (isEdit) {
        setResources(prev => prev.map(r => r.id === editingResource.id ? { ...r, ...payload, team_id: teamId || null, permanent_owner_id: permanentOwnerId || null, department_name: deptName, team_name: teamName, owner_name: ownerName } as ResourceRow : r))
    } else {
        setResources(prev => [{ ...json.data, department_name: deptName, team_name: teamName, owner_name: ownerName }, ...prev])
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/resources/${deleteId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
        toast.error(json.error ?? 'Failed to delete resource')
        setDeleteId(null)
        return
    }
    toast.success('Resource deleted')
    setResources(prev => prev.filter(r => r.id !== deleteId))
    setDeleteId(null)
    router.refresh()
  }

  // Filter teams by selected department
  const availableTeams = departmentId ? teams.filter(t => t.department_id === departmentId) : teams
  
  // Filter users by selected team or department
  const availableUsers = users.filter((u) => {
    if (teamId) return u.team_id === teamId
    if (departmentId) return u.department_id === departmentId
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Resources</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Manage all hardware and software licences.</p>
        </div>
        <Button onClick={openCreate}>Add resource</Button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Name</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Type</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Status</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Owner</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Team</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B] text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {resources.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#9B9B9B]">No resources found.</td>
                </tr>
            ) : resources.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 font-medium text-[#0A0A0A]">
                    <a href={`/resources/${r.id}`} className="hover:underline">{r.name}</a>
                </td>
                <td className="px-6 py-4 text-[#6B6B6B] capitalize">{r.type}</td>
                <td className="px-6 py-4">
                  <Badge variant={r.status === 'on_loan' ? 'on_loan' : 'free'}>
                    {r.status === 'on_loan' ? 'On Loan' : r.status === 'free' ? 'Free' : r.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-[#6B6B6B]">
                    {r.owner_name || 'None'}
                </td>
                <td className="px-6 py-4 text-[#6B6B6B]">
                    {r.team_name || 'None'}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openEdit(r)} className="text-[#6B6B6B] hover:text-[#0A0A0A]">Edit</button>
                  <button onClick={() => setDeleteId(r.id)} className="text-[#991B1B] hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingResource ? 'Edit resource' : 'New resource'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Serial Number / Licence Key" placeholder="e.g. SN-12345" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
          
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none">
                    <option value="hardware">Hardware</option>
                    <option value="licence">Licence</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none">
                    <option value="free">Free (Available)</option>
                    <option value="on_loan">On Loan (In Use)</option>
                </select>
              </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#0A0A0A]">Description (optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm text-[#0A0A0A] resize-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>

          <div className="border-t border-[#E5E5E5] pt-4 grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">Department Owner</label>
                <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setTeamId('') }} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none">
                    <option value="">None (Global)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0A0A0A]">Team Owner</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={!departmentId} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none disabled:bg-[#FAFAFA] disabled:text-[#9B9B9B]">
                    <option value="">None</option>
                    {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 mt-2">
                <label className="text-sm font-medium text-[#0A0A0A]">Permanent Owner</label>
                <select value={permanentOwnerId} onChange={(e) => setPermanentOwnerId(e.target.value)} className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#1A1A1A] outline-none">
                    <option value="">None</option>
                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                </select>
                <p className="text-xs text-[#6B6B6B]">Assigning a permanent owner displays this resource in their dashboard and lets users request it from them.</p>
              </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button loading={submitting} type="submit">{editingResource ? 'Save changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete resource?"
        description="Are you sure you want to delete this resource? Any active loans will be orphaned. This action cannot be reversed from the UI."
        confirmText="Delete resource"
      />
    </div>
  )
}
