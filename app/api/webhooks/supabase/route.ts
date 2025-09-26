import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    const headersList = headers()
    const signature = headersList.get('x-supabase-signature')
    
    // You can add signature verification here if needed
    // const expectedSignature = crypto.createHmac('sha256', process.env.SUPABASE_WEBHOOK_SECRET!)
    //   .update(await request.text())
    //   .digest('hex')

    const payload = await request.json()
    
    console.log('Received Supabase webhook:', {
      type: payload.type,
      table: payload.table,
      record: payload.record?.id
    })

    // Handle different webhook events
    switch (payload.table) {
      case 'bookings':
        if (payload.type === 'UPDATE' && 
            payload.record.status === 'confirmed' && 
            payload.old_record?.status !== 'confirmed') {
          
          console.log('Booking confirmed, webhook will trigger email via Edge Function')
          
          // The actual email sending is handled by the Supabase Edge Function
          // This endpoint just logs the webhook for monitoring
          return NextResponse.json({ 
            success: true, 
            message: 'Booking confirmation webhook received' 
          })
        }
        break
        
      default:
        console.log('Unhandled webhook table:', payload.table)
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase webhook endpoint',
    status: 'active'
  })
}