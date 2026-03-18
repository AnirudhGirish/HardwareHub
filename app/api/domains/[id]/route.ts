import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: domain } = await supabase.from('allowed_domains').select('domain').eq('id', id).single()
    if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

    await supabase.from('allowed_domains').delete().eq('id', id)
    await writeAuditLog(supabase, { actor_id: user.id, action: 'DELETE_DOMAIN', entity_type: 'domain', entity_id: id, metadata: { domain: domain.domain }, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ message: 'Domain removed' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
