'use client'

import { useSessionWarning } from '@/lib/hooks/useSessionWarning'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SessionWarning() {
  const { showWarning, secondsLeft } = useSessionWarning()
  const router = useRouter()

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  async function handleRefresh() {
    const supabase = createClient()
    await supabase.auth.refreshSession()
    router.refresh()
  }

  if (!showWarning) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-4 z-50 max-w-sm bg-[#FEF9EC] border border-amber-200 rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-[#92610A] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#92610A]">Session expiring soon</p>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Your session will expire in{' '}
            {minutes > 0 ? `${minutes}m ` : ''}
            {seconds}s. Refresh to continue.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefresh}
            className="mt-3"
          >
            Refresh session
          </Button>
        </div>
      </div>
    </div>
  )
}
