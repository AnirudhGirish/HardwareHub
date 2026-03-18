import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/utils/auditLog'
import { createNotifications } from '@/lib/utils/notify'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: requestId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate request exists and is pending
    const { data: req } = await supabase
      .from('requests')
      .select(`*, resources(id, name, status, permanent_owner_id)`)
      .eq('id', requestId)
      .single()

    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (req.status !== 'pending') return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 })

    const resource = (req as unknown as { resources: { id: string; name: string; status: string; permanent_owner_id: string | null } }).resources
    if (!resource || resource.permanent_owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the resource owner can approve requests' }, { status: 403 })
    }

    if (resource.status !== 'free') {
      return NextResponse.json({ error: 'Resource is no longer available' }, { status: 409 })
    }

    // Use transaction function to approve request and create loan
    const { data: loanId, error: transactionError } = await supabase.rpc('approve_request_and_create_loan', {
      p_request_id: requestId,
      p_approver_id: user.id,
    })

    if (transactionError) {
      console.error('[approve] transaction error:', transactionError)
      return NextResponse.json({ error: transactionError.message || 'Failed to approve request' }, { status: 500 })
    }

    if (!loanId) {
      return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
    }

    // Get loan details for notification
    const { data: loan } = await supabase.from('loans').select('end_date, resources(name)').eq('id', loanId).single()
    
    if (!loan) {
      return NextResponse.json({ error: 'Loan created but could not fetch details' }, { status: 500 })
    }

    const resourceName = (loan as unknown as { resources: { name: string } }).resources?.name ?? 'Resource'
    const endDate = new Date(loan.end_date)

    // Create notifications
    await createNotifications(supabase, [
      {
        user_id: req.requester_id,
        type: 'request_approved',
        title: 'Request approved',
        body: `Your request for "${resourceName}" was approved. Return by ${endDate.toLocaleDateString('en-IN')}.`,
      },
      {
        user_id: user.id,
        type: 'loan_created',
        title: 'Loan created',
        body: `"${resourceName}" is now on loan until ${endDate.toLocaleDateString('en-IN')}.`,
      },
    ])

    // Write audit log
    await writeAuditLog(supabase, {
      actor_id: user.id,
      action: 'APPROVE_REQUEST',
      entity_type: 'request',
      entity_id: requestId,
      metadata: { loan_id: loanId, resource_id: resource.id, end_date: loan.end_date },
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ data: { loan_id: loanId } })
  } catch (err) {
    console.error('[approve] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
