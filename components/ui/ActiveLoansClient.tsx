'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { isOverdue } from '@/lib/utils/formatDate'

export type LoanRowClient = {
  id: string
  created_at: string
  start_date: string
  end_date: string
  status: string
  resources: {
    id: string
    name: string
    type: string
  }
}

interface ActiveLoansClientProps {
  initialLoans: LoanRowClient[]
}

export function ActiveLoansClient({ initialLoans }: ActiveLoansClientProps) {
  const router = useRouter()
  const [returningId, setReturningId] = useState<string | null>(null)

  async function handleReturn(id: string) {
    setReturningId(id)
    const res = await fetch(`/api/loans/${id}/return`, { method: 'PATCH' })
    const json = await res.json()
    setReturningId(null)
    
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to return resource')
      return
    }
    
    toast.success('Resource returned successfully!')
    router.refresh()
  }

  if (initialLoans.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#9B9B9B] bg-slate-50 rounded-xl border border-dashed border-slate-200">
        You don't have any active loans right now.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-slate-100 bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
      {initialLoans.map((loan) => {
        const overdue = isOverdue(loan.end_date, null)
        return (
          <li key={loan.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-sm font-medium text-[#0A0A0A] truncate">
                  {loan.resources.name}
                </p>
                <Badge variant={overdue ? 'overdue' : 'on_loan'}>
                  {overdue ? 'Overdue' : 'On loan'}
                </Badge>
                <Badge variant={loan.resources.type as 'hardware' | 'licence'}>
                  {loan.resources.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                <span>Borrowed on {new Date(loan.start_date).toLocaleDateString('en-IN')}</span>
                <span>&bull;</span>
                <span className={overdue ? 'text-red-600 font-medium' : ''}>
                  Due {new Date(loan.end_date).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
            
            <div className="shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReturn(loan.id)}
                loading={returningId === loan.id}
                disabled={returningId !== null && returningId !== loan.id}
              >
                Return Resource
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
