#!/usr/bin/env node

/**
 * Supabase CLI Operations Script
 * 
 * This script provides comprehensive CRUD operations for all Supabase tables,
 * functions, storage, and email notifications.
 * 
 * Usage: npx tsx scripts/supabase-cli.ts [command] [options]
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Command line argument parsing
const command = process.argv[2]
const args = process.argv.slice(3)

// Utility functions
function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {}
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      parsed[args[i].substring(2)] = args[i + 1] || 'true'
    }
  }
  return parsed
}

function logResult(operation: string, result: any, error?: any) {
  console.log(`\n=== ${operation.toUpperCase()} ===`)
  if (error) {
    console.error('❌ Error:', error.message)
  } else {
    console.log('✅ Success:', JSON.stringify(result, null, 2))
  }
  console.log('================\n')
}

// Restaurant CRUD Operations
async function restaurantOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'list':
      const { data: restaurants, error: listError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name')
      logResult('List Restaurants', restaurants, listError)
      break

    case 'get':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: restaurant, error: getError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', options.id)
        .single()
      logResult('Get Restaurant', restaurant, getError)
      break

    case 'create':
      const newRestaurant = {
        name: options.name || 'New Cape Town Restaurant',
        location: options.location || 'Cape Town, South Africa',
        cuisine: options.cuisine || 'South African',
        capacity: parseInt(options.capacity || '50'),
        description: options.description || 'A wonderful Cape Town dining experience with local flavors and hospitality',
        admin_id: options.admin_id || null
      }
      const { data: created, error: createError } = await supabase
        .from('restaurants')
        .insert(newRestaurant)
        .select()
        .single()
      logResult('Create Restaurant', created, createError)
      break

    case 'update':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const updates: any = {}
      if (options.name) updates.name = options.name
      if (options.location) updates.location = options.location
      if (options.cuisine) updates.cuisine = options.cuisine
      if (options.capacity) updates.capacity = parseInt(options.capacity)
      if (options.description) updates.description = options.description

      const { data: updated, error: updateError } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', options.id)
        .select()
        .single()
      logResult('Update Restaurant', updated, updateError)
      break

    case 'delete':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { error: deleteError } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', options.id)
      logResult('Delete Restaurant', { deleted: true }, deleteError)
      break

    case 'availability':
      if (!options.id || !options.date) {
        console.error('Missing --id or --date parameter')
        return
      }
      const { data: availability, error: availError } = await supabase
        .rpc('get_restaurant_availability', {
          restaurant_id_param: options.id,
          date_param: options.date,
          party_size_param: parseInt(options.party_size || '2')
        })
      logResult('Restaurant Availability', availability, availError)
      break

    case 'analytics':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: analytics, error: analyticsError } = await supabase
        .rpc('get_restaurant_analytics', {
          restaurant_id_param: options.id,
          start_date: options.start_date,
          end_date: options.end_date
        })
      logResult('Restaurant Analytics', analytics, analyticsError)
      break

    default:
      console.log('Available restaurant operations: list, get, create, update, delete, availability, analytics')
  }
}

// Booking CRUD Operations
async function bookingOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'list':
      let query = supabase
        .from('bookings')
        .select(`
          *,
          restaurants (name, location),
          users (email, name)
        `)
        .order('created_at', { ascending: false })

      if (options.user_id) {
        query = query.eq('user_id', options.user_id)
      }
      if (options.restaurant_id) {
        query = query.eq('restaurant_id', options.restaurant_id)
      }
      if (options.status) {
        query = query.eq('status', options.status)
      }

      const { data: bookings, error: listError } = await query.limit(50)
      logResult('List Bookings', bookings, listError)
      break

    case 'get':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: booking, error: getError } = await supabase
        .from('bookings')
        .select(`
          *,
          restaurants (name, location),
          users (email, name)
        `)
        .eq('id', options.id)
        .single()
      logResult('Get Booking', booking, getError)
      break

    case 'create':
      if (!options.user_id || !options.restaurant_id || !options.date || !options.time) {
        console.error('Missing required parameters: user_id, restaurant_id, date, time')
        return
      }

      // Use the validation function
      const { data: createResult, error: createError } = await supabase
        .rpc('create_booking_with_validation', {
          user_id_param: options.user_id,
          restaurant_id_param: options.restaurant_id,
          date_param: options.date,
          time_param: options.time,
          party_size_param: parseInt(options.party_size || '2'),
          special_requests_param: options.special_requests || null
        })
      logResult('Create Booking', createResult, createError)
      break

    case 'update':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const updates: any = {}
      if (options.date) updates.date = options.date
      if (options.time) updates.time = options.time
      if (options.party_size) updates.party_size = parseInt(options.party_size)
      if (options.status) updates.status = options.status
      if (options.special_requests) updates.special_requests = options.special_requests

      const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', options.id)
        .select()
        .single()
      logResult('Update Booking', updated, updateError)
      break

    case 'delete':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', options.id)
      logResult('Delete Booking', { deleted: true }, deleteError)
      break

    case 'confirm':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: confirmed, error: confirmError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', options.id)
        .select()
        .single()
      logResult('Confirm Booking', confirmed, confirmError)
      break

    case 'cancel':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: cancelled, error: cancelError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', options.id)
        .select()
        .single()
      logResult('Cancel Booking', cancelled, cancelError)
      break

    default:
      console.log('Available booking operations: list, get, create, update, delete, confirm, cancel')
  }
}

// User CRUD Operations
async function userOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'list':
      const { data: users, error: listError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      logResult('List Users', users, listError)
      break

    case 'get':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: user, error: getError } = await supabase
        .from('users')
        .select('*')
        .eq('id', options.id)
        .single()
      logResult('Get User', user, getError)
      break

    case 'dashboard':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: dashboard, error: dashboardError } = await supabase
        .rpc('get_user_dashboard', {
          user_id_param: options.id
        })
      logResult('User Dashboard', dashboard, dashboardError)
      break

    case 'update':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const updates: any = {}
      if (options.name) updates.name = options.name
      if (options.points) updates.points = parseInt(options.points)

      const { data: updated, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', options.id)
        .select()
        .single()
      logResult('Update User', updated, updateError)
      break

    case 'add-points':
      if (!options.id || !options.points) {
        console.error('Missing --id or --points parameter')
        return
      }
      
      // Get current points
      const { data: currentUser } = await supabase
        .from('users')
        .select('points')
        .eq('id', options.id)
        .single()

      const newPoints = (currentUser?.points || 0) + parseInt(options.points)
      
      const { data: updatedUserPoints, error: updateUserPointsError } = await supabase
        .from('users')
        .update({ points: newPoints })
        .eq('id', options.id)
        .select()
        .single()

      // Create reward record
      if (!updateUserPointsError) {
        await supabase
          .from('rewards')
          .insert({
            user_id: options.id,
            points_change: parseInt(options.points),
            reason: options.reason || 'Manual points addition'
          })
      }

      logResult('Add Points to User', updatedUserPoints, updateUserPointsError)
      break

    default:
      console.log('Available user operations: list, get, dashboard, update, add-points')
  }
}

// Storage Operations
async function storageOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'list-buckets':
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      logResult('List Storage Buckets', buckets, bucketsError)
      break

    case 'list-files':
      if (!options.bucket) {
        console.error('Missing --bucket parameter')
        return
      }
      const { data: files, error: filesError } = await supabase.storage
        .from(options.bucket)
        .list(options.path || '', {
          limit: parseInt(options.limit || '100'),
          offset: parseInt(options.offset || '0')
        })
      logResult('List Files', files, filesError)
      break

    case 'get-url':
      if (!options.bucket || !options.path) {
        console.error('Missing --bucket or --path parameter')
        return
      }
      
      if (options.signed === 'true') {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from(options.bucket)
          .createSignedUrl(options.path, parseInt(options.expires || '3600'))
        logResult('Get Signed URL', signedUrl, urlError)
      } else {
        const { data: publicUrl } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(options.path)
        logResult('Get Public URL', publicUrl, null)
      }
      break

    case 'delete-file':
      if (!options.bucket || !options.path) {
        console.error('Missing --bucket or --path parameter')
        return
      }
      const { data: deleted, error: deleteError } = await supabase.storage
        .from(options.bucket)
        .remove([options.path])
      logResult('Delete File', deleted, deleteError)
      break

    default:
      console.log('Available storage operations: list-buckets, list-files, get-url, delete-file')
  }
}

// Email Operations
async function emailOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'list':
      const { data: emails, error: listError } = await supabase
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      logResult('List Email Notifications', emails, listError)
      break

    case 'get':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: email, error: getError } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('id', options.id)
        .single()
      logResult('Get Email Notification', email, getError)
      break

    case 'send':
      if (!options.email || !options.subject || !options.body) {
        console.error('Missing required parameters: email, subject, body')
        return
      }
      const { data: sent, error: sendError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: options.email,
          subject: options.subject,
          body: options.body,
          booking_id: options.booking_id || null
        })
        .select()
        .single()
      logResult('Send Email Notification', sent, sendError)
      break

    case 'mark-sent':
      if (!options.id) {
        console.error('Missing --id parameter')
        return
      }
      const { data: marked, error: markError } = await supabase
        .from('email_notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', options.id)
        .select()
        .single()
      logResult('Mark Email as Sent', marked, markError)
      break

    default:
      console.log('Available email operations: list, get, send, mark-sent')
  }
}

// Database Operations
async function databaseOperations(operation: string, options: Record<string, string>) {
  switch (operation) {
    case 'cleanup':
      const { data: cleanup, error: cleanupError } = await supabase
        .rpc('cleanup_old_data')
      logResult('Database Cleanup', { completed: true }, cleanupError)
      break

    case 'stats':
      const stats = await Promise.all([
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('rewards').select('id', { count: 'exact', head: true })
      ])

      const dbStats = {
        restaurants: stats[0].count,
        bookings: stats[1].count,
        users: stats[2].count,
        rewards: stats[3].count
      }
      logResult('Database Statistics', dbStats, null)
      break

    case 'cron-jobs':
      const { data: jobs, error: jobsError } = await supabase
        .rpc('get_scheduled_jobs')
      logResult('Scheduled Cron Jobs', jobs, jobsError)
      break

    case 'manage-cron':
      if (!options.action) {
        console.error('Missing --action parameter (list, enable, disable, delete, create)')
        return
      }
      
      const { data: cronResult, error: cronError } = await supabase
        .rpc('manage_cron_job', {
          action: options.action,
          job_name: options.job_name || null,
          job_schedule: options.job_schedule || null,
          job_command: options.job_command || null
        })
      logResult('Cron Job Management', cronResult, cronError)
      break

    case 'send-reminders':
      const { data: reminders, error: remindersError } = await supabase
        .rpc('send_booking_reminders')
      logResult('Send Booking Reminders', { completed: true }, remindersError)
      break

    case 'process-emails':
      const { data: emailProcess, error: emailError } = await supabase
        .rpc('process_email_queue')
      logResult('Process Email Queue', { completed: true }, emailError)
      break

    case 'weekly-analytics':
      const { data: analytics, error: analyticsError } = await supabase
        .rpc('generate_weekly_analytics')
      logResult('Generate Weekly Analytics', { completed: true }, analyticsError)
      break

    case 'monthly-rewards':
      const { data: monthlyRewards, error: monthlyError } = await supabase
        .rpc('send_monthly_rewards_summary')
      logResult('Send Monthly Rewards Summary', { completed: true }, monthlyError)
      break

    case 'update-engagement':
      const { data: engagement, error: engagementError } = await supabase
        .rpc('update_user_engagement_metrics')
      logResult('Update User Engagement Metrics', { completed: true }, engagementError)
      break

    case 'optimize':
      const { data: optimize, error: optimizeError } = await supabase
        .rpc('optimize_database_performance')
      logResult('Database Performance Optimization', { completed: true }, optimizeError)
      break
    default:
      console.log('Available database operations: cleanup, stats, cron-jobs, manage-cron, send-reminders, process-emails, weekly-analytics, monthly-rewards, update-engagement, optimize')
  }
}

// Main command router
async function main() {
  const options = parseArgs(args)

  if (!command) {
    console.log(`
Supabase CLI Operations

Usage: npx tsx scripts/supabase-cli.ts [command] [options]

Commands:
  restaurant [operation]  - Restaurant CRUD operations
  booking [operation]     - Booking CRUD operations  
  user [operation]        - User CRUD operations
  storage [operation]     - Storage operations
  email [operation]       - Email operations
  database [operation]    - Database operations

Examples:
  npx tsx scripts/supabase-cli.ts restaurant list
  npx tsx scripts/supabase-cli.ts restaurant create --name "New Restaurant" --location "Downtown"
  npx tsx scripts/supabase-cli.ts booking list --user_id "123"
  npx tsx scripts/supabase-cli.ts user add-points --id "123" --points "50" --reason "Bonus points"
  npx tsx scripts/supabase-cli.ts storage list-files --bucket "restaurant-images"
  npx tsx scripts/supabase-cli.ts email send --email "user@example.com" --subject "Test" --body "Hello"
  npx tsx scripts/supabase-cli.ts database stats
    `)
    return
  }

  const [entity, operation] = command.split(':')
  const op = operation || args[0]

  try {
    switch (entity) {
      case 'restaurant':
        await restaurantOperations(op, options)
        break
      case 'booking':
        await bookingOperations(op, options)
        break
      case 'user':
        await userOperations(op, options)
        break
      case 'storage':
        await storageOperations(op, options)
        break
      case 'email':
        await emailOperations(op, options)
        break
      case 'database':
        await databaseOperations(op, options)
        break
      default:
        console.error(`Unknown command: ${command}`)
        console.log('Available commands: restaurant, booking, user, storage, email, database')
    }
  } catch (error) {
    console.error('Command failed:', error)
    process.exit(1)
  }
}

// Run the CLI
main().catch(console.error)