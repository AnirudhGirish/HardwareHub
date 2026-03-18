import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: req } = await supabase.from('requests').select('id, requester_id, status, resource_id').eq('id', id).single()
    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (req.requester_id !== user.id) return NextResponse.json({ error: 'Only the requester can cancel their request' }, { status: 403 })
    if (req.status !== 'pending') return NextResponse.json({ error: 'Only pending requests can be cancelled' }, { status: 409 })

    await supabase.from('requests').update({ status: 'cancelled', resolved_at: new Date().toISOString() }).eq('id', id)

    await writeAuditLog(supabase, {
      actor_id: user.id, action: 'CANCEL_REQUEST', entity_type: 'request', entity_id: id,
      metadata: { resource_id: req.resource_id },
      ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ message: 'Request cancelled' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
