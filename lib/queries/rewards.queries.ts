import { supabase } from '@/lib/supabase'

// Get all rewards for a user
export async function getUserRewards(userId: string) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Create reward entry
export async function createReward(reward: RewardInsert) {
  const { data, error } = await supabase
    .from('rewards')
    .insert(reward)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get reward by ID
export async function getRewardById(id: string) {
  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      users (
        email,
        name
      ),
      bookings (
        date,
        time,
        restaurants (
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Get rewards summary for user
export async function getUserRewardsSummary(userId: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('points')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const { data: rewards, error: rewardsError } = await supabase
    .from('rewards')
    .select('points_change, created_at')
    .eq('user_id', userId)

  if (rewardsError) throw rewardsError

  // Calculate monthly points
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const monthlyPoints = rewards
    .filter(reward => {
      const rewardDate = new Date(reward.created_at)
      return rewardDate.getMonth() === currentMonth && rewardDate.getFullYear() === currentYear
    })
    .reduce((sum, reward) => sum + reward.points_change, 0)

  return {
    totalPoints: user.points,
    monthlyPoints,
    totalRewards: rewards.length,
    recentRewards: rewards.slice(0, 5)
  }
}

// Get rewards by booking
export async function getRewardsByBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Get all rewards (admin)
export async function getAllRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      users (
        email,
        name
      ),
      bookings (
        date,
        time,
        restaurants (
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Delete reward
export async function deleteReward(id: string) {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Get rewards analytics
export async function getRewardsAnalytics(startDate?: string, endDate?: string) {
  let query = supabase
    .from('rewards')
    .select('points_change, created_at, user_id')

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) throw error

  const totalPoints = data.reduce((sum, reward) => sum + reward.points_change, 0)
  const uniqueUsers = new Set(data.map(reward => reward.user_id)).size
  const averagePointsPerUser = uniqueUsers > 0 ? totalPoints / uniqueUsers : 0

  return {
    totalPointsAwarded: totalPoints,
    totalRewards: data.length,
    uniqueUsers,
    averagePointsPerUser: Math.round(averagePointsPerUser * 100) / 100
  }
}