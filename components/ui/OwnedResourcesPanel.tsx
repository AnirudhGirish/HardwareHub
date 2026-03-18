'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Package } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { AddResourceModal } from '@/components/forms/AddResourceModal'

export type OwnedResource = {
  id: string
  name: string
  type: string
  status: string
  serial_number: string | null
  teams: { name: string } | null
}

interface OwnedResourcesPanelProps {
  initialResources: OwnedResource[]
  userId: string
}

export function OwnedResourcesPanel({ initialResources, userId }: OwnedResourcesPanelProps) {
  const [resources, setResources] = useState<OwnedResource[]>(initialResources)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setResources(initialResources)
  }, [initialResources])

  const refreshResources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resources?owner_id=${userId}`)
      const json = await res.json()
      if (res.ok) {
        setResources(json.data ?? [])
      }
    } catch {
      // Silent — the user will see stale data; next navigation will refresh
    } finally {
      setLoading(false)
    }
  }, [userId])

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4 mb-4">
        <h2 className="font-semibold text-lg text-[#0A0A0A]">What I Own</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A0A0A] bg-[#F4F4F4] hover:bg-[#E5E5E5] border border-[#E5E5E5] rounded-md px-3 h-8 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Resource
        </button>
      </div>

      {/* Resource list */}
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent" />
        </div>
      ) : resources.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-[#9B9B9B]">You don&apos;t own any resources yet.</p>
          <p className="text-xs text-[#9B9B9B] mt-0.5">Add your first one above.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-4 gap-3 group">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#0A0A0A] truncate">{r.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {r.serial_number && (
                    <span className="font-mono text-xs text-[#6B6B6B] bg-[#F4F4F4] px-1.5 py-0.5 rounded">
                      {r.serial_number}
                    </span>
                  )}
                  {r.teams?.name && (
                    <span className="text-xs text-[#9B9B9B]">{r.teams.name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={r.type as 'hardware' | 'licence'}>{r.type}</Badge>
                <Badge variant={r.status as 'free' | 'on_loan' | 'overdue'}>{r.status === 'on_loan' ? 'On loan' : 'Free'}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddResourceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshResources}
      />
    </div>
  )
}
