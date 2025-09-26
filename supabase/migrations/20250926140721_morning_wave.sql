/*
  # Complete TableRewards Database Schema

  1. Core Tables
    - users: User profiles with roles and reward points
    - restaurants: Restaurant information and management
    - bookings: Table reservations with status tracking
    - rewards: Point transaction history
    - email_notifications: Email notification queue and history
    - user_engagement_metrics: User engagement tracking

  2. Storage Configuration
    - restaurant-images: Public restaurant photos
    - user-avatars: Private user profile pictures
    - documents: Restaurant documents and menus

  3. Advanced Functions
    - Availability checking and booking validation
    - User dashboard data aggregation
    - Restaurant analytics and reporting
    - Email notification triggers
    - Automated cleanup and maintenance
    - Cron job management

  4. Security & RLS
    - Row Level Security policies for all tables
    - Role-based access control
    - Storage bucket policies

  5. Scheduled Jobs
    - Daily cleanup and maintenance
    - Booking reminders and notifications
    - Weekly analytics reports
    - Monthly rewards summaries
    - User engagement updates
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text CHECK (role IN ('customer', 'restaurant_manager', 'admin')) DEFAULT 'customer',
  points int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  cuisine text,
  capacity int DEFAULT 50,
  description text,
  image_url text,
  admin_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  party_size int DEFAULT 2,
  status text CHECK (status IN ('pending','confirmed','cancelled')) DEFAULT 'pending',
  special_requests text,
  created_at timestamptz DEFAULT now()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id),
  points_change int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  booking_id uuid REFERENCES bookings(id),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User engagement metrics table
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_bookings int DEFAULT 0,
  confirmed_bookings int DEFAULT 0,
  cancelled_bookings int DEFAULT 0,
  total_points_earned int DEFAULT 0,
  last_booking_date date,
  engagement_score decimal(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_admin_id ON restaurants(admin_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants(location);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant_id ON bookings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant_date ON bookings(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_created_at ON rewards(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rewards_booking_id ON rewards(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_booking_id ON email_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (OLD.role = NEW.role OR NEW.role IS NULL)
  );

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Restaurants policies
CREATE POLICY "Anyone can read restaurants"
  ON restaurants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Restaurant managers can update own restaurant"
  ON restaurants FOR ALL
  TO authenticated
  USING (
    auth.uid() = admin_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant managers can read their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    restaurant_id IN (
      SELECT id FROM restaurants WHERE admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Restaurant managers can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    restaurant_id IN (
      SELECT id FROM restaurants WHERE admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rewards policies
CREATE POLICY "Users can read own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Email notifications policies
CREATE POLICY "Admins can manage email notifications"
  ON email_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User engagement metrics policies
CREATE POLICY "Users can read own engagement metrics"
  ON user_engagement_metrics FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- STORAGE CONFIGURATION
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('restaurant-images', 'restaurant-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for restaurant-images bucket (public read)
CREATE POLICY "Public can view restaurant images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-images');

CREATE POLICY "Restaurant admins can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

CREATE POLICY "Restaurant admins can update their images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

CREATE POLICY "Restaurant admins can delete their images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-images' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

-- Storage policies for user-avatars bucket
CREATE POLICY "Users can view own avatar"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for documents bucket
CREATE POLICY "Restaurant admins can manage documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT admin_id FROM restaurants WHERE admin_id IS NOT NULL
    )
  );

-- =============================================
-- BUSINESS LOGIC FUNCTIONS
-- =============================================

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

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Function to award points on booking confirmation
CREATE OR REPLACE FUNCTION award_points_on_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award points when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Update user points
    UPDATE users 
    SET points = points + 10 
    WHERE id = NEW.user_id;
    
    -- Insert reward record
    INSERT INTO rewards (user_id, booking_id, points_change, reason)
    VALUES (NEW.user_id, NEW.id, 10, 'Booking confirmation reward');
  END IF;
  
  RETURN NEW;
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
    
    -- Insert email notification
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

-- Function to call webhook when booking is confirmed
CREATE OR REPLACE FUNCTION notify_booking_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- This will be handled by Supabase Edge Function webhook
    PERFORM pg_notify('booking_confirmed', json_build_object(
      'booking_id', NEW.id,
      'user_id', NEW.user_id,
      'restaurant_id', NEW.restaurant_id,
      'status', NEW.status
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle webhook notifications
CREATE OR REPLACE FUNCTION handle_webhook_notification()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  payload json;
BEGIN
  -- Construct webhook payload
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    'timestamp', now()
  );

  -- Log webhook call (for debugging)
  INSERT INTO email_notifications (
    recipient_email,
    subject,
    body,
    booking_id,
    created_at
  ) VALUES (
    'webhook@tablerewards.co.za',
    'Webhook Triggered: ' || TG_TABLE_NAME || ' ' || TG_OP,
    'Webhook payload: ' || payload::text,
    CASE WHEN TG_TABLE_NAME = 'bookings' THEN NEW.id ELSE NULL END,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MAINTENANCE FUNCTIONS
-- =============================================

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
  
  RAISE NOTICE 'Old data cleanup completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to send booking reminders
CREATE OR REPLACE FUNCTION send_booking_reminders()
RETURNS void AS $$
DECLARE
  booking_record record;
BEGIN
  -- Get bookings for tomorrow that are confirmed
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

-- Function to generate weekly analytics reports
CREATE OR REPLACE FUNCTION generate_weekly_analytics()
RETURNS void AS $$
DECLARE
  report_data json;
  admin_record record;
BEGIN
  -- Generate analytics for each restaurant admin
  FOR admin_record IN
    SELECT DISTINCT admin_id, email, name
    FROM restaurants r
    JOIN users u ON r.admin_id = u.id
    WHERE r.admin_id IS NOT NULL
  LOOP
    -- Get analytics data for admin's restaurants
    SELECT json_build_object(
      'week_start', date_trunc('week', CURRENT_DATE - INTERVAL '7 days'),
      'week_end', date_trunc('week', CURRENT_DATE) - INTERVAL '1 day',
      'total_bookings', COUNT(*),
      'confirmed_bookings', COUNT(*) FILTER (WHERE b.status = 'confirmed'),
      'total_revenue_estimate', COUNT(*) FILTER (WHERE b.status = 'confirmed') * 50,
      'popular_times', json_agg(DISTINCT b.time ORDER BY b.time),
      'average_party_size', ROUND(AVG(b.party_size), 2)
    ) INTO report_data
    FROM bookings b
    JOIN restaurants r ON b.restaurant_id = r.id
    WHERE r.admin_id = admin_record.admin_id
      AND b.date >= date_trunc('week', CURRENT_DATE - INTERVAL '7 days')
      AND b.date < date_trunc('week', CURRENT_DATE);
    
    -- Send weekly report email
    INSERT INTO email_notifications (
      recipient_email,
      subject,
      body,
      created_at
    ) VALUES (
      admin_record.email,
      'Weekly Analytics Report',
      format('Hi %s, here is your weekly restaurant analytics report: %s',
        COALESCE(admin_record.name, 'Restaurant Admin'),
        report_data::text
      ),
      now()
    );
  END LOOP;
  
  RAISE NOTICE 'Weekly analytics reports generated at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS void AS $$
DECLARE
  email_record record;
  processed_count int := 0;
BEGIN
  -- Process unsent emails (limit to 100 per run)
  FOR email_record IN
    SELECT id, recipient_email, subject, body
    FROM email_notifications
    WHERE sent_at IS NULL
    ORDER BY created_at
    LIMIT 100
  LOOP
    -- Mark as sent (in real implementation, this would integrate with email service)
    UPDATE email_notifications
    SET sent_at = now()
    WHERE id = email_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Processed % emails at %', processed_count, now();
END;
$$ LANGUAGE plpgsql;

-- Function to update user engagement metrics
CREATE OR REPLACE FUNCTION update_user_engagement_metrics()
RETURNS void AS $$
BEGIN
  -- Update engagement metrics for all users
  INSERT INTO user_engagement_metrics (
    user_id,
    total_bookings,
    confirmed_bookings,
    cancelled_bookings,
    total_points_earned,
    last_booking_date,
    engagement_score,
    updated_at
  )
  SELECT 
    u.id,
    COALESCE(booking_stats.total_bookings, 0),
    COALESCE(booking_stats.confirmed_bookings, 0),
    COALESCE(booking_stats.cancelled_bookings, 0),
    COALESCE(u.points, 0),
    booking_stats.last_booking_date,
    -- Simple engagement score calculation
    CASE 
      WHEN booking_stats.last_booking_date > CURRENT_DATE - INTERVAL '30 days' THEN
        LEAST(100, (COALESCE(booking_stats.confirmed_bookings, 0) * 10) + (COALESCE(u.points, 0) / 10))
      ELSE
        GREATEST(0, LEAST(100, (COALESCE(booking_stats.confirmed_bookings, 0) * 10) + (COALESCE(u.points, 0) / 10)) - 20)
    END,
    now()
  FROM users u
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_bookings,
      COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
      MAX(date) as last_booking_date
    FROM bookings
    GROUP BY user_id
  ) booking_stats ON u.id = booking_stats.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_bookings = EXCLUDED.total_bookings,
    confirmed_bookings = EXCLUDED.confirmed_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    total_points_earned = EXCLUDED.total_points_earned,
    last_booking_date = EXCLUDED.last_booking_date,
    engagement_score = EXCLUDED.engagement_score,
    updated_at = now();

  RAISE NOTICE 'User engagement metrics updated at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to send monthly rewards summary
CREATE OR REPLACE FUNCTION send_monthly_rewards_summary()
RETURNS void AS $$
DECLARE
  user_record record;
  monthly_points int;
  total_points int;
BEGIN
  -- Send monthly summary to active users
  FOR user_record IN
    SELECT u.id, u.email, u.name, u.points
    FROM users u
    WHERE EXISTS (
      SELECT 1 FROM bookings b 
      WHERE b.user_id = u.id 
        AND b.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        AND b.created_at < date_trunc('month', CURRENT_DATE)
    )
  LOOP
    -- Calculate monthly points earned
    SELECT COALESCE(SUM(points_change), 0) INTO monthly_points
    FROM rewards
    WHERE user_id = user_record.id
      AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND created_at < date_trunc('month', CURRENT_DATE);
    
    -- Send monthly summary email
    INSERT INTO email_notifications (
      recipient_email,
      subject,
      body,
      created_at
    ) VALUES (
      user_record.email,
      'Monthly Rewards Summary',
      format('Hi %s! Last month you earned %s reward points. Your total balance is now %s points. Keep dining with us to earn more rewards!',
        COALESCE(user_record.name, 'there'),
        monthly_points,
        user_record.points
      ),
      now()
    );
  END LOOP;
  
  RAISE NOTICE 'Monthly rewards summaries sent at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to optimize database performance
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS void AS $$
BEGIN
  -- Analyze tables for better query planning
  ANALYZE users;
  ANALYZE restaurants;
  ANALYZE bookings;
  ANALYZE rewards;
  ANALYZE email_notifications;
  ANALYZE user_engagement_metrics;
  
  RAISE NOTICE 'Database performance optimization completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to view all scheduled jobs
CREATE OR REPLACE FUNCTION get_scheduled_jobs()
RETURNS TABLE(
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport int,
  database text,
  username text,
  active boolean,
  jobname text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.schedule,
    j.command,
    j.nodename,
    j.nodeport,
    j.database,
    j.username,
    j.active,
    j.jobname
  FROM cron.job j
  ORDER BY j.jobid;
END;
$$ LANGUAGE plpgsql;

-- Function to manage jobs
CREATE OR REPLACE FUNCTION manage_cron_job(
  action text,
  job_name text DEFAULT NULL,
  job_schedule text DEFAULT NULL,
  job_command text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  CASE action
    WHEN 'list' THEN
      SELECT string_agg(
        format('Job: %s | Schedule: %s | Command: %s | Active: %s', 
          jobname, schedule, command, active), 
        E'\n'
      ) INTO result
      FROM cron.job;
      
    WHEN 'enable' THEN
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for enable action';
      END IF;
      
      UPDATE cron.job SET active = true WHERE jobname = job_name;
      result := format('Job %s enabled', job_name);
      
    WHEN 'disable' THEN
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for disable action';
      END IF;
      
      UPDATE cron.job SET active = false WHERE jobname = job_name;
      result := format('Job %s disabled', job_name);
      
    WHEN 'delete' THEN
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for delete action';
      END IF;
      
      SELECT cron.unschedule(job_name) INTO result;
      result := format('Job %s deleted', job_name);
      
    WHEN 'create' THEN
      IF job_name IS NULL OR job_schedule IS NULL OR job_command IS NULL THEN
        RAISE EXCEPTION 'Job name, schedule, and command are required for create action';
      END IF;
      
      SELECT cron.schedule(job_name, job_schedule, job_command) INTO result;
      result := format('Job %s created with schedule %s', job_name, job_schedule);
      
    ELSE
      RAISE EXCEPTION 'Invalid action. Use: list, enable, disable, delete, or create';
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for automatic point rewards
DROP TRIGGER IF EXISTS booking_confirmation_reward ON bookings;
CREATE TRIGGER booking_confirmation_reward
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_confirmation();

-- Trigger for email notifications
DROP TRIGGER IF EXISTS booking_confirmation_email ON bookings;
CREATE TRIGGER booking_confirmation_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_confirmation_email();

-- Trigger for booking confirmations
DROP TRIGGER IF EXISTS booking_confirmed_webhook ON bookings;
CREATE TRIGGER booking_confirmed_webhook
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_confirmed();

-- Webhook trigger for bookings table
DROP TRIGGER IF EXISTS bookings_webhook_trigger ON bookings;
CREATE TRIGGER bookings_webhook_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_webhook_notification();

-- =============================================
-- SCHEDULED JOBS
-- =============================================

-- Daily cleanup at 2 AM
SELECT cron.schedule(
  'daily-cleanup',
  '0 2 * * *',
  'SELECT cleanup_old_data();'
);

-- Hourly booking reminders
SELECT cron.schedule(
  'booking-reminders',
  '0 * * * *',
  'SELECT send_booking_reminders();'
);

-- Process email queue every 15 minutes
SELECT cron.schedule(
  'email-queue-processing',
  '*/15 * * * *',
  'SELECT process_email_queue();'
);

