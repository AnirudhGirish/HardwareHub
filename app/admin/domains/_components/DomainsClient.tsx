'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import type { Database } from '@/lib/supabase/types'

type DomainRow = Database['public']['Tables']['allowed_domains']['Row']

export default function DomainsClient({ initialDomains }: { initialDomains: DomainRow[] }) {
  const router = useRouter()
  const [domains, setDomains] = useState(initialDomains)
  const [modalOpen, setModalOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openCreate() {
    setDomain('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
    })
    
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
        toast.error(json.error ?? 'Failed to add domain')
        return
    }

    toast.success('Domain added successfully')
    setModalOpen(false)
    router.refresh()
    setDomains(prev => [...prev, json.data].sort((a,b) => a.domain.localeCompare(b.domain)))
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/domains/${deleteId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
        toast.error(json.error ?? 'Failed to delete domain')
        setDeleteId(null)
        return
    }
    toast.success('Domain removed')
    setDomains(prev => prev.filter(d => d.id !== deleteId))
    setDeleteId(null)
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Allowed Domains</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Restrict registration to specific email domains.</p>
        </div>
        <Button onClick={openCreate}>Add domain</Button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-lg max-w-3xl">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Domain</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B]">Added At</th>
              <th className="px-6 py-3 font-medium text-[#6B6B6B] text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {domains.length === 0 ? (
                <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#9B9B9B]">No domains specified. Anyone can register.</td>
                </tr>
            ) : domains.map((d) => (
              <tr key={d.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-6 py-4 font-medium text-[#0A0A0A]">{d.domain}</td>
                <td className="px-6 py-4 text-[#6B6B6B]">
                    {new Date(d.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setDeleteId(d.id)} className="text-[#991B1B] hover:text-red-800">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add permitted domain">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Domain" 
            placeholder="e.g. mbrdi.co.in" 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)} 
            required 
            pattern="^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            title="Please enter a valid domain name (e.g. mbrdi.co.in)"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button loading={submitting} type="submit">Add Domain</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove domain?"
        description="Are you sure you want to remove this domain? Existing users with this domain will not be deleted, but new users will not be able to register."
        confirmText="Remove domain"
      />
    </div>
  )
}
