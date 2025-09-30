/*
  # Add User Roles System

  1. Schema Changes
    - Add role column to users table
    - Set default role as 'customer'
    - Update existing users to have customer role

  2. Role Types
    - customer: Regular users who make bookings
    - restaurant_manager: Can manage specific restaurants
    - admin: Full system access

  3. Security
    - Update RLS policies to consider roles
    - Ensure proper access control
*/

-- Add role column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text CHECK (role IN ('customer', 'restaurant_manager', 'admin')) DEFAULT 'customer';
  END IF;
END $$;

-- Update existing users to have customer role
UPDATE users SET role = 'customer' WHERE role IS NULL;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (OLD.role = NEW.role OR NEW.role IS NULL) -- Prevent role changes
  );

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update restaurant policies for restaurant managers
DROP POLICY IF EXISTS "Restaurant admins can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant admins can read their bookings" ON bookings;
DROP POLICY IF EXISTS "Restaurant admins can update their bookings" ON bookings;

-- Restaurant managers can manage their restaurants
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

-- Restaurant managers can read bookings for their restaurants
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

-- Restaurant managers can update bookings for their restaurants
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

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update rewards policies
DROP POLICY IF EXISTS "Users can read own rewards" ON rewards;

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

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Log the migration
INSERT INTO email_notifications (
  recipient_email,
  subject,
  body,
  created_at
) VALUES (
  'rethabile@hapogroup.co.za',
  'User Roles System Added',
  'User roles system has been successfully implemented. Users now have roles: customer (default), restaurant_manager, and admin. RLS policies have been updated to enforce role-based access control.',
  now()
);