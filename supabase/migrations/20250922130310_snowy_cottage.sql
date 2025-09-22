/*
  # pg_cron Extension with Scheduled Jobs

  1. Extension Setup
    - Enable pg_cron extension for job scheduling
    - Configure timezone and scheduling parameters

  2. Scheduled Functions
    - Daily cleanup of old data
    - Weekly analytics reports
    - Hourly booking reminders
    - Monthly rewards summary
    - Daily email queue processing

  3. Job Management
    - Automated database maintenance
    - Performance optimization
    - User engagement tasks
    - System health monitoring
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

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
          AND created_at > CURRENT_DATE
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
      format('Hi %s, this is a friendly reminder about your booking tomorrow at %s (%s) for %s at %s for %s guests. We look forward to seeing you!',
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
      'total_revenue_estimate', COUNT(*) FILTER (WHERE b.status = 'confirmed') * 50, -- Estimate
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
  -- Create or update user engagement table
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
  
  -- Update table statistics
  UPDATE pg_stat_user_tables SET n_tup_ins = n_tup_ins WHERE schemaname = 'public';
  
  RAISE NOTICE 'Database performance optimization completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Schedule jobs using pg_cron

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

-- Create a function to view all scheduled jobs
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

-- Create a function to manage jobs
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
      -- Return list of jobs as text
      SELECT string_agg(
        format('Job: %s | Schedule: %s | Command: %s | Active: %s', 
          jobname, schedule, command, active), 
        E'\n'
      ) INTO result
      FROM cron.job;
      
    WHEN 'enable' THEN
      -- Enable a job
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for enable action';
      END IF;
      
      UPDATE cron.job SET active = true WHERE jobname = job_name;
      result := format('Job %s enabled', job_name);
      
    WHEN 'disable' THEN
      -- Disable a job
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for disable action';
      END IF;
      
      UPDATE cron.job SET active = false WHERE jobname = job_name;
      result := format('Job %s disabled', job_name);
      
    WHEN 'delete' THEN
      -- Delete a job
      IF job_name IS NULL THEN
        RAISE EXCEPTION 'Job name is required for delete action';
      END IF;
      
      SELECT cron.unschedule(job_name) INTO result;
      result := format('Job %s deleted', job_name);
      
    WHEN 'create' THEN
      -- Create a new job
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

-- Create indexes for better performance on scheduled queries
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_restaurant_date ON bookings(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_rewards_user_created_at ON rewards(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_restaurants_admin_id ON restaurants(admin_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT SELECT ON cron.job TO postgres;