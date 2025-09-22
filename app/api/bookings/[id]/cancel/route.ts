import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser, hasRole } from '@/lib/auth-server'

export async function POST(
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

    // Get booking to check permissions
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id, restaurant_id')
      .eq('id', params.id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions - user can cancel their own booking, or admin/restaurant manager can cancel
    const isAdmin = await hasRole(user.id, 'admin')
    const isOwner = booking.user_id === user.id
    const canManageRestaurant = await supabaseAdmin
      .from('restaurants')
      .select('admin_id')
      .eq('id', booking.restaurant_id)
      .eq('admin_id', user.id)
      .single()
      .then(({ data }) => !!data)

    if (!isAdmin && !isOwner && !canManageRestaurant) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data: cancelled, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
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
      message: 'Booking cancelled successfully',
      booking: cancelled 
    })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}