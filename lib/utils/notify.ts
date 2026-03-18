import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createAdminClient } from '@/lib/supabase/server'

type NotificationPayload = {
  user_id: string
  type: string
  title: string
  body: string
}

/**
 * Creates a notification record for a user.
 * Fails silently — notification failures must not break business logic.
 */
export async function createNotification(
  _supabase: SupabaseClient<Database>,
  payload: NotificationPayload
): Promise<void> {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('notifications').insert({
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    read: false,
  })

  if (error) {
    console.error('[Notify] Failed to create notification:', error.message)
  }
}

/**
 * Creates notifications for multiple users at once.
 */
export async function createNotifications(
  _supabase: SupabaseClient<Database>,
  payloads: NotificationPayload[]
): Promise<void> {
  if (payloads.length === 0) return
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('notifications').insert(
    payloads.map((p) => ({ ...p, read: false }))
  )
  if (error) {
    console.error('[Notify] Failed to create notifications:', error.message)
  }
}
