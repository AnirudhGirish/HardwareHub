import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actor_id')
    const entityType = searchParams.get('entity_type')
    const action = searchParams.get('action')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const pageSize = 50
    const offset = (page - 1) * pageSize
    const format = searchParams.get('format')

    let query = supabase
      .from('audit_log')
      .select(`*, users!audit_log_actor_id_fkey(id, full_name, email)`, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (actorId) query = query.eq('actor_id', actorId)
    if (entityType) query = query.eq('entity_type', entityType)
    if (action) query = query.ilike('action', `%${action}%`)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    if (format === 'csv') {
      // CSV export — no pagination, max 5000 rows
      const { data } = await query.limit(5000)
      const rows = (data ?? []).map((row) => {
        const actor = (row as unknown as { users: { full_name: string; email: string } | null }).users
        return [
          row.created_at,
          actor?.full_name ?? '',
          actor?.email ?? '',
          row.action,
          row.entity_type,
          row.entity_id ?? '',
          row.ip_address ?? '',
          JSON.stringify(row.metadata ?? {}),
        ].join(',')
      })

      const csv = ['created_at,actor_name,actor_email,action,entity_type,entity_id,ip_address,metadata', ...rows].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const { data, count } = await query.range(offset, offset + pageSize - 1)
    return NextResponse.json({ data: data ?? [], total: count ?? 0, page, pageSize })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
