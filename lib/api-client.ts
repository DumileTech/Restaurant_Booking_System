// Frontend API client - only communicates with Next.js API routes
class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async register(email: string, password: string, name?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' })
  }

  // Restaurants
  async getRestaurants(filters?: { cuisine?: string; location?: string; search?: string }) {
    const params = new URLSearchParams()
    if (filters?.cuisine) params.set('cuisine', filters.cuisine)
    if (filters?.location) params.set('location', filters.location)
    if (filters?.search) params.set('search', filters.search)
    
    return this.request(`/restaurants?${params}`)
  }

  async getRestaurant(id: string) {
    return this.request(`/restaurants/${id}`)
  }

  async getRestaurantAvailability(id: string, date: string, partySize: number = 2) {
    return this.request(`/restaurants/${id}/availability?date=${date}&party_size=${partySize}`)
  }

  // Bookings
  async createBooking(booking: {
    restaurant_id: string
    date: string
    time: string
    party_size: number
    special_requests?: string
  }) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    })
  }

  async getBookings() {
    return this.request('/bookings')
  }

  async getBooking(id: string) {
    return this.request(`/bookings/${id}`)
  }

  async updateBooking(id: string, updates: any) {
    return this.request(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async cancelBooking(id: string) {
    return this.request(`/bookings/${id}/cancel`, { method: 'POST' })
  }

  // Rewards
  async getRewards() {
    return this.request('/rewards')
  }

  async getRewardsSummary() {
    return this.request('/rewards/summary')
  }

  // Users
  async getProfile() {
    return this.request('/users/profile')
  }

  async updateProfile(updates: { name?: string }) {
    return this.request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  // Admin only
  async getUsers() {
    return this.request('/users')
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  async getRestaurantBookings(restaurantId: string) {
    return this.request(`/restaurants/${restaurantId}/bookings`)
  }

  async confirmBooking(id: string) {
    return this.request(`/bookings/${id}/confirm`, { method: 'POST' })
  }

  // Notifications
  async sendNotification(data: {
    email: string
    subject: string
    body: string
    booking_id?: string
  }) {
    return this.request('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()