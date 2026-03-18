'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="text-center max-w-sm flex flex-col items-center bg-white border border-[#E5E5E5] rounded-lg p-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-[#0A0A0A] mb-2">Unexpected error</h2>
        <p className="text-sm text-[#6B6B6B] mb-6">
          An error occurred while rendering this page.
        </p>
        <Button onClick={() => reset()} className="w-full">Try again</Button>
      </div>
    </div>
  )
}
