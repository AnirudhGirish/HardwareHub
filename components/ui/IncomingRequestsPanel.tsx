'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

export type IncomingRequest = {
  id: string
  created_at: string
  requested_duration_days: number
  message: string | null
  users: {
    id: string
    full_name: string
  } | null
  resources: {
    id: string
    name: string
  } | null
}

interface IncomingRequestsPanelProps {
  requests: IncomingRequest[]
}

export function IncomingRequestsPanel({ requests }: IncomingRequestsPanelProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setProcessingId(id)
    const res = await fetch(`/api/requests/${id}/approve`, { method: 'PATCH' })
    const json = await res.json()
    setProcessingId(null)
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to approve request')
      return
    }
    toast.success('Request approved! Loan created.')
    router.refresh()
  }

  async function handleReject(id: string) {
    setProcessingId(id)
    const res = await fetch(`/api/requests/${id}/reject`, { method: 'PATCH' })
    const json = await res.json()
    setProcessingId(null)
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to reject request')
      return
    }
    toast.success('Request rejected!')
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[#9B9B9B] bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No incoming requests
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {requests.map((req) => (
        <li key={req.id} className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0A0A0A] truncate">
                {req.users?.full_name} <span className="text-[#6B6B6B] font-normal">wants</span> {req.resources?.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="pending">Pending</Badge>
                <span className="text-xs text-[#6B6B6B]">{req.requested_duration_days} days</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleReject(req.id)}
                disabled={processingId !== null}
              >
                Reject
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleApprove(req.id)}
                loading={processingId === req.id}
                disabled={processingId !== null && processingId !== req.id}
              >
                Approve
              </Button>
            </div>
          </div>
          {req.message && (
            <div className="bg-[#FAFBFD] p-3 rounded-lg border border-[#F4F4F4]">
              <p className="text-xs text-[#0A0A0A] italic break-words">"{req.message}"</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
