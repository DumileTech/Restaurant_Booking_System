import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getServerUser, canAccessRestaurant } from '@/lib/auth-server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.decode(token) as any
    const userId = decoded?.sub
    if (!userId) return null
    
    return await getServerUser(userId)
  } catch {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('supabase-auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
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