import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user: actor } } = await supabase.auth.getUser()
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', actor.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: target } = await supabase.from('users').select('id, full_name, status').eq('id', id).single()
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.status === 'active') return NextResponse.json({ error: 'User is already active' }, { status: 409 })

    await supabase.from('users').update({ status: 'active' }).eq('id', id)
    await writeAuditLog(supabase, { actor_id: actor.id, action: 'ACTIVATE_USER', entity_type: 'user', entity_id: id, metadata: { full_name: target.full_name }, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ message: `User "${target.full_name}" activated` })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
