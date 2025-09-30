'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBooking } from '@/lib/actions/booking.actions'
import { getRestaurantAvailability } from '@/lib/actions/restaurant.actions'
import { validateBooking } from '@/lib/utils/validation'
import { logError } from '@/lib/utils/errors'
import type { Restaurant, BookingFormData } from '@/lib/types'
import { Calendar, Clock, Users, CircleAlert as AlertCircle, Loader2, PartyPopper } from 'lucide-react'

// Helper component for loading spinner
const Spinner = () => <Loader2 className="mr-2 h-4 w-4 animate-spin" />

interface BookingFormProps {
  restaurant: Restaurant
}

export default function BookingForm({ restaurant }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: '',
    party_size: '2',
    special_requests: '',
  })

  // Set min/max dates for the date picker
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date()
    const ninetyDaysFromNow = new Date()
    ninetyDaysFromNow.setDate(today.getDate() + 90)
    
    // Format to YYYY-MM-DD for the input element
    const format = (date: Date) => date.toISOString().split('T')[0]
    
    return {
      minDate: format(today),
      maxDate: format(ninetyDaysFromNow),
    }
  }, [])

  // Effect to fetch availability when date or party size changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.date || !formData.party_size) return

      setIsCheckingAvailability(true)
      setError('')
      
      try {
        const response = await getRestaurantAvailability(
          restaurant.id,
          formData.date,
          parseInt(formData.party_size)
        )
        
        if (response?.success && Array.isArray(response.data?.available_times)) {
          setAvailableTimes(response.data.available_times)
          
          // If the previously selected time is no longer available, reset it
          if (formData.time && !response.data.available_times.includes(formData.time)) {
            setFormData(prev => ({ ...prev, time: '' }))
          }
        } else {
          setAvailableTimes([])
          throw new Error(response?.error || 'Could not fetch availability.')
        }
      } catch (err) {
        logError(err, 'Check Availability')
        setError('Could not check availability. Please try again.')
      } finally {
        setIsCheckingAvailability(false)
      }
    }

    checkAvailability()
  }, [formData.date, formData.party_size, formData.time, restaurant.id])

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error on new input
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    
    setLoading(true)
    setError('')

    try {
      // Re-validate the form data on submission
      const bookingData = {
        restaurant_id: restaurant.id,
        date: formData.date,
        time: formData.time,
        party_size: parseInt(formData.party_size),
        special_requests: formData.special_requests.trim() || undefined,
      }

      const validation = validateBooking(bookingData)
      if (!validation.success) {
        throw new Error(validation.errors?.[0]?.message || 'Invalid booking data.')
      }

      // Final check: ensure the selected time is still in the available list
      if (!availableTimes.includes(formData.time)) {
        throw new Error('The selected time is no longer available. Please choose a different time.')
      }

      const formDataObj = new FormData()
      Object.entries(bookingData).forEach(([key, value]) => {
        if (value !== undefined) {
          formDataObj.append(key, String(value))
        }
      })
      
      const response = await createBooking(formDataObj)
      
      if (response?.success) {
        router.push('/account?success=booking')

          router.push('/account?success=booking_confirmed')
      } else {
        throw new Error(response?.error || 'An unknown error occurred during booking.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking.'
      setError(errorMessage)
      logError(err, 'Create Booking Submission')
    } finally {
      setLoading(false)
    }
  }

  const isFormSubmittable = formData.date && formData.time && formData.party_size && !isCheckingAvailability

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Reserve at {restaurant.name}</CardTitle>
        {restaurant.location && (
          <CardDescription>{restaurant.location}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-x-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Core Booking Details Group */}
          <div className="p-4 space-y-4 bg-muted/50 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Party Size */}
              <div className="space-y-1.5">
                <Label htmlFor="party_size">Party Size *</Label>
                <Select 
                  value={formData.party_size} 
                  onValueChange={(value) => handleInputChange('party_size', value)}
                  disabled={loading}
                >
                  <SelectTrigger id="party_size">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select party size" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="date"
                        type="date"
                        className="pl-8"
                        min={minDate}
                        max={maxDate}
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
              </div>
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <Label htmlFor="time">Time *</Label>
              <Select 
                value={formData.time} 
                onValueChange={(value) => handleInputChange('time', value)}
                disabled={loading || isCheckingAvailability || !formData.date}
              >
                <SelectTrigger id="time">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select a date first" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                  {isCheckingAvailability ? (
                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                      <Spinner /> Checking availability...
                    </div>
                  ) : availableTimes.length > 0 ? (
                    availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))
                  ) : formData.date ? (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                        No times available for this date.
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Special Requests */}
          <div className="space-y-1.5">
            <Label htmlFor="special_requests">Special Requests (Optional)</Label>
            <Textarea
              id="special_requests"
              placeholder="e.g. dietary restrictions, accessibility, special occasions"
              value={formData.special_requests}
              onChange={(e) => handleInputChange('special_requests', e.target.value)}
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.special_requests.length} / 500
            </p>
          </div>

          {/* Rewards Banner */}
          <div className="flex items-center gap-x-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            <PartyPopper className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">You&#39;ll earn 10 reward points with this booking!</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full font-semibold" 
            disabled={!isFormSubmittable || loading}
            size="lg"
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Confirming Reservation...' : 'Book Your Table'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}