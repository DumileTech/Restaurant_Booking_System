/*
  # Fix Booking Reminders Function

  1. Function Updates
    - Fix booking reminder logic to prevent duplicate reminders
    - Improve date filtering for reminder notifications
    - Better formatting for reminder email content

  2. Bug Fixes
    - Remove invalid diff syntax from SQL
    - Correct date comparison logic
    - Improve email content formatting
*/

-- Function to send booking reminders
CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS void AS $$
DECLARE
  booking_record record;
BEGIN
  -- Get bookings for tomorrow that are confirmed (send reminder day before)
  FOR booking_record IN
    SELECT 
      b.id,
      b.date,
      b.time,
      b.party_size,
      u.email,
      u.name,
      r.name as restaurant_name,
      r.location
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN restaurants r ON b.restaurant_id = r.id
    WHERE b.date = CURRENT_DATE + INTERVAL '1 day'
      AND b.status = 'confirmed'
      AND NOT EXISTS (
        SELECT 1 FROM email_notifications 
        WHERE booking_id = b.id 
          AND subject LIKE '%Reminder%'
          AND created_at >= CURRENT_DATE - INTERVAL '1 day'
      )
  LOOP
    -- Insert reminder email
    INSERT INTO email_notifications (
      recipient_email,
      subject,
      body,
      booking_id,
      created_at
    ) VALUES (
      booking_record.email,
      'Booking Reminder - ' || booking_record.restaurant_name,
      format('Hi %s, this is a friendly reminder about your booking tomorrow at %s (%s) on %s at %s for %s guests. We look forward to seeing you!',
        COALESCE(booking_record.name, 'there'),
        booking_record.restaurant_name,
        COALESCE(booking_record.location, 'location TBD'),
        booking_record.date,
        booking_record.time,
        booking_record.party_size
      ),
      booking_record.id,
      now()
    );
  END LOOP;
  
  RAISE NOTICE 'Booking reminders processed at %', now();
END;
$$ LANGUAGE plpgsql;