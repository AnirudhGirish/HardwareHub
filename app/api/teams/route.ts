import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTeamSchema } from '@/lib/schemas/team'
import { writeAuditLog } from '@/lib/utils/auditLog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('department_id')

    let query = supabase.from('teams').select('id, name, department_id, created_at').is('deleted_at', null).order('name')
    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })

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
    const parsed = createTeamSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase.from('teams').insert(parsed.data).select().single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Team name already exists in this department' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
    }

    await writeAuditLog(supabase, {
      actor_id: user.id, action: 'CREATE_TEAM', entity_type: 'team', entity_id: data.id,
      metadata: parsed.data, ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
