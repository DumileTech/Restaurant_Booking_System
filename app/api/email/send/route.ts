import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
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

    // Only admins and restaurant managers can send emails
    const isAdmin = await hasRole(user.id, 'admin')
    const isManager = await hasRole(user.id, 'restaurant_manager')
    
    if (!isAdmin && !isManager) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { type, data } = await request.json()

    let success = false
    let message = ''

    switch (type) {
      case 'booking_confirmation':
        success = await emailService.sendBookingConfirmation(data)
        message = 'Booking confirmation email sent'
        break
        
      case 'booking_reminder':
        success = await emailService.sendBookingReminder(data)
        message = 'Booking reminder email sent'
        break
        
      case 'monthly_summary':
        success = await emailService.sendMonthlyRewardsSummary(data)
        message = 'Monthly rewards summary email sent'
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Log email in database
    await supabaseAdmin
      .from('email_notifications')
      .insert({
        recipient_email: data.to,
        subject: `${type} email`,
        body: message,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}