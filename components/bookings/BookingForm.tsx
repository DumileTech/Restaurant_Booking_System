'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { validateBooking } from '@/lib/utils/validation'
import { logError } from '@/lib/utils/errors'
import type { Restaurant, BookingFormData } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react'


interface BookingFormProps {
  restaurant: Restaurant
}

export default function BookingForm({ restaurant }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: '',
    party_size: '2',
    special_requests: '',
  })

  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ]

  const minDate = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now

  // Check availability when date or party size changes
  useEffect(() => {
    if (formData.date && formData.party_size) {
      checkAvailability()
    }
  }, [formData.date, formData.party_size])

  const checkAvailability = async () => {
    if (!formData.date || !formData.party_size) return

    setCheckingAvailability(true)
    setError('')
    
    try {
      const response = await apiClient.getRestaurantAvailability(
        restaurant.id,
        formData.date,
        parseInt(formData.party_size)
      )
      
      if (response.success && response.data) {
        setAvailableTimes(response.data.available_times || [])
        
        // Clear selected time if it's no longer available
        if (formData.time && !response.data.available_times?.includes(formData.time)) {
          setFormData(prev => ({ ...prev, time: '' }))
        }
      }
    } catch (error) {
      logError(error, 'Check Availability')
      setError('Failed to check availability. Please try again.')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading) return
    
    setLoading(true)
    setError('')

    try {
      // Validate form data
      const bookingData = {
        restaurant_id: restaurant.id,
        date: formData.date,
        time: formData.time,
        party_size: parseInt(formData.party_size),
        special_requests: formData.special_requests.trim() || undefined,
      }

      const validation = validateBooking(bookingData)
      if (!validation.success) {
        const errorMessage = validation.errors?.[0]?.message || 'Invalid booking data'
        setError(errorMessage)
        return
      }

      // Check if selected time is still available
      if (!availableTimes.includes(formData.time)) {
        setError('Selected time is no longer available. Please choose another time.')
        await checkAvailability()
        return
      }

      const response = await apiClient.createBooking(bookingData)
      
      if (response.success) {
        router.push('/account?success=booking')
      } else {
        setError(response.error || 'Failed to create booking')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking'
      setError(errorMessage)
      logError(error, 'Create Booking')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user makes changes
  }

  const isFormValid = formData.date && formData.time && formData.party_size && !checkingAvailability

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book a Table at {restaurant.name}
        </CardTitle>
        {restaurant.location && (
          <p className="text-sm text-muted-foreground">{restaurant.location}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                max={maxDate}
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="party_size">Party Size *</Label>
              <Select 
                value={formData.party_size} 
                onValueChange={(value) => handleInputChange('party_size', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {size} {size === 1 ? 'person' : 'people'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">
              Time * 
              {checkingAvailability && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Checking availability...)
                </span>
              )}
            </Label>
            <Select 
              value={formData.time} 
              onValueChange={(value) => handleInputChange('time', value)}
              disabled={loading || checkingAvailability || !formData.date}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.date 
                    ? "Select date first" 
                    : checkingAvailability 
                      ? "Checking availability..." 
                      : "Select time"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableTimes.length > 0 ? (
                  availableTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))
                ) : formData.date && !checkingAvailability ? (
                  <SelectItem value="" disabled>
                    No available times for selected date
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            
            {formData.date && availableTimes.length === 0 && !checkingAvailability && (
              <p className="text-sm text-amber-600">
                No available times for this date. Please try a different date or party size.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requests">Special Requests (Optional)</Label>
            <Textarea
              id="special_requests"
              placeholder="Any dietary restrictions, special occasions, or other requests..."
              value={formData.special_requests}
              onChange={(e) => handleInputChange('special_requests', e.target.value)}
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {formData.special_requests.length}/500 characters
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium text-sm flex items-center gap-2">
              🎉 Earn 10 reward points when your booking is confirmed!
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isFormValid || loading}
            size="lg"
          >
            {loading ? 'Creating Booking...' : 'Book Table'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}