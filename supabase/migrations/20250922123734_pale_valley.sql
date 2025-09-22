/*
  # Advanced Database Functions

  1. CRUD Functions
    - Complete restaurant management
    - Advanced booking operations
    - User profile management
    - Rewards system functions

  2. Business Logic Functions
    - Availability checking
    - Automatic notifications
    - Point calculations
    - Analytics functions

  3. Utility Functions
    - Data validation
    - Cleanup operations
    - Reporting functions
*/

-- Function to get restaurant availability
CREATE OR REPLACE FUNCTION get_restaurant_availability(
  restaurant_id_param uuid,
  date_param date,
  party_size_param int DEFAULT 2
)
RETURNS TABLE(
  available_times text[],
  total_capacity int,
  current_bookings int
) AS $$
DECLARE
  restaurant_capacity int;
  booked_slots record;
  time_slot text;
  available_slots text[] := '{}';
BEGIN
  -- Get restaurant capacity
  SELECT capacity INTO restaurant_capacity
  FROM restaurants 
  WHERE id = restaurant_id_param;
  
  -- Define available time slots
  FOR time_slot IN 
    SELECT unnest(ARRAY['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
                        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'])
  LOOP
    -- Check if this time slot has availability
    SELECT COALESCE(SUM(party_size), 0) as booked_capacity
    INTO booked_slots
    FROM bookings 
    WHERE restaurant_id = restaurant_id_param 
      AND date = date_param 
      AND time = time_slot::time
      AND status = 'confirmed';
    
    -- If there's enough capacity, add to available slots
    IF (restaurant_capacity - booked_slots.booked_capacity) >= party_size_param THEN
      available_slots := array_append(available_slots, time_slot);
    END IF;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT 
    available_slots,
    restaurant_capacity,
    (SELECT COALESCE(SUM(party_size), 0)::int FROM bookings 
     WHERE restaurant_id = restaurant_id_param AND date = date_param AND status = 'confirmed');
END;
$$ LANGUAGE plpgsql;

-- Function to create booking with validation
CREATE OR REPLACE FUNCTION create_booking_with_validation(
  user_id_param uuid,
  restaurant_id_param uuid,
  date_param date,
  time_param time,
  party_size_param int,
  special_requests_param text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  booking_id uuid;
  availability_check record;
  result json;
BEGIN
  -- Check availability
  SELECT * INTO availability_check
  FROM get_restaurant_availability(restaurant_id_param, date_param, party_size_param);
  
  -- Validate if requested time is available
  IF NOT (time_param::text = ANY(availability_check.available_times)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Time slot not available',
      'available_times', availability_check.available_times
    );
  END IF;
  
  -- Create the booking
  INSERT INTO bookings (user_id, restaurant_id, date, time, party_size, special_requests)
  VALUES (user_id_param, restaurant_id_param, date_param, time_param, party_size_param, special_requests_param)
  RETURNING id INTO booking_id;
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'booking_id', booking_id,
    'message', 'Booking created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard(user_id_param uuid)
RETURNS json AS $$
DECLARE
  user_data record;
  recent_bookings json;
  rewards_summary json;
  result json;
BEGIN
  -- Get user profile
  SELECT * INTO user_data FROM users WHERE id = user_id_param;
  
  -- Get recent bookings
  SELECT json_agg(
    json_build_object(
      'id', b.id,
      'restaurant_name', r.name,
      'date', b.date,
      'time', b.time,
      'party_size', b.party_size,
      'status', b.status,
      'created_at', b.created_at
    ) ORDER BY b.created_at DESC
  ) INTO recent_bookings
  FROM bookings b
  JOIN restaurants r ON b.restaurant_id = r.id
  WHERE b.user_id = user_id_param
  LIMIT 10;
  
  -- Get rewards summary
  SELECT json_build_object(
    'total_points', COALESCE(user_data.points, 0),
    'recent_rewards', (
      SELECT json_agg(
        json_build_object(
          'points_change', points_change,
          'reason', reason,
          'created_at', created_at
        ) ORDER BY created_at DESC
      )
      FROM rewards 
      WHERE user_id = user_id_param 
      LIMIT 5
    ),
    'monthly_points', (
      SELECT COALESCE(SUM(points_change), 0)
      FROM rewards 
      WHERE user_id = user_id_param 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    )
  ) INTO rewards_summary;
  
  -- Build final result
  RETURN json_build_object(
    'user', json_build_object(
      'id', user_data.id,
      'email', user_data.email,
      'name', user_data.name,
      'points', user_data.points,
      'created_at', user_data.created_at
    ),
    'recent_bookings', COALESCE(recent_bookings, '[]'::json),
    'rewards', rewards_summary
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get restaurant analytics
CREATE OR REPLACE FUNCTION get_restaurant_analytics(
  restaurant_id_param uuid,
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS json AS $$
DECLARE
  analytics_data json;
BEGIN
  SELECT json_build_object(
    'total_bookings', (
      SELECT COUNT(*) FROM bookings 
      WHERE restaurant_id = restaurant_id_param 
        AND date BETWEEN start_date AND end_date
    ),
    'confirmed_bookings', (
      SELECT COUNT(*) FROM bookings 
      WHERE restaurant_id = restaurant_id_param 
        AND status = 'confirmed'
        AND date BETWEEN start_date AND end_date
    ),
    'total_guests', (
      SELECT COALESCE(SUM(party_size), 0) FROM bookings 
      WHERE restaurant_id = restaurant_id_param 
        AND status = 'confirmed'
        AND date BETWEEN start_date AND end_date
    ),
    'average_party_size', (
      SELECT ROUND(AVG(party_size), 2) FROM bookings 
      WHERE restaurant_id = restaurant_id_param 
        AND status = 'confirmed'
        AND date BETWEEN start_date AND end_date
    ),
    'bookings_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'count', booking_count,
          'guests', guest_count
        ) ORDER BY date
      )
      FROM (
        SELECT 
          date,
          COUNT(*) as booking_count,
          SUM(party_size) as guest_count
        FROM bookings 
        WHERE restaurant_id = restaurant_id_param 
          AND status = 'confirmed'
          AND date BETWEEN start_date AND end_date
        GROUP BY date
      ) daily_stats
    ),
    'popular_times', (
      SELECT json_agg(
        json_build_object(
          'time', time,
          'bookings', booking_count
        ) ORDER BY booking_count DESC
      )
      FROM (
        SELECT 
          time,
          COUNT(*) as booking_count
        FROM bookings 
        WHERE restaurant_id = restaurant_id_param 
          AND status = 'confirmed'
          AND date BETWEEN start_date AND end_date
        GROUP BY time
        ORDER BY booking_count DESC
        LIMIT 10
      ) time_stats
    )
  ) INTO analytics_data;
  
  RETURN analytics_data;
END;
$$ LANGUAGE plpgsql;

-- Function to send booking confirmation email
CREATE OR REPLACE FUNCTION send_booking_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  restaurant_name text;
  booking_details record;
BEGIN
  -- Only send email when booking is confirmed
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Get user email and restaurant details
    SELECT u.email, r.name
    INTO user_email, restaurant_name
    FROM users u, restaurants r
    WHERE u.id = NEW.user_id AND r.id = NEW.restaurant_id;
    
    -- Get booking details
    SELECT NEW.date, NEW.time, NEW.party_size, NEW.special_requests
    INTO booking_details;
    
    -- Insert email notification (this would integrate with your email service)
    INSERT INTO email_notifications (
      recipient_email,
      subject,
      body,
      booking_id,
      created_at
    ) VALUES (
      user_email,
      'Booking Confirmed - ' || restaurant_name,
      format('Your booking at %s has been confirmed for %s at %s for %s guests. %s',
        restaurant_name,
        booking_details.date,
        booking_details.time,
        booking_details.party_size,
        CASE WHEN booking_details.special_requests IS NOT NULL 
             THEN 'Special requests: ' || booking_details.special_requests 
             ELSE '' END
      ),
      NEW.id,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  booking_id uuid REFERENCES bookings(id),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create trigger for email notifications
DROP TRIGGER IF EXISTS booking_confirmation_email ON bookings;
CREATE TRIGGER booking_confirmation_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_confirmation_email();

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete old cancelled bookings (older than 6 months)
  DELETE FROM bookings 
  WHERE status = 'cancelled' 
    AND created_at < CURRENT_DATE - INTERVAL '6 months';
  
  -- Delete old email notifications (older than 3 months)
  DELETE FROM email_notifications 
  WHERE created_at < CURRENT_DATE - INTERVAL '3 months';
  
  -- Archive old rewards (move to archive table if needed)
  -- This is a placeholder for archiving logic
  
END;
$$ LANGUAGE plpgsql;