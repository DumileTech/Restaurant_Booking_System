import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser, canAccessRestaurant } from '@/lib/auth-server'
import { sendBookingConfirmationEmail } from '@/lib/email-triggers'

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

    // Get booking to check restaurant access
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('restaurant_id')
      .eq('id', params.id)
      .single()

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user can manage this restaurant
    const hasAccess = await canAccessRestaurant(user.id, booking.restaurant_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { data: confirmed, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Send confirmation email
    sendBookingConfirmationEmail(params.id).catch(error => {
      console.error('Failed to send booking confirmation email:', error)
    })

    return NextResponse.json({ 
      message: 'Booking confirmed successfully',
      booking: confirmed 
    })

  } catch (error) {
    console.error('Confirm booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}