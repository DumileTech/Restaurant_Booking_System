// This line helps your code editor understand Supabase's special features.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// This lets us connect to our Supabase project from within the function.
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  old_record?: any
}

interface EmailData {
  to: string
  subject: string
  html: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: BookingPayload = await req.json()
    
    // Only process booking updates where status changes to 'confirmed'
    if (payload.type === 'UPDATE' && 
        payload.record.status === 'confirmed' && 
        payload.old_record?.status !== 'confirmed') {
      
      // Initialize Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Get booking details with user and restaurant info
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (email, name),
          restaurants (name, location)
        `)
        .eq('id', payload.record.id)
        .single()

      if (error || !booking) {
        console.error('Failed to fetch booking details:', error)
        return new Response('Failed to fetch booking details', { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      const { users: user, restaurants: restaurant } = booking

      if (!user?.email || !restaurant?.name) {
        console.error('Missing user email or restaurant name')
        return new Response('Missing required data', { 
          status: 400, 
          headers: corsHeaders 
        })
      }

      // Prepare email data
      const emailData: EmailData = {
        to: user.email,
        subject: `Booking Confirmed - ${restaurant.name}`,
        html: generateBookingConfirmationEmail({
          userName: user.name || 'Guest',
          restaurantName: restaurant.name,
          restaurantLocation: restaurant.location,
          date: booking.date,
          time: booking.time,
          partySize: booking.party_size,
          specialRequests: booking.special_requests,
          bookingId: booking.id
        })
      }

      // Send email via Resender
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TableRewards <noreply@tablerewards.co.za>',
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Failed to send email:', errorText)
        return new Response('Failed to send email', { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      const emailResult = await emailResponse.json()
      console.log('Email sent successfully:', emailResult.id)

      // Log email in database
      await supabase
        .from('email_notifications')
        .insert({
          recipient_email: user.email,
          subject: emailData.subject,
          body: 'Booking confirmation email sent via Resender webhook',
          booking_id: booking.id,
          sent_at: new Date().toISOString()
        })

      return new Response(JSON.stringify({ 
        success: true, 
        emailId: emailResult.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For other webhook events, just return success
    return new Response(JSON.stringify({ success: true, message: 'Webhook processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateBookingConfirmationEmail({
  userName,
  restaurantName,
  restaurantLocation,
  date,
  time,
  partySize,
  specialRequests,
  bookingId
}: {
  userName: string
  restaurantName: string
  restaurantLocation?: string
  date: string
  time: string
  partySize: number
  specialRequests?: string
  bookingId: string
}): string {
  const formattedDate = new Date(date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #374151; }
          .detail-value { color: #1f2937; }
          .points-banner { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          @media only screen and (max-width: 600px) {
            .container { padding: 10px; }
            .detail-row { flex-direction: column; }
            .detail-label { margin-bottom: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your table reservation has been confirmed</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Great news! Your booking at <strong>${restaurantName}</strong> has been confirmed. We're looking forward to welcoming you!</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="detail-label">Restaurant:</span>
                <span class="detail-value">${restaurantName}</span>
              </div>
              ${restaurantLocation ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${restaurantLocation}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Party Size:</span>
                <span class="detail-value">${partySize} ${partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value">${bookingId}</span>
              </div>
              ${specialRequests ? `
              <div class="detail-row">
                <span class="detail-label">Special Requests:</span>
                <span class="detail-value">${specialRequests}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="points-banner">
              <h3>🏆 You've Earned 10 Reward Points!</h3>
              <p>These points have been added to your TableRewards account</p>
            </div>
            
            <p><strong>Important Notes:</strong></p>
            <ul>
              <li>Please arrive on time for your reservation</li>
              <li>If you need to cancel or modify your booking, please contact us at least 2 hours in advance</li>
              <li>Keep this confirmation email for your records</li>
            </ul>
            
            <p>Thank you for choosing TableRewards. We hope you have a wonderful dining experience!</p>
            
            <div class="footer">
              <p>TableRewards - Dine & Earn Rewards</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}