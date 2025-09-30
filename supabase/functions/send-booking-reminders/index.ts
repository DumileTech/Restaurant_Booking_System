// This line helps your code editor understand Supabase's special features.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// This lets us connect to our Supabase project from within the function.
import { createClient } from  '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get bookings for tomorrow that are confirmed
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (email, name),
        restaurants (name, location)
      `)
      .eq('date', tomorrowDate)
      .eq('status', 'confirmed')

    if (error) {
      console.error('Failed to fetch bookings for reminders:', error)
      return new Response('Failed to fetch bookings', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found for tomorrow')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No bookings found for tomorrow',
        count: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0
    const errors: string[] = []

    for (const booking of bookings) {
      const { users: user, restaurants: restaurant } = booking

      if (!user?.email || !restaurant?.name) {
        console.log('Skipping booking due to missing email or restaurant name:', booking.id)
        continue
      }

      // Check if reminder already sent today
      const { data: existingReminder } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('booking_id', booking.id)
        .ilike('subject', '%Reminder%')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .single()

      if (existingReminder) {
        console.log('Reminder already sent for booking:', booking.id)
        continue
      }

      // Send reminder email via Resender
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TableRewards <noreply@tablerewards.co.za>',
          to: [user.email],
          subject: `Reminder: Your booking tomorrow at ${restaurant.name}`,
          html: generateBookingReminderEmail({
            userName: user.name || 'Guest',
            restaurantName: restaurant.name,
            restaurantLocation: restaurant.location,
            date: booking.date,
            time: booking.time,
            partySize: booking.party_size || 2
          }),
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Failed to send reminder email:', errorText)
        errors.push(`Failed to send reminder for booking ${booking.id}: ${errorText}`)
        continue
      }

      const emailResult = await emailResponse.json()
      console.log('Reminder email sent successfully:', emailResult.id)

      // Log the reminder in database
      await supabase
        .from('email_notifications')
        .insert({
          recipient_email: user.email,
          subject: `Reminder: Your booking tomorrow at ${restaurant.name}`,
          body: 'Booking reminder email sent via Resender Edge Function',
          booking_id: booking.id,
          sent_at: new Date().toISOString()
        })

      sentCount++
    }

    console.log(`Sent ${sentCount} booking reminder emails`)

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Sent ${sentCount} booking reminder emails`,
      count: sentCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Reminder function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generateBookingReminderEmail({
  userName,
  restaurantName,
  restaurantLocation,
  date,
  time,
  partySize
}: {
  userName: string
  restaurantName: string
  restaurantLocation?: string
  date: string
  time: string
  partySize: number
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
        <title>Booking Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .booking-summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 8px 0; }
          .detail-label { font-weight: bold; color: #374151; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          @media only screen and (max-width: 600px) {
            .container { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Booking Reminder</h1>
            <p>Don't forget about your reservation tomorrow!</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <div class="reminder-box">
              <h3>🍽️ Your table is waiting!</h3>
              <p>This is a friendly reminder about your booking <strong>tomorrow</strong> at ${restaurantName}.</p>
            </div>
            
            <div class="booking-summary">
              <h3>Booking Summary</h3>
              <div class="detail-row">
                <span class="detail-label">Restaurant:</span> ${restaurantName}
              </div>
              ${restaurantLocation ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span> ${restaurantLocation}
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Date:</span> ${formattedDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span> ${time}
              </div>
              <div class="detail-row">
                <span class="detail-label">Party Size:</span> ${partySize} ${partySize === 1 ? 'guest' : 'guests'}
              </div>
            </div>
            
            <p><strong>Reminders:</strong></p>
            <ul>
              <li>Please arrive 5-10 minutes before your reservation time</li>
              <li>If you need to cancel or modify, please do so at least 2 hours in advance</li>
              <li>Contact the restaurant directly if you're running late</li>
            </ul>
            
            <p>We're excited for your dining experience tomorrow!</p>
            
            <div class="footer">
              <p>TableRewards - Dine & Earn Rewards</p>
              <p>This is an automated reminder, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}