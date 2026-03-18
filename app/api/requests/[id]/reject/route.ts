import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: req } = await supabase
      .from('requests')
      .select(`*, resources(id, name, permanent_owner_id)`)
      .eq('id', id)
      .single()

    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (req.status !== 'pending') return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })

    const resource = (req as unknown as { resources: { id: string; name: string; permanent_owner_id: string | null } }).resources
    if (!resource || resource.permanent_owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can reject requests' }, { status: 403 })
    }

    await supabase.from('requests').update({ status: 'rejected', resolved_at: new Date().toISOString() }).eq('id', id)

    await createNotifications(supabase, [{
      user_id: req.requester_id,
      type: 'request_rejected',
      title: 'Request rejected',
      body: `Your request for "${resource.name}" was not approved.`,
    }])

    await writeAuditLog(supabase, {
      actor_id: user.id, action: 'REJECT_REQUEST', entity_type: 'request', entity_id: id,
      metadata: { resource_id: resource.id },
      ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ message: 'Request rejected' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
