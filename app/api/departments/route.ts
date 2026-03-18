import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDepartmentSchema } from '@/lib/schemas/department'
import { writeAuditLog } from '@/lib/utils/auditLog'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: depts } = await supabase
      .from('departments')
      .select('id, name, created_at')
      .is('deleted_at', null)
      .order('name')

    if (depts === null) return NextResponse.json({ data: [] })

    // Count teams per department
    const { data: teamCounts } = await supabase
      .from('teams')
      .select('department_id')
      .is('deleted_at', null)

    const countMap: Record<string, number> = {}
    teamCounts?.forEach((t) => {
      countMap[t.department_id] = (countMap[t.department_id] ?? 0) + 1
    })

    return NextResponse.json({
      data: (depts ?? []).map((d) => ({ ...d, team_count: countMap[d.id] ?? 0 })),
    })
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
    const parsed = createDepartmentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { data, error } = await supabase
      .from('departments')
      .insert({ name: parsed.data.name })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Department name already exists' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }

    await writeAuditLog(supabase, {
      actor_id: user.id, action: 'CREATE_DEPARTMENT', entity_type: 'department',
      entity_id: data.id, metadata: { name: parsed.data.name },
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
