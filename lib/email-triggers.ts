import { emailService } from './email'
import { supabaseAdmin } from './auth-server'

// Function to send booking confirmation email when booking is confirmed
export async function sendBookingConfirmationEmail(bookingId: string) {
  try {
    // Get booking details with user and restaurant info
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users (email, name),
        restaurants (name, location)
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      console.error('Failed to fetch booking for email:', error)
      return false
    }

    const { users: user, restaurants: restaurant } = booking

    if (!user?.email || !restaurant?.name) {
      console.error('Missing user email or restaurant name for booking:', bookingId)
      return false
    }

    // Send confirmation email
    const success = await emailService.sendBookingConfirmation({
      to: user.email,
      userName: user.name || 'Guest',
      restaurantName: restaurant.name,
      date: booking.date,
      time: booking.time,
      partySize: booking.party_size || 2,
      specialRequests: booking.special_requests || undefined,
      bookingId: booking.id
    })

    if (success) {
      // Update email_notifications table
      await supabaseAdmin
        .from('email_notifications')
        .insert({
          recipient_email: user.email,
          subject: `Booking Confirmed - ${restaurant.name}`,
          body: 'Booking confirmation email sent via Resender',
          booking_id: bookingId,
          sent_at: new Date().toISOString()
        })
    }

    return success
  } catch (error) {
    console.error('Error sending booking confirmation email:', error)
    return false
  }
}

// Function to send booking reminders (called by cron job)
export async function sendBookingReminders() {
  try {
    // Get bookings for tomorrow that are confirmed
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    const { data: bookings, error } = await supabaseAdmin
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
      return
    }

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found for tomorrow')
      return
    }

    let sentCount = 0

    for (const booking of bookings) {
      const { users: user, restaurants: restaurant } = booking

      if (!user?.email || !restaurant?.name) {
        console.log('Skipping booking due to missing email or restaurant name:', booking.id)
        continue
      }

      // Check if reminder already sent today
      const { data: existingReminder } = await supabaseAdmin
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

      // Send reminder email
      const success = await emailService.sendBookingReminder({
        to: user.email,
        userName: user.name || 'Guest',
        restaurantName: restaurant.name,
        restaurantLocation: restaurant.location || undefined,
        date: booking.date,
        time: booking.time,
        partySize: booking.party_size || 2
      })

      if (success) {
        // Log the reminder
        await supabaseAdmin
          .from('email_notifications')
          .insert({
            recipient_email: user.email,
            subject: `Reminder: Your booking tomorrow at ${restaurant.name}`,
            body: 'Booking reminder email sent via Resender',
            booking_id: booking.id,
            sent_at: new Date().toISOString()
          })

        sentCount++
      }
    }

    console.log(`Sent ${sentCount} booking reminder emails`)
  } catch (error) {
    console.error('Error sending booking reminders:', error)
  }
}

// Function to send monthly rewards summaries
export async function sendMonthlyRewardsSummaries() {
  try {
    // Get users who had bookings last month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

    const { data: activeUsers, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, name, points,
        bookings!inner (id, created_at)
      `)
      .gte('bookings.created_at', startOfLastMonth.toISOString())
      .lte('bookings.created_at', endOfLastMonth.toISOString())

    if (error) {
      console.error('Failed to fetch active users for monthly summary:', error)
      return
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log('No active users found for monthly summary')
      return
    }

    let sentCount = 0

    for (const user of activeUsers) {
      if (!user.email) continue

      // Get monthly points earned
      const { data: monthlyRewards } = await supabaseAdmin
        .from('rewards')
        .select('points_change')
        .eq('user_id', user.id)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())

      const monthlyPoints = monthlyRewards?.reduce((sum, reward) => sum + reward.points_change, 0) || 0
      const bookingsCount = user.bookings?.length || 0

      // Send monthly summary
      const success = await emailService.sendMonthlyRewardsSummary({
        to: user.email,
        userName: user.name || 'Guest',
        monthlyPoints,
        totalPoints: user.points || 0,
        bookingsCount
      })

      if (success) {
        // Log the summary email
        await supabaseAdmin
          .from('email_notifications')
          .insert({
            recipient_email: user.email,
            subject: 'Your Monthly TableRewards Summary',
            body: 'Monthly rewards summary email sent via Resender',
            sent_at: new Date().toISOString()
          })

        sentCount++
      }
    }

    console.log(`Sent ${sentCount} monthly rewards summary emails`)
  } catch (error) {
    console.error('Error sending monthly rewards summaries:', error)
  }
}