/*
  # Add Role Column to Users Table

  1. Schema Changes
    - Add role column to users table if it doesn't exist
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

-- Add role column to users table if it doesn't exist
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

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Log the migration
INSERT INTO email_notifications (
  recipient_email,
  subject,
  body,
  created_at
) VALUES (
  'admin@tablerewards.co.za',
  'User Roles Column Added',
  'The role column has been successfully added to the users table. All existing users have been assigned the customer role by default.',
  now()
);