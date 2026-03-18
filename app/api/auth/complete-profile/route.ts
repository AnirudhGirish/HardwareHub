import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { completeProfileSchema } from '@/lib/schemas/auth'
import { sanitise } from '@/lib/utils/sanitise'
import { extractDomain } from '@/lib/utils/extractDomain'
import { writeAuditLog } from '@/lib/utils/auditLog'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const body = await request.json()
    const parsed = completeProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { full_name, username, employee_id, department_id, team_id, email, password } = parsed.data
    
    // username is already lowercased by Zod transform
    const cleanUsername = username.toLowerCase()

    // Determine user identity
    let userId: string
    let userEmail = email ?? ''
    
    if (email && password) {
      // Server-side registration: create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
        },
      })
      
      if (signUpError || !authData.user) {
        return NextResponse.json({ error: signUpError?.message ?? 'Failed to create user' }, { status: 400 })
      }
      
      userId = authData.user.id
    } else {
      // Already authenticated flow
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      userId = authUser.id
      userEmail = authUser.email ?? ''
    }

    const cleanName = sanitise(full_name)

    // Domain validation — use admin client so RLS doesn't block callers
    // who have no session yet (new registrations happen before auth.uid() is set)
    const domain = extractDomain(userEmail)
    const adminClient = createAdminClient()
    const { data: domainRow } = await adminClient
      .from('allowed_domains')
      .select('id')
      .eq('domain', domain)
      .single()

    if (!domainRow) {
      return NextResponse.json(
        { error: `Email domain "${domain}" is not allowed. Contact your administrator.` },
        { status: 403 }
      )
    }

    // Check username uniqueness (exclude current user in case of re-profile)
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanUsername)
      .neq('id', userId)
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Check employee_id uniqueness (exclude current user)
    const { data: existingEmployeeId } = await supabase
      .from('users')
      .select('id')
      .eq('employee_id', employee_id)
      .neq('id', userId)
      .single()

    if (existingEmployeeId) {
      return NextResponse.json({ error: 'Employee ID already registered' }, { status: 409 })
    }

    // Verify team belongs to department
    const { data: team } = await supabase
      .from('teams')
      .select('id, department_id')
      .eq('id', team_id)
      .is('deleted_at', null)
      .single()

    if (!team || team.department_id !== department_id) {
      return NextResponse.json({ error: 'Team does not belong to selected department' }, { status: 400 })
    }

    // Upsert user profile with username
    const { error: upsertError } = await supabase.from('users').upsert({
      id: userId,
      email: userEmail,
      username: cleanUsername,
      employee_id,
      full_name: cleanName,
      department_id,
      team_id,
    })

    if (upsertError) {
      console.error('[complete-profile]', upsertError)
      // Handle DB-level unique violations as a safety net
      if (upsertError.code === '23505') {
        if (upsertError.message.includes('username')) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
        }
        if (upsertError.message.includes('employee_id')) {
          return NextResponse.json({ error: 'Employee ID already registered' }, { status: 409 })
        }
      }
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: 'COMPLETE_PROFILE',
      entity_type: 'user',
      entity_id: userId,
      metadata: { department_id, team_id, username: cleanUsername },
      ip_address: request.headers.get('x-forwarded-for'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ message: 'Profile completed successfully' })
  } catch (err) {
    console.error('[complete-profile]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
