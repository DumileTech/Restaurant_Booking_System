# TableRewards - Restaurant Booking System

A comprehensive restaurant booking system built with Next.js, Supabase, and TypeScript. Features include table reservations, reward points, admin dashboard, and file storage.

## Features

### 🍽️ Restaurant Management
- Browse restaurants with filtering by cuisine, location, and search
- Detailed restaurant pages with menus, photos, and information
- Admin dashboard for restaurant owners
- Real-time availability checking

### 📅 Booking System
- Interactive booking form with date/time selection
- Automatic availability validation
- Booking status management (pending, confirmed, cancelled)
- Email notifications for booking confirmations

### 🎯 Rewards Program
- Earn 10 points for each confirmed booking
- Track reward history and points balance
- Monthly points summary
- Automatic point allocation system

### 👤 User Management
- User authentication with Supabase Auth
- User profiles and account management
- Booking history and management
- Points and rewards tracking

### 📁 File Storage
- Restaurant image uploads
- User avatar management
- Document storage for restaurants
- Secure file access with policies

### 📧 Email Notifications
- Booking confirmation emails
- Automated email triggers
- Email history tracking
- Template-based notifications
- **Resender Integration**: Professional email delivery service
- **Automated Reminders**: Daily booking reminders via cron jobs
- **Monthly Summaries**: Reward point summaries for active users
- **Supabase Webhooks**: Real-time email triggers via database events
- **Edge Functions**: Serverless email processing with Supabase Edge Functions
- **Database Triggers**: Automatic webhook calls on booking status changes
- **Webhook Endpoints**: RESTful webhook receivers for external integrations
- **Real-time Notifications**: Instant email sending when bookings are confirmed
- **Scalable Architecture**: Event-driven email system using Supabase's native features
- **Beautiful Templates**: HTML email templates with responsive design

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), React, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Functions)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage with bucket policies
- **Email Service**: Resender for transactional emails
- **Webhooks**: Supabase Database Webhooks
- **Edge Functions**: Supabase Edge Functions for serverless email processing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd restaurant-booking-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=your_cron_secret_for_scheduled_jobs
```

4. Run database migrations:
```bash
# Apply the existing migration
# The migration file is already in supabase/migrations/

# Apply additional migrations for storage and functions
# Run the SQL files in your Supabase dashboard or via CLI
```

5. Start the development server:
```bash
npm run dev
```

### Supabase Webhook Configuration

To enable automatic email sending via webhooks:

1. **Deploy Edge Functions**:
```bash
# Deploy the booking email function
supabase functions deploy send-booking-email

# Deploy the reminder function  
supabase functions deploy send-booking-reminders
```

2. **Set Environment Variables** in Supabase Dashboard:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

3. **Configure Database Webhooks** in Supabase Dashboard:
   - Go to Database → Webhooks
   - Create webhook for `bookings` table
   - Set URL to your Edge Function: `https://your-project.supabase.co/functions/v1/send-booking-email`
   - Enable for `INSERT` and `UPDATE` events

4. **Set up Cron Jobs** for reminders:
```bash
# Schedule daily reminder function
supabase functions schedule send-booking-reminders --cron "0 9 * * *"
```

### Manual Webhook Testing

```bash
# Test booking confirmation webhook
curl -X POST https://your-project.supabase.co/functions/v1/send-booking-email

# Test reminder function
curl -X POST https://your-project.supabase.co/functions/v1/send-booking-reminders
```

## Database Schema

### Tables

- **users**: User profiles with reward points
- **restaurants**: Restaurant information and settings
- **bookings**: Table reservations with status tracking
- **rewards**: Point transaction history
- **email_notifications**: Email notification queue
- **user_engagement_metrics**: User engagement tracking and scoring

### Functions

- `get_restaurant_availability()`: Check table availability
- `create_booking_with_validation()`: Create booking with validation
- `get_user_dashboard()`: Get user dashboard data
- `get_restaurant_analytics()`: Restaurant performance metrics
- `cleanup_old_data()`: Database maintenance
- `send_booking_reminders()`: Automated booking reminders
- `generate_weekly_analytics()`: Weekly performance reports
- `process_email_queue()`: Email queue processing
- `send_monthly_rewards_summary()`: Monthly user rewards summary
- `update_user_engagement_metrics()`: User engagement scoring
- `optimize_database_performance()`: Database optimization
- `get_scheduled_jobs()`: View all cron jobs
- `manage_cron_job()`: Manage cron job lifecycle

### Storage Buckets

- `restaurant-images`: Public restaurant photos
- `user-avatars`: Private user profile pictures
- `documents`: Restaurant documents and menus

### Scheduled Jobs (pg_cron)

- **Daily Cleanup** (2:00 AM): Remove old cancelled bookings and notifications
- **Booking Reminders** (Every hour): Send reminders for tomorrow's bookings
- **Email Processing** (Every 15 minutes): Process email notification queue
- **Weekly Analytics** (Mondays 9:00 AM): Generate restaurant performance reports
- **Monthly Rewards** (1st of month 10:00 AM): Send monthly rewards summaries
- **User Engagement** (Daily 3:00 AM): Update user engagement metrics
- **Database Optimization** (Sundays 1:00 AM): Analyze tables and optimize performance

### Email Service Integration

The system uses **Resender** for reliable email delivery:

#### Email Types
- **Booking Confirmations**: Sent when bookings are confirmed
- **Booking Reminders**: Sent 24 hours before reservation
- **Monthly Summaries**: Monthly reward point summaries

#### Webhook-Triggered Emails
- **Real-time Confirmations**: Automatically sent via Supabase webhooks when booking status changes to 'confirmed'
- **Database Triggers**: Native PostgreSQL triggers call Edge Functions for instant email delivery
- **Scalable Processing**: Edge Functions handle email sending without blocking the main application

#### Edge Function Architecture
```
Database Event → Webhook Trigger → Edge Function → Resender API → Email Delivered
```

This architecture ensures reliable, scalable email delivery with minimal latency and no impact on the main application performance.

#### Manual Email Triggers
```bash
# Send booking reminders manually
curl -X POST http://localhost:3000/api/cron/reminders

# Send monthly summaries manually  
curl -X POST http://localhost:3000/api/cron/monthly-summary

# Send custom email via API
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"type": "booking_confirmation", "data": {...}}'
```

#### Webhook Endpoints
```bash
# Supabase webhook receiver
POST /api/webhooks/supabase
```

#### Email Templates
All emails use responsive HTML templates with:
- Professional TableRewards branding
- Mobile-friendly responsive design
- Clear call-to-actions and booking details
- South African date/time formatting

### Webhook Integration

The system uses Supabase's native webhook functionality:

- **Database Triggers**: Automatically fire when booking status changes
- **Edge Functions**: Process webhook payloads and send emails via Resender
- **Real-time Processing**: Emails sent immediately when bookings are confirmed
- **Reliable Delivery**: Built-in retry logic and error handling
- **Monitoring**: All webhook calls logged in `email_notifications` table

## Supabase CLI Operations

This project includes a comprehensive CLI tool for managing all Supabase operations:

### Basic Usage

```bash
# Show help
npm run supabase:cli

# Restaurant operations
npm run supabase:restaurant:list
npx tsx scripts/supabase-cli.ts restaurant create --name "New Restaurant" --location "Downtown"
npx tsx scripts/supabase-cli.ts restaurant get --id "restaurant-id"
npx tsx scripts/supabase-cli.ts restaurant availability --id "restaurant-id" --date "2024-01-15"

# Booking operations  
npm run supabase:booking:list
npx tsx scripts/supabase-cli.ts booking create --user_id "user-id" --restaurant_id "restaurant-id" --date "2024-01-15" --time "19:00"
npx tsx scripts/supabase-cli.ts booking confirm --id "booking-id"
npx tsx scripts/supabase-cli.ts booking cancel --id "booking-id"

# User operations
npm run supabase:user:list
npx tsx scripts/supabase-cli.ts user dashboard --id "user-id"
npx tsx scripts/supabase-cli.ts user add-points --id "user-id" --points "50" --reason "Bonus points"

# Storage operations
npm run supabase:storage:list
npx tsx scripts/supabase-cli.ts storage list-files --bucket "restaurant-images"
npx tsx scripts/supabase-cli.ts storage get-url --bucket "restaurant-images" --path "image.jpg"

# Email operations
npm run supabase:email:list
npx tsx scripts/supabase-cli.ts email send --email "user@example.com" --subject "Test" --body "Hello World"

# Database operations
npm run supabase:db:stats
npm run supabase:db:cleanup

# Cron job operations
npm run supabase:cron:list
npx tsx scripts/supabase-cli.ts database manage-cron --action "enable" --job_name "daily-cleanup"
npx tsx scripts/supabase-cli.ts database manage-cron --action "create" --job_name "custom-job" --job_schedule "0 12 * * *" --job_command "SELECT now();"

# Manual job execution
npm run supabase:jobs:reminders
npm run supabase:jobs:emails
npm run supabase:jobs:analytics
npm run supabase:jobs:rewards
npm run supabase:jobs:engagement
npm run supabase:jobs:optimize
```

