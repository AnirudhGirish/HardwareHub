'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertOctagon } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#6B6B6B] mb-8">
              A critical error occurred. Please try again or contact your administrator if the problem persists.
            </p>
            <Button onClick={() => reset()}>Try again</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
