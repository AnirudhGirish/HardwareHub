'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeTracker() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to multiple relevant tables for the current user's interactions
    const channel = supabase.channel('realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
