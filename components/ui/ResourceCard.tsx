'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

export type ExploreResource = {
  id: string
  name: string
  status: string
  type: string
  serial_number: string | null
  permanent_owner_id: string | null
  teams: { name: string; departments: { name: string } } | null
}

interface ResourceCardProps {
  resource: ExploreResource
  currentUserId: string
  pendingRequestId: string | null
}

export function ResourceCard({ resource, currentUserId, pendingRequestId }: ResourceCardProps) {
  const router = useRouter()
  const [requestOpen, setRequestOpen] = useState(false)
  const [days, setDays] = useState('7')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [isHoveringCancel, setIsHoveringCancel] = useState(false)

  const isOwner = resource.permanent_owner_id === currentUserId
  const canRequest =
    resource.status === 'free' &&
    !isOwner &&
    !pendingRequestId &&
    resource.permanent_owner_id !== null

  async function handleRequest(e: React.MouseEvent) {
    e.preventDefault()
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

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    if (!pendingRequestId) return
    
    setCanceling(true)
    try {
      const res = await fetch(`/api/requests/${pendingRequestId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to cancel request')
      
      toast.success('Request cancelled')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <>
      <Link
        href={`/resources/${resource.id}`}
        className="bg-white border border-[#E5E5E5] rounded-lg p-5 hover:border-[#ABABAB] transition-colors flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-medium text-[#0A0A0A] text-sm leading-tight">{resource.name}</h2>
            <Badge variant={resource.status as any}>
              {resource.status === 'on_loan' ? 'On loan' : resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-3">
            <Badge variant={resource.type as any}>{resource.type}</Badge>
            {resource.serial_number && <span className="font-mono">{resource.serial_number}</span>}
          </div>
          {resource.teams && (
            <p className="text-xs text-[#9B9B9B] mb-4">{resource.teams.departments?.name} · {resource.teams.name}</p>
          )}
        </div>

        <div className="flex items-center justify-end mt-2 h-8">
          {pendingRequestId ? (
            <Button
              size="sm"
              variant={isHoveringCancel ? 'danger' : 'secondary'}
              className="w-[100px] transition-colors"
              onMouseEnter={() => setIsHoveringCancel(true)}
              onMouseLeave={() => setIsHoveringCancel(false)}
              onClick={handleCancel}
              loading={canceling}
            >
              {canceling ? 'Canceling' : (isHoveringCancel ? 'Cancel' : 'Requested')}
            </Button>
          ) : canRequest ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setRequestOpen(true)
              }}
            >
              Request
            </Button>
          ) : null}
        </div>
      </Link>

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={`Request "${resource.name}"`}>
        <div className="space-y-4">
          <Input
            label="Duration (days)"
            type="number"
            id={`days-${resource.id}`}
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`msg-${resource.id}`} className="text-sm font-medium text-[#0A0A0A]">Message (optional)</label>
            <textarea
              id={`msg-${resource.id}`}
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
    </>
  )
}
