// Client-side wrappers for user actions

import { getUserProfile as getUserProfileServer, updateUserProfile as updateUserProfileServer, getUserBookings as getUserBookingsServer, getUserRewards as getUserRewardsServer } from '@/lib/actions/server/user.actions'

export async function getUserProfile() {
  return await getUserProfileServer()
}

export async function updateUserProfile(formData: FormData) {
  return await updateUserProfileServer(formData)
}

export async function getUserBookings() {
  return await getUserBookingsServer()
}

export async function getUserRewards() {
  return await getUserRewardsServer()
}