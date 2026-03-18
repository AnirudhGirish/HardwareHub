import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserCreateResourceSchema, AdminCreateResourceSchema } from '@/lib/schemas/resource'
import { sanitise } from '@/lib/utils/sanitise'
import { writeAuditLog } from '@/lib/utils/auditLog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('team_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const ownerId = searchParams.get('owner_id')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const pageSize = 25
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('resources')
      .select(`*, teams(id, name, departments(id, name)), users!resources_permanent_owner_id_fkey(id, full_name, email)`, { count: 'exact' })
      .is('deleted_at', null)
      .order('name')
      .range(from, to)

    if (teamId) query = query.eq('team_id', teamId)
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) query = query.or(`name.ilike.%${search}%,serial_number.ilike.%${search}%`)
    if (ownerId) query = query.eq('permanent_owner_id', ownerId)

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })

    return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user profile for role and team_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, team_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 })
    }

    const body = await request.json()
    const role = profile.role as 'admin' | 'user'

    if (role === 'admin') {
      // Admin path — full schema, can set owner and team freely
      const parsed = AdminCreateResourceSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      }

      const cleanData = {
        ...parsed.data,
        name: sanitise(parsed.data.name),
        description: parsed.data.description ? sanitise(parsed.data.description) : null,
        serial_number: parsed.data.serial_number || null,
        team_id: parsed.data.team_id ?? null,
        permanent_owner_id: parsed.data.permanent_owner_id ?? null,
      }

      const { data, error } = await supabase.from('resources').insert(cleanData).select().single()
      if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'Serial number already exists in the system' }, { status: 409 })
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
      }

      await writeAuditLog(supabase, {
        actor_id: user.id,
        action: 'resource.created',
        entity_type: 'resource',
        entity_id: data.id,
        metadata: { name: cleanData.name, type: cleanData.type },
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent'),
      })

      return NextResponse.json({ data }, { status: 201 })
    } else {
      // User path — restricted schema, owner and team auto-assigned
      const parsed = UserCreateResourceSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
      }

      // Require the user to be assigned to a team
      if (!profile.team_id) {
        return NextResponse.json(
          { error: 'You must be assigned to a team before adding resources. Contact your administrator.' },
          { status: 400 }
        )
      }

      const cleanData = {
        name: sanitise(parsed.data.name),
        type: parsed.data.type,
        description: parsed.data.description ? sanitise(parsed.data.description) : null,
        serial_number: parsed.data.serial_number || null,
        // Auto-assigned — user cannot override
        permanent_owner_id: user.id,
        team_id: profile.team_id,
        status: 'free' as const,
      }

      const { data, error } = await supabase.from('resources').insert(cleanData).select().single()
      if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'Serial number already exists in the system' }, { status: 409 })
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
      }

      await writeAuditLog(supabase, {
        actor_id: user.id,
        action: 'resource.created',
        entity_type: 'resource',
        entity_id: data.id,
        metadata: {
          name: cleanData.name,
          type: cleanData.type,
          created_by: user.id,
          team_id: profile.team_id,
          auto_assigned: true,
        },
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent'),
      })

      return NextResponse.json({ data }, { status: 201 })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
