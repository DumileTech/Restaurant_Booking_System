import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser, hasRole } from '@/lib/auth-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can change user roles
    const isAdmin = await hasRole(user.id, 'admin')
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { role } = await request.json()

    if (!role || !['customer', 'restaurant_manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'User role updated successfully',
      user: updated 
    })

  } catch (error) {
    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}