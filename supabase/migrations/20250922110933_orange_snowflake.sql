/*
  # Restaurant Booking System Database Schema

  1. New Tables
    - `users` - User profiles with reward points tracking
    - `restaurants` - Restaurant information and capacity
    - `bookings` - Table reservations with status tracking
    - `rewards` - Point transaction history

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin policies for restaurant management

  3. Features
    - Automatic point rewards on booking confirmation
    - Restaurant capacity management
    - Booking status workflow
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Anyone can read restaurants"
  ON restaurants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Restaurant admins can update own restaurant"
  ON restaurants FOR ALL
  TO authenticated
  USING (auth.uid() = admin_id);

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Restaurant admins can read their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant admins can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE admin_id = auth.uid()
    )
  );

-- Rewards policies
CREATE POLICY "Users can read own rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO restaurants (name, location, cuisine, description, image_url) VALUES
  ('The Garden Bistro', 'Downtown', 'Mediterranean', 'Fresh, locally-sourced Mediterranean cuisine in an elegant garden setting', 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'),
  ('Sakura Sushi', 'Midtown', 'Japanese', 'Authentic Japanese sushi and sashimi prepared by master chefs', 'https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg'),
  ('La Bella Italia', 'Little Italy', 'Italian', 'Traditional Italian recipes passed down through generations', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'),
  ('The Spice Route', 'Cultural District', 'Indian', 'Aromatic spices and bold flavors from across the Indian subcontinent', 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg'),
  ('Ocean View Grill', 'Waterfront', 'Seafood', 'Fresh seafood with stunning ocean views and coastal atmosphere', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'),
  ('The French Table', 'Arts Quarter', 'French', 'Classic French cuisine with a modern twist in an intimate setting', 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg');

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

-- Trigger for automatic point rewards
DROP TRIGGER IF EXISTS booking_confirmation_reward ON bookings;
CREATE TRIGGER booking_confirmation_reward
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_confirmation();