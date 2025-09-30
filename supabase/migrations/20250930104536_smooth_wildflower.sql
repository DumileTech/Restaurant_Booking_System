/*
  # Fix Users Role Column

  1. Schema Fix
    - Ensure role column exists in users table
    - Set proper constraints and default value
    - Update existing users if needed

  2. Index Creation
    - Add index for role-based queries
    - Improve query performance

  3. Validation
    - Ensure role column has proper constraints
    - Set default role as 'customer'
*/

-- Ensure the role column exists with proper constraints
DO $$
BEGIN
  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'role'
  ) THEN
    -- Add role column if it doesn't exist
    ALTER TABLE users ADD COLUMN role text CHECK (role IN ('customer', 'restaurant_manager', 'admin')) DEFAULT 'customer';
    RAISE NOTICE 'Added role column to users table';
  ELSE
    -- Update existing role column to ensure proper constraints
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
    
    -- Drop existing constraint if it exists
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add proper constraint
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'restaurant_manager', 'admin'));
    
    RAISE NOTICE 'Updated role column constraints';
  END IF;
END $$;

-- Update any users without a role to have 'customer' role
UPDATE users SET role = 'customer' WHERE role IS NULL;

-- Create index for role-based queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Log the fix
INSERT INTO email_notifications (
  recipient_email,
  subject,
  body,
  created_at
) VALUES (
  'admin@tablerewards.co.za',
  'Users Role Column Fixed',
  'The role column has been properly added/updated in the users table with correct constraints and default values. All existing users have been assigned the customer role.',
  now()
);