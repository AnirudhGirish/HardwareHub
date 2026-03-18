import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDomainSchema } from '@/lib/schemas/domain'
import { writeAuditLog } from '@/lib/utils/auditLog'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabase.from('allowed_domains').select('*').order('domain')
    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = addDomainSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase.from('allowed_domains').insert({ domain: parsed.data.domain.toLowerCase() }).select().single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
    }

    await writeAuditLog(supabase, { actor_id: user.id, action: 'ADD_DOMAIN', entity_type: 'domain', entity_id: data.id, metadata: { domain: parsed.data.domain }, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
