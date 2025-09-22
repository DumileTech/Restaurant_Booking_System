import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getServerUser, hasRole } from '@/lib/auth-server'
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

export async function GET(
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

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        restaurants (
          name,
          location,
          cuisine
        ),
        users (
          email,
          name
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user can access this booking
    const isAdmin = await hasRole(user.id, 'admin')
    const isOwner = booking.user_id === user.id
    const canManageRestaurant = booking.restaurants && 
      await supabaseAdmin
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

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const updates = await request.json()

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

    // Check permissions
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

    // Customers can only update certain fields
    if (isOwner && !isAdmin && !canManageRestaurant) {
      const allowedFields = ['date', 'time', 'party_size', 'special_requests']
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key]
          return obj
        }, {} as any)
      
      if (Object.keys(filteredUpdates).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }
      
      updates = filteredUpdates
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking: updated })

  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}