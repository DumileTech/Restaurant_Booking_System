import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser, hasRole } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and restaurant managers can send notifications
    const isAdmin = await hasRole(user.id, 'admin')
    const isManager = await hasRole(user.id, 'restaurant_manager')
    
    if (!isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { email, subject, body, booking_id } = await request.json()

    if (!email || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: notification, error } = await supabaseAdmin
      .from('email_notifications')
      .insert({
        recipient_email: email,
        subject,
        body,
        booking_id: booking_id || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Notification sent successfully',
      notification
    })

  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}