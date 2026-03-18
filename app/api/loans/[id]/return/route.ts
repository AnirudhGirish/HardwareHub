import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: loanId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate loan exists and belongs to user
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select(`*, resources(id, name, permanent_owner_id)`)
      .eq('id', loanId)
      .single()

    if (loanError || !loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    if (loan.borrower_id !== user.id) return NextResponse.json({ error: 'Only the borrower can return this resource' }, { status: 403 })
    if (loan.status === 'returned') return NextResponse.json({ error: 'Resource already returned' }, { status: 409 })

    const resource = (loan as unknown as { resources: { id: string; name: string; permanent_owner_id: string | null } }).resources

    // Use transaction function to return loan
    const { error: transactionError } = await supabase.rpc('return_loan', {
      p_loan_id: loanId,
      p_borrower_id: user.id,
    })

    if (transactionError) {
      console.error('[return] transaction error:', transactionError)
      return NextResponse.json({ error: transactionError.message || 'Failed to return loan' }, { status: 500 })
    }

    // Notify permanent owner
    if (resource.permanent_owner_id) {
      await createNotifications(supabase, [{
        user_id: resource.permanent_owner_id,
        type: 'resource_returned',
        title: 'Resource returned',
        body: `"${resource.name}" has been returned and is now available.`,
      }])
    }

    // Write audit log
    await writeAuditLog(supabase, {
      actor_id: user.id,
      action: 'RETURN_LOAN',
      entity_type: 'loan',
      entity_id: loanId,
      metadata: { resource_id: resource.id, resource_name: resource.name },
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ message: 'Resource returned successfully' })
  } catch (err) {
    console.error('[return] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
