import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailService {
  private static instance: EmailService
  private fromEmail = 'TableRewards <noreply@tablerewards.co.za>'

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail({ to, subject, html, from }: EmailTemplate): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured')
        return false
      }

      const { data, error } = await resend.emails.send({
        from: from || this.fromEmail,
        to: [to],
        subject,
        html,
      })

      if (error) {
        console.error('Resend email error:', error)
        return false
      }

      console.log('Email sent successfully:', data?.id)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  // Booking confirmation email
  async sendBookingConfirmation({
    to,
    userName,
    restaurantName,
    date,
    time,
    partySize,
    specialRequests,
    bookingId
  }: {
    to: string
    userName: string
    restaurantName: string
    date: string
    time: string
    partySize: number
    specialRequests?: string
    bookingId: string
  }): Promise<boolean> {
    const subject = `Booking Confirmed - ${restaurantName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; color: #374151; }
            .detail-value { color: #1f2937; }
            .points-banner { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
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
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(date).toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
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

    return this.sendEmail({ to, subject, html })
  }

  // Booking reminder email
  async sendBookingReminder({
    to,
    userName,
    restaurantName,
    restaurantLocation,
    date,
    time,
    partySize
  }: {
    to: string
    userName: string
    restaurantName: string
    restaurantLocation?: string
    date: string
    time: string
    partySize: number
  }): Promise<boolean> {
    const subject = `Reminder: Your booking tomorrow at ${restaurantName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .reminder-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .booking-summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { margin: 8px 0; }
            .detail-label { font-weight: bold; color: #374151; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
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
                  <span class="detail-label">Date:</span> ${new Date(date).toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
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

    return this.sendEmail({ to, subject, html })
  }

  // Monthly rewards summary email
  async sendMonthlyRewardsSummary({
    to,
    userName,
    monthlyPoints,
    totalPoints,
    bookingsCount
  }: {
    to: string
    userName: string
    monthlyPoints: number
    totalPoints: number
    bookingsCount: number
  }): Promise<boolean> {
    const subject = 'Your Monthly TableRewards Summary'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Monthly Rewards Summary</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; color: #10b981; }
            .stat-label { color: #6b7280; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Monthly Rewards Summary</h1>
              <p>Your dining achievements this month</p>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p>Here's a summary of your TableRewards activity this month:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">+${monthlyPoints}</div>
                  <div class="stat-label">Points Earned This Month</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${totalPoints}</div>
                  <div class="stat-label">Total Points Balance</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${bookingsCount}</div>
                  <div class="stat-label">Bookings This Month</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">🍽️</div>
                  <div class="stat-label">Keep Dining & Earning!</div>
                </div>
              </div>
              
              <p>Thank you for being a valued TableRewards member! Keep making reservations to earn more points and enjoy Cape Town's finest dining experiences.</p>
              
              <div class="footer">
                <p>TableRewards - Dine & Earn Rewards</p>
                <p>This is an automated summary, please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({ to, subject, html })
  }
}

export const emailService = EmailService.getInstance()