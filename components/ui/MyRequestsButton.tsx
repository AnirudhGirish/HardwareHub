'use client'

import { useState } from 'react'
import { Modal } from './Modal'
import { Badge } from './Badge'
import { Inbox, Trash2, Clock } from 'lucide-react'
import { toast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

export type MyRequest = {
  id: string
  created_at: string
  resources: {
    name: string
    type: string
  } | null
}

export function MyRequestsButton({ initialRequests = [] }: { initialRequests?: MyRequest[] }) {
  const [open, setOpen] = useState(false)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const router = useRouter()

  const pendingCount = initialRequests.length

  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this request?')) return
    
    setCancelingId(id)
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to cancel request')
      
      toast.success('Request cancelled')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[#E5E5E5] bg-white text-sm font-medium text-[#0A0A0A] hover:bg-slate-50 transition-colors shadow-sm"
      >
        <Inbox className="w-4 h-4 text-[#6B6B6B]" />
        My Requests
        {pendingCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            {pendingCount}
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="My Pending Requests">
        {initialRequests.length === 0 ? (
          <div className="py-12 text-center text-[#6B6B6B] flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-slate-400" />
            </div>
            <p>You have no pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {initialRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-lg border border-[#E5E5E5] bg-[#FAFBFD]">
                <div>
                  <h4 className="font-medium text-[#0A0A0A]">{req.resources?.name || 'Unknown Resource'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={(req.resources?.type as any) || 'hardware'} className="text-[10px] px-1.5 py-0 uppercase tracking-wider">{req.resources?.type || 'unknown'}</Badge>
                    <span className="flex items-center text-xs text-[#6B6B6B]">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(req.id)}
                  disabled={cancelingId === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {cancelingId === req.id ? 'Canceling...' : 'Cancel'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
