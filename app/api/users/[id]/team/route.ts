import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reassignTeamSchema } from '@/lib/schemas/user'
import { writeAuditLog } from '@/lib/utils/auditLog'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user: actor } } = await supabase.auth.getUser()
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: actorProfile } = await supabase.from('users').select('role').eq('id', actor.id).single()
    if (actorProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = reassignTeamSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { department_id, team_id } = parsed.data
    const { data: team } = await supabase.from('teams').select('id, department_id').eq('id', team_id).is('deleted_at', null).single()
    if (!team || team.department_id !== department_id) return NextResponse.json({ error: 'Team does not belong to this department' }, { status: 400 })

    await supabase.from('users').update({ department_id, team_id }).eq('id', id)
    await writeAuditLog(supabase, { actor_id: actor.id, action: 'REASSIGN_USER_TEAM', entity_type: 'user', entity_id: id, metadata: { department_id, team_id }, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ message: 'Team reassigned' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
