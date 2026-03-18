import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin'

    let query = supabase
      .from('loans')
      .select(`*, resources(id, name, type), users!loans_borrower_id_fkey(id, full_name, email)`)
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('borrower_id', user.id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