-- Weekly analytics reports on Mondays at 9 AM
SELECT cron.schedule(
  'weekly-analytics',
  '0 9 * * 1',
  'SELECT generate_weekly_analytics();'
);

-- Monthly rewards summary on the 1st at 10 AM
SELECT cron.schedule(
  'monthly-rewards-summary',
  '0 10 1 * *',
  'SELECT send_monthly_rewards_summary();'
);

-- Update user engagement metrics daily at 3 AM
SELECT cron.schedule(
  'user-engagement-update',
  '0 3 * * *',
  'SELECT update_user_engagement_metrics();'
);

-- Database performance optimization weekly on Sundays at 1 AM
SELECT cron.schedule(
  'database-optimization',
  '0 1 * * 0',
  'SELECT optimize_database_performance();'
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert Cape Town restaurant data
INSERT INTO restaurants (name, location, cuisine, capacity, description, image_url) VALUES
  (
    'The Test Kitchen', 
    'Woodstock, Cape Town', 
    'Contemporary South African', 
    60,
    'Award-winning restaurant offering innovative South African cuisine with global influences. Located in the trendy Woodstock area with stunning Table Mountain views.',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
  ),
  (
    'La Colombe', 
    'Constantia, Cape Town', 
    'French-South African', 
    80,
    'Elegant fine dining restaurant in the heart of the Constantia wine region, serving French cuisine with South African flair and exceptional wine pairings.',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  ),
  (
    'Gold Restaurant', 
    'Green Point, Cape Town', 
    'African Continental', 
    120,
    'Authentic African dining experience featuring traditional dishes from across the continent, complete with cultural entertainment and communal dining.',
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg'
  ),
  (
    'Harbour House', 
    'V&A Waterfront, Cape Town', 
    'Seafood', 
    100,
    'Premium seafood restaurant overlooking the Atlantic Ocean at the V&A Waterfront, specializing in fresh West Coast seafood and sushi.',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
  ),
  (
    'Mama Africa', 
    'Long Street, Cape Town', 
    'Traditional African', 
    90,
    'Vibrant restaurant on historic Long Street serving traditional African cuisine including bobotie, potjiekos, and game meats with live African music.',
    'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'
  ),
  (
    'Kloof Street House', 
    'Gardens, Cape Town', 
    'Modern South African', 
    70,
    'Charming Victorian house restaurant in Gardens serving modern South African cuisine with a focus on local ingredients and craft cocktails.',
    'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg'
  ),
  (
    'The Pot Luck Club', 
    'Woodstock, Cape Town', 
    'Contemporary Tapas', 
    50,
    'Trendy rooftop restaurant in the Old Biscuit Mill offering contemporary small plates with panoramic views of Table Mountain and the city.',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
  ),
  (
    'Bokaap Kombuis', 
    'Bo-Kaap, Cape Town', 
    'Cape Malay', 
    40,
    'Authentic Cape Malay restaurant in the colorful Bo-Kaap quarter, serving traditional curries, bredie, and koeksisters in a historic setting.',
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg'
  ),
  (
    'Codfather Seafood', 
    'Camps Bay, Cape Town', 
    'Seafood', 
    85,
    'Popular seafood restaurant on the Camps Bay strip with ocean views, famous for fresh fish, calamari, and traditional fish and chips.',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
  ),
  (
    'Societi Bistro', 
    'Kalk Bay, Cape Town', 
    'Mediterranean-South African', 
    65,
    'Charming bistro in the fishing village of Kalk Bay, offering Mediterranean-inspired dishes with South African influences and fresh local seafood.',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  )
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT SELECT ON cron.job TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Log the migration completion
INSERT INTO email_notifications (
  recipient_email,
  subject,
  body,
  created_at
) VALUES (
  'admin@tablerewards.co.za',
  'Complete Database Schema Deployed',
  'The complete TableRewards database schema has been successfully deployed. This includes all tables, functions, triggers, RLS policies, storage configuration, scheduled jobs, and sample data. The system is now fully operational with Cape Town restaurant data.',
  now()
);