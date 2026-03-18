import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deactivateUserSchema } from '@/lib/schemas/user'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const teamId = searchParams.get('team_id')
    const search = searchParams.get('search')

    let query = supabase
      .from('users')
      .select(`*, teams(id, name, departments(id, name))`)
      .is('deleted_at', null)
      .order('full_name')

    if (status) query = query.eq('status', status)
    if (teamId) query = query.eq('team_id', teamId)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