### Advanced Examples

```bash
# Create a complete restaurant
npx tsx scripts/supabase-cli.ts restaurant create \
  --name "The Garden Bistro" \
  --location "Downtown" \
  --cuisine "Mediterranean" \
  --capacity "80" \
  --description "Fresh Mediterranean cuisine"

# Create a booking with validation
npx tsx scripts/supabase-cli.ts booking create \
  --user_id "123e4567-e89b-12d3-a456-426614174000" \
  --restaurant_id "456e7890-e89b-12d3-a456-426614174001" \
  --date "2024-01-20" \
  --time "19:30" \
  --party_size "4" \
  --special_requests "Window table please"

# Get restaurant analytics
npx tsx scripts/supabase-cli.ts restaurant analytics \
  --id "restaurant-id" \
  --start_date "2024-01-01" \
  --end_date "2024-01-31"

# List bookings with filters
npx tsx scripts/supabase-cli.ts booking list \
  --restaurant_id "restaurant-id" \
  --status "confirmed"

# Get signed URL for private file
npx tsx scripts/supabase-cli.ts storage get-url \
  --bucket "user-avatars" \
  --path "user-id/avatar.jpg" \
  --signed "true" \
  --expires "7200"

# Cron job management
npx tsx scripts/supabase-cli.ts database cron-jobs
npx tsx scripts/supabase-cli.ts database manage-cron --action "list"
npx tsx scripts/supabase-cli.ts database manage-cron --action "disable" --job_name "daily-cleanup"
npx tsx scripts/supabase-cli.ts database manage-cron --action "enable" --job_name "daily-cleanup"

# Create custom scheduled job
npx tsx scripts/supabase-cli.ts database manage-cron \
  --action "create" \
  --job_name "custom-backup" \
  --job_schedule "0 4 * * 0" \
  --job_command "SELECT cleanup_old_data();"

# Manual job execution
npx tsx scripts/supabase-cli.ts database send-reminders
npx tsx scripts/supabase-cli.ts database process-emails
npx tsx scripts/supabase-cli.ts database weekly-analytics
npx tsx scripts/supabase-cli.ts database monthly-rewards
npx tsx scripts/supabase-cli.ts database update-engagement
npx tsx scripts/supabase-cli.ts database optimize
```

## API Endpoints

### Query Functions

All database operations are centralized in `lib/queries/`:

- `restaurant.queries.ts`: Restaurant CRUD operations
- `booking.queries.ts`: Booking management
- `user.queries.ts`: User profile operations
- `rewards.queries.ts`: Rewards system
- `storage.queries.ts`: File storage operations

### Usage Examples

```typescript
import { getAllRestaurants, getRestaurantById } from '@/lib/queries/restaurant.queries'
import { createBookingWithValidation } from '@/lib/queries/booking.queries'
import { getUserDashboard } from '@/lib/queries/user.queries'

// Get restaurants with filters
const restaurants = await getAllRestaurants({
  cuisine: 'Italian',
  location: 'Downtown'
})

// Create booking with validation
const result = await createBookingWithValidation({
  user_id: 'user-id',
  restaurant_id: 'restaurant-id',
  date: '2024-01-15',
  time: '19:00',
  party_size: 2
})

// Get user dashboard data
const dashboard = await getUserDashboard('user-id')
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only access their own data
- Restaurant admins can manage their restaurants
- Public read access for restaurant information
- Secure file storage with user-based policies

## Email Notifications

Automatic email notifications are sent for:

- Booking confirmations
- Booking cancellations
- Point rewards
- System notifications

Email templates can be customized in the database functions.

## Storage Management

Three storage buckets with different access levels:

1. **restaurant-images** (public): Restaurant photos
2. **user-avatars** (private): User profile pictures  
3. **documents** (private): Restaurant documents

## Deployment

### Static Export

The app is configured for static export:

```bash
npm run build
```

This generates static files that can be deployed to any hosting service.

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Check the documentation
- Use the CLI tool for database operations
- Review the query functions for API usage
- Check Supabase dashboard for real-time data