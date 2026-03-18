import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRequestSchema } from '@/lib/schemas/request'
import { sanitise } from '@/lib/utils/sanitise'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let query = supabase
      .from('requests')
      .select(`*, resources(id, name, type, permanent_owner_id, users!resources_permanent_owner_id_fkey(id, full_name)), users!requests_requester_id_fkey(id, full_name, email)`)
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      // User sees: their own requests + incoming requests on their resources
      query = query.or(`requester_id.eq.${user.id},resources.permanent_owner_id.eq.${user.id}`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
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

    const body = await request.json()
    const parsed = createRequestSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { resource_id, requested_duration_days, message } = parsed.data
    const cleanMessage = message ? sanitise(message) : null

    // Verify resource is free and not owned by requester
    const { data: resource } = await supabase
      .from('resources')
      .select('id, name, status, permanent_owner_id')
      .eq('id', resource_id)
      .is('deleted_at', null)
      .single()

    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    if (resource.status !== 'free') return NextResponse.json({ error: 'Resource is not available for request' }, { status: 409 })
    if (resource.permanent_owner_id === user.id) return NextResponse.json({ error: 'Cannot request your own resource' }, { status: 400 })

    const { data: req, error } = await supabase
      .from('requests')
      .insert({ resource_id, requester_id: user.id, requested_duration_days, message: cleanMessage })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })

    // Notify resource owner
    if (resource.permanent_owner_id) {
      const { data: requester } = await supabase.from('users').select('full_name').eq('id', user.id).single()
      await createNotifications(supabase, [{
        user_id: resource.permanent_owner_id,
        type: 'request_received',
        title: 'New resource request',
        body: `${requester?.full_name ?? 'Someone'} requested "${resource.name}" for ${requested_duration_days} day(s).`,
      }])
    }

    await writeAuditLog(supabase, {
      actor_id: user.id, action: 'CREATE_REQUEST', entity_type: 'request', entity_id: req.id,
      metadata: { resource_id, requested_duration_days },
      ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ data: req }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
