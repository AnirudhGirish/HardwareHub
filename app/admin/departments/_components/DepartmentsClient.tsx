'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ToastContainer, toast } from '@/components/ui/Toast'

type DepartmentRow = { id: string; name: string; teamCount: number }

export default function DepartmentsClient({ initialDepartments }: { initialDepartments: DepartmentRow[] }) {
  const router = useRouter()
  const [departments, setDepartments] = useState(initialDepartments)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<DepartmentRow | null>(null)
  
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditingDept(null)
    setName('')
    setModalOpen(true)
  }

  function openEdit(dept: DepartmentRow) {
    setEditingDept(dept)
    setName(dept.name)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const isEdit = !!editingDept
    const url = isEdit ? `/api/departments/${editingDept.id}` : '/api/departments'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
        toast.error(json.error ?? 'Failed to save department')
        return
    }

    toast.success(isEdit ? 'Department updated' : 'Department created')
    setModalOpen(false)
    router.refresh()
    // Optimistic local update
    if (isEdit) {
        setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, name } : d))
    } else {
        setDepartments(prev => [...prev, { ...json.data, teamCount: 0 }].sort((a,b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/departments/${deleteId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
        toast.error(json.error ?? 'Failed to delete department')
        setDeleteId(null)
        return
    }
    toast.success('Department deleted')
    setDepartments(prev => prev.filter(d => d.id !== deleteId))
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Departments</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Manage top-level organizational units.</p>
        </div>
        <Button onClick={openCreate}>Add department</Button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Name</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B] w-24">Teams</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B] text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {departments.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#9B9B9B]">No departments found.</td>
                </tr>
            ) : departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 font-medium text-[#0A0A0A]">{dept.name}</td>
                <td className="px-6 py-4 text-[#6B6B6B]">{dept.teamCount}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openEdit(dept)} className="text-[#6B6B6B] hover:text-[#0A0A0A]">Edit</button>
                  <button onClick={() => setDeleteId(dept.id)} className="text-[#991B1B] hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDept ? 'Edit department' : 'New department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button loading={submitting} type="submit">{editingDept ? 'Save changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete department?"
        description="Are you sure you want to delete this department? Any teams under it will also be soft-deleted. This action cannot be reversed from the UI."
        confirmText="Delete department"
      />
    </div>
  )
}
