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

export async function POST(request: NextRequest) {
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