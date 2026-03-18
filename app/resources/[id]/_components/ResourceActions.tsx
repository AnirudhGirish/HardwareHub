'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

interface ResourceActionsProps {
  resource: {
    id: string
    name: string
    status: string
    permanent_owner_id: string | null
  }
  currentUserId: string
  isAdmin: boolean
  isOwner: boolean
  hasPendingRequest: boolean
  myActiveLoanId: string | null
}

export default function ResourceActions({
  resource,
  currentUserId,
  isAdmin,
  isOwner,
  hasPendingRequest,
  myActiveLoanId,
}: ResourceActionsProps) {
  const router = useRouter()
  const [requestOpen, setRequestOpen] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)
  const [days, setDays] = useState('7')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canRequest =
    resource.status === 'free' &&
    !isOwner &&
    !hasPendingRequest &&
    resource.permanent_owner_id !== null

  async function handleRequest() {
    setSubmitting(true)
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resource.id, requested_duration_days: parseInt(days), message }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to send request'); return }
    toast.success('Request sent!')
    setRequestOpen(false)
    router.refresh()
  }

  async function handleReturn() {
    if (!myActiveLoanId) return
    setReturnLoading(true)
    const res = await fetch(`/api/loans/${myActiveLoanId}/return`, { method: 'PATCH' })
    const json = await res.json()
    setReturnLoading(false)
    if (!res.ok) { toast.error(json.error ?? 'Failed to return resource'); return }
    toast.success('Resource returned!')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {myActiveLoanId && (
        <Button variant="secondary" size="sm" onClick={handleReturn} loading={returnLoading}>
          Return
        </Button>
      )}
      {canRequest && (
        <Button size="sm" onClick={() => setRequestOpen(true)}>
          Request
        </Button>
      )}
      {hasPendingRequest && (
        <span className="text-xs text-[#9B9B9B] italic">Request pending</span>
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={`Request "${resource.name}"`}>
        <div className="space-y-4">
          <Input
            label="Duration (days)"
            type="number"
            id="days"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-[#0A0A0A]">Message (optional)</label>
            <textarea
              id="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Briefly explain why you need this resource…"
              maxLength={500}
              className="w-full rounded-md border border-[#D1D1D1] px-3 py-2 text-sm text-[#0A0A0A] resize-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRequest} loading={submitting}>Send request</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
