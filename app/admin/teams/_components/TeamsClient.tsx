'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToastContainer, toast } from '@/components/ui/Toast'

type Department = { id: string; name: string }

type TeamRow = {
  id: string
  name: string
  department_id: string
  department_name: string
  resource_count: number
  member_count: number
}

export default function TeamsClient({ 
  initialTeams, 
  departments 
}: { 
  initialTeams: TeamRow[] 
  departments: Department[]
}) {
  const router = useRouter()
  const [teams, setTeams] = useState(initialTeams)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null)
  
  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditingTeam(null)
    setName('')
    setDepartmentId(departments[0]?.id ?? '')
    setModalOpen(true)
  }

  function openEdit(team: TeamRow) {
    setEditingTeam(team)
    setName(team.name)
    setDepartmentId(team.department_id)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const isEdit = !!editingTeam
    const url = isEdit ? `/api/teams/${editingTeam.id}` : '/api/teams'
    const method = isEdit ? 'PATCH' : 'POST'

    const body = isEdit 
      ? { name, department_id: departmentId }
      : { name, department_id: departmentId }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      toast.error(json.error ?? 'Failed to save team')
      return
    }

    toast.success(isEdit ? 'Team updated' : 'Team created')
    setModalOpen(false)
    router.refresh()

    // Optimistic local update
    if (isEdit) {
      const dept = departments.find(d => d.id === departmentId)
      setTeams(prev => prev.map(t => 
        t.id === editingTeam.id 
          ? { ...t, name, department_id: departmentId, department_name: dept?.name ?? t.department_name }
          : t
      ))
    } else {
      const dept = departments.find(d => d.id === departmentId)
      const newTeam: TeamRow = {
        id: json.data.id,
        name: json.data.name,
        department_id: json.data.department_id,
        department_name: dept?.name ?? 'Unknown',
        resource_count: 0,
        member_count: 0,
      }
      setTeams(prev => [...prev, newTeam].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/teams/${deleteId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to delete team')
      setDeleteId(null)
      return
    }
    toast.success('Team deleted')
    setTeams(prev => prev.filter(t => t.id !== deleteId))
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[#6B6B6B] mt-1">Teams belong to departments and contain resources and users.</p>
        </div>
        <Button onClick={openCreate} disabled={departments.length === 0}>
          Add team
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-8 text-center">
          <p className="text-[#6B6B6B] mb-4">No departments exist yet.</p>
          <p className="text-sm text-[#9B9B9B]">Create departments first to add teams.</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-8 text-center">
          <p className="text-[#6B6B6B] mb-4">No teams found.</p>
          <Button onClick={openCreate}>Add your first team</Button>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E5] rounded-lg">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <th className="px-6 py-3 font-medium text-[#6B6B6B]">Name</th>
                <th className="px-6 py-3 font-medium text-[#6B6B6B]">Department</th>
                <th className="px-6 py-3 font-medium text-[#6B6B6B] w-24 text-right">Resources</th>
                <th className="px-6 py-3 font-medium text-[#6B6B6B] w-24 text-right">Members</th>
                <th className="px-6 py-3 font-medium text-[#6B6B6B] text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#0A0A0A]">{team.name}</td>
                  <td className="px-6 py-4 text-[#6B6B6B]">{team.department_name}</td>
                  <td className="px-6 py-4 text-right text-[#6B6B6B]">{team.resource_count}</td>
                  <td className="px-6 py-4 text-right text-[#6B6B6B]">{team.member_count}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => openEdit(team)} 
                      className="text-[#6B6B6B] hover:text-[#0A0A0A]"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setDeleteId(team.id)} 
                      className="text-[#991B1B] hover:text-red-800"
                      disabled={team.resource_count > 0 || team.member_count > 0}
                      title={team.resource_count > 0 || team.member_count > 0 ? 'Cannot delete team with resources or members' : 'Delete'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editingTeam ? 'Edit team' : 'New team'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Team name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="e.g., Embedded Systems"
          />
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="department_id" className="text-sm font-medium text-[#0A0A0A]">
              Department
            </label>
            <select
              id="department_id"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
              className="h-10 w-full rounded-md border border-[#D1D1D1] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button loading={submitting} type="submit">
              {editingTeam ? 'Save changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete team?"
        description="Are you sure you want to delete this team? This will not delete any resources or users, but they will need to be reassigned. This action cannot be undone."
        confirmText="Delete team"
      />

      <ToastContainer />
    </div>
  )
}
