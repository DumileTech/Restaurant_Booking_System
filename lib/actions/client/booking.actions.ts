// Client-side wrappers for booking actions

import { createBooking as createBookingServer, updateBooking as updateBookingServer, cancelBooking as cancelBookingServer, confirmBooking as confirmBookingServer } from '@/lib/actions/server/booking.actions'

export async function createBooking(formData: FormData) {
  return await createBookingServer(formData)
}

export async function updateBooking(bookingId: string, updates: {
  date?: string
  time?: string
  party_size?: number
  special_requests?: string
}) {
  return await updateBookingServer(bookingId, updates)
}

export async function cancelBooking(bookingId: string) {
  return await cancelBookingServer(bookingId)
}

export async function confirmBooking(bookingId: string) {
  return await confirmBookingServer(bookingId)
}