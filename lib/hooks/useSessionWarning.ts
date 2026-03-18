'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const WARNING_THRESHOLD_SECONDS = 5 * 60 // 5 minutes

export function useSessionWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let intervalId: ReturnType<typeof setInterval>

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const expiresAt = session.expires_at
      if (!expiresAt) return

      const nowSeconds = Math.floor(Date.now() / 1000)
      const remaining = expiresAt - nowSeconds

      if (remaining <= WARNING_THRESHOLD_SECONDS && remaining > 0) {
        setSecondsLeft(remaining)
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }

    checkSession()
    intervalId = setInterval(checkSession, 30000)

    return () => clearInterval(intervalId)
  }, [])

  return { showWarning, secondsLeft }
}
