import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'

type AuditLogPayload = {
  actor_id: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  metadata?: Json | null
  ip_address?: string | null
  user_agent?: string | null
}

/**
 * Appends an entry to the audit_log table.
 * Audit log is append-only — this function never updates or deletes.
 */
export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  payload: AuditLogPayload
): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: payload.actor_id,
    action: payload.action,
    entity_type: payload.entity_type,
    entity_id: payload.entity_id ?? null,
    metadata: payload.metadata ?? null,
    ip_address: payload.ip_address ?? null,
    user_agent: payload.user_agent ?? null,
  })

  if (error) {
    // Log to console but do not surface to client — audit failures must not break business logic
    console.error('[AuditLog] Failed to write entry:', error.message)
  }
}
