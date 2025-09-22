import { z } from 'zod'

// Validation schemas
export const bookingSchema = z.object({
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
  date: z.string().refine((date) => {
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return bookingDate >= today
  }, 'Booking date must be today or in the future'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  party_size: z.number().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20'),
  special_requests: z.string().max(500, 'Special requests cannot exceed 500 characters').optional()
})

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional(),
  email: z.string().email('Invalid email format').optional()
})

export const restaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(100, 'Name cannot exceed 100 characters'),
  location: z.string().max(200, 'Location cannot exceed 200 characters').optional(),
  cuisine: z.string().max(50, 'Cuisine cannot exceed 50 characters').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(1000, 'Capacity cannot exceed 1000').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
})

export const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters').optional()
})

// Validation helper functions
export function validateBooking(data: any) {
  try {
    return { success: true, data: bookingSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    return { success: false, errors: [{ message: 'Validation failed' }] }
  }
}

export function validateUser(data: any) {
  try {
    return { success: true, data: userUpdateSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    return { success: false, errors: [{ message: 'Validation failed' }] }
  }
}

export function validateRestaurant(data: any) {
  try {
    return { success: true, data: restaurantSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    return { success: false, errors: [{ message: 'Validation failed' }] }
  }
}

export function validateAuth(data: any) {
  try {
    return { success: true, data: authSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    return { success: false, errors: [{ message: 'Validation failed' }] }
  }
}

// Sanitization functions
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}