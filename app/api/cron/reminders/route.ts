import { NextRequest, NextResponse } from 'next/server'
import { sendBookingReminders } from '@/lib/email-triggers'

// This endpoint can be called by external cron services or Supabase Edge Functions
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (optional)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // If no CRON_SECRET is set, allow the request (for development)
      if (process.env.CRON_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    await sendBookingReminders()

    return NextResponse.json({
      success: true,
      message: 'Booking reminders sent successfully'
    })

  } catch (error) {
    console.error('Cron reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Booking reminders cron endpoint',
    usage: 'POST to trigger reminder emails'
  })
}