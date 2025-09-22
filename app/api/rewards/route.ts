import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser, hasRole } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = await hasRole(user.id, 'admin')
    
    let query = supabaseAdmin.from('rewards').select('*')
    
    // Non-admin users can only see their own rewards
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: rewards, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ rewards })

  } catch (error) {
    console.error('Get rewards error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}