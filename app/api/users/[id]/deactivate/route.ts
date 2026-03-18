import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deactivateUserSchema } from '@/lib/schemas/user'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user: actor } } = await supabase.auth.getUser()
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', actor.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Typed confirmation
    const body = await request.json()
    const parsed = deactivateUserSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Type DEACTIVATE to confirm' }, { status: 400 })

    const { data: targetUser } = await supabase.from('users').select('id, full_name, status').eq('id', id).single()
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (targetUser.status === 'deactivated') return NextResponse.json({ error: 'User already deactivated' }, { status: 409 })

    // Force-return all active loans
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('id, resource_id')
      .eq('borrower_id', id)
      .in('status', ['active', 'overdue'])

    for (const loan of activeLoans ?? []) {
      await supabase.from('loans').update({ status: 'returned', returned_at: new Date().toISOString() }).eq('id', loan.id)
      await supabase.from('resources').update({ status: 'free' }).eq('id', loan.resource_id)
    }

    // Reassign owned resources to admin
    await supabase.from('resources').update({ permanent_owner_id: actor.id }).eq('permanent_owner_id', id).is('deleted_at', null)

    // Cancel all pending requests by this user
    await supabase.from('requests').update({ status: 'cancelled', resolved_at: new Date().toISOString() }).eq('requester_id', id).eq('status', 'pending')

    // Deactivate user
    await supabase.from('users').update({ status: 'deactivated' }).eq('id', id)

    await writeAuditLog(supabase, {
      actor_id: actor.id, action: 'DEACTIVATE_USER', entity_type: 'user', entity_id: id,
      metadata: { full_name: targetUser.full_name, active_loans_returned: activeLoans?.length ?? 0 },
      ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ message: `User "${targetUser.full_name}" deactivated` })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
