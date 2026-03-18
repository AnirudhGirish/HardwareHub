import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateResourceSchema, deleteResourceSchema } from '@/lib/schemas/resource'
import { sanitise } from '@/lib/utils/sanitise'
import { writeAuditLog } from '@/lib/utils/auditLog'
import type { Json } from '@/lib/supabase/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: resource, error } = await supabase
      .from('resources')
      .select(`*, teams(id, name, departments(id, name)), users!resources_permanent_owner_id_fkey(id, full_name, email)`)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

    const { data: activeLoan } = await supabase
      .from('loans')
      .select(`*, users!loans_borrower_id_fkey(id, full_name)`)
      .eq('resource_id', id)
      .eq('status', 'active')
      .single()

    const { data: loanHistory } = await supabase
      .from('loans')
      .select(`*, users!loans_borrower_id_fkey(id, full_name)`)
      .eq('resource_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ data: { ...resource, activeLoan, loanHistory: loanHistory ?? [] } })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = updateResourceSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const cleanData: Record<string, unknown> = { ...parsed.data }
    if (cleanData.name) cleanData.name = sanitise(cleanData.name as string)
    if (cleanData.description) cleanData.description = sanitise(cleanData.description as string)
    if ('serial_number' in cleanData) cleanData.serial_number = cleanData.serial_number || null

    const { data, error } = await supabase.from('resources').update(cleanData).eq('id', id).is('deleted_at', null).select().single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Serial number already exists' }, { status: 409 })
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
    }

    await writeAuditLog(supabase, { actor_id: user.id, action: 'UPDATE_RESOURCE', entity_type: 'resource', entity_id: id, metadata: cleanData as unknown as Json, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
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

    const body = await request.json()
    const parsed = deleteResourceSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 })

    const { data: resource } = await supabase.from('resources').select('status').eq('id', id).is('deleted_at', null).single()
    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    if (resource.status !== 'free') return NextResponse.json({ error: 'Cannot delete a resource that is currently on loan' }, { status: 409 })

    await supabase.from('resources').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    await writeAuditLog(supabase, { actor_id: user.id, action: 'DELETE_RESOURCE', entity_type: 'resource', entity_id: id, ip_address: request.headers.get('x-forwarded-for'), user_agent: request.headers.get('user-agent') })
    return NextResponse.json({ message: 'Resource deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
