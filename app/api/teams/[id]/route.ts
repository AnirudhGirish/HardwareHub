import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateTeamSchema } from '@/lib/schemas/team'
import { writeAuditLog } from '@/lib/utils/auditLog'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = updateTeamSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase.from('teams').update(parsed.data).eq('id', id).is('deleted_at', null).select().single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Team name already exists in this department' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
    }

    await writeAuditLog(supabase, { actor_id: user.id, action: 'UPDATE_TEAM', entity_type: 'team', entity_id: id, metadata: parsed.data, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { count } = await supabase.from('resources').select('id', { count: 'exact', head: true }).eq('team_id', id).is('deleted_at', null)
    if (count && count > 0) return NextResponse.json({ error: 'Cannot delete team with active resources' }, { status: 409 })

    await supabase.from('teams').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    await writeAuditLog(supabase, { actor_id: user.id, action: 'DELETE_TEAM', entity_type: 'team', entity_id: id, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ message: 'Team deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
