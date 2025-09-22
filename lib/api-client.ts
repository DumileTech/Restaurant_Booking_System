import { handleApiError, logError } from './utils/errors'
import type { User, Restaurant, Booking, ApiResponse } from './types'

// Frontend API client - only communicates with Next.js API routes
class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`/api${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }))
        throw new Error(errorData.message || 'Request failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again')
      }
      logError(error, `API Request: ${endpoint}`)
      throw error
    }
  }

  // Auth methods with better error handling
  async register(email: string, password: string, name?: string): Promise<ApiResponse<User>> {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(), 
        password, 
        name: name?.trim() 
      }),
    })
  }

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(), 
        password 
      }),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  // Restaurant methods with validation
  async getRestaurants(filters?: { 
    cuisine?: string; 
    location?: string; 
    search?: string 
  }): Promise<ApiResponse<Restaurant[]>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getRestaurant(id: string): Promise<ApiResponse<Restaurant>> {
    if (!id) {
      throw new Error('Restaurant ID is required')
    }
    return this.request(`/restaurants/${id}`)
  }

  async getRestaurantAvailability(
    id: string, 
    date: string, 
    partySize: number = 2
  ): Promise<ApiResponse> {
    if (!id || !date) {
      throw new Error('Restaurant ID and date are required')
    }
    
    if (partySize < 1 || partySize > 20) {
      throw new Error('Party size must be between 1 and 20')
    }
    
    const params = new URLSearchParams()
    if (filters?.cuisine) params.set('cuisine', filters.cuisine)
    if (filters?.location) params.set('location', filters.location)
    if (filters?.search) params.set('search', filters.search)
    
    return this.request(`/restaurants?${params}`)
  }

  // Booking methods with validation
  async createBooking(booking: {
    restaurant_id: string
    date: string
    time: string
    party_size: number
    special_requests?: string
  }): Promise<ApiResponse<Booking>> {
    // Validate required fields
    if (!booking.restaurant_id || !booking.date || !booking.time || !booking.party_size) {
      throw new Error('All booking fields are required')
    }

    // Validate date is not in the past
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (bookingDate < today) {
      throw new Error('Booking date cannot be in the past')
    }

    // Validate party size
    if (booking.party_size < 1 || booking.party_size > 20) {
      throw new Error('Party size must be between 1 and 20')
    }

    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    })
  }

  async getBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request('/bookings')
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    if (!id) {
      throw new Error('Booking ID is required')
    }
    return this.request(`/bookings/${id}`)
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<ApiResponse<Booking>> {
    if (!id) {
      throw new Error('Booking ID is required')
    }
    
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided')
    }

    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async cancelBooking(id: string): Promise<ApiResponse> {
    if (!id) {
      throw new Error('Booking ID is required')
    }
    return this.request(`/bookings/${id}/cancel`, { method: 'POST' })
  }

  // User methods
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async updateProfile(updates: { name?: string }): Promise<ApiResponse<User>> {
    if (!updates.name?.trim()) {
      throw new Error('Name is required')
    }

    return this.request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: updates.name.trim() }),
    })
  }

  // Rewards
  async getRewards(): Promise<ApiResponse> {
    return this.request('/rewards')
  }

  async getRewardsSummary(): Promise<ApiResponse> {
    return this.request('/rewards/summary')
  }

  // Admin only
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users')
  }

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<User>> {
    if (!userId || !role) {
      throw new Error('User ID and role are required')
    }
    
    if (!['customer', 'restaurant_manager', 'admin'].includes(role)) {
      throw new Error('Invalid role')
    }

    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  async getRestaurantBookings(restaurantId: string): Promise<ApiResponse<Booking[]>> {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required')
    }
    return this.request(`/restaurants/${restaurantId}/bookings`)
  }

  async confirmBooking(id: string): Promise<ApiResponse<Booking>> {
    if (!id) {
      throw new Error('Booking ID is required')
    }
    return this.request(`/bookings/${id}/confirm`, { method: 'POST' })
  }

  // Notifications
  async sendNotification(data: {
    email: string
    subject: string
    body: string
    booking_id?: string
  }): Promise<ApiResponse> {
    if (!data.email || !data.subject || !data.body) {
      throw new Error('Email, subject, and body are required')
    }

    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()