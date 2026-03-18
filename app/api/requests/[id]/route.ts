import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if the request exists and belongs to the user, and is still pending
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('id, status, resource_id')
      .eq('id', id)
      .eq('requester_id', user.id)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (existingRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending requests' }, { status: 400 })
    }

    // Update status to 'cancelled' bypassing RLS
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) throw updateError

    // Send notification to the permanent owner
    const { data: resData } = await adminSupabase
      .from('resources')
      .select('permanent_owner_id, name')
      .eq('id', existingRequest.resource_id)
      .single()
      
    if (resData?.permanent_owner_id) {
       await adminSupabase.from('notifications').insert({
         user_id: resData.permanent_owner_id,
         type: 'request_cancelled',
         title: 'Request Cancelled',
         body: `The request for ${resData.name} was cancelled by the requester.`,
       })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling request', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
