import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCurrentUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get rewards for the user
    const { data: rewards, error } = await supabaseAdmin
      .from('rewards')
      .select('points_change, created_at')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Calculate monthly points
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const monthlyPoints = rewards
      .filter(reward => {
        const rewardDate = new Date(reward.created_at)
        return rewardDate.getMonth() === currentMonth && rewardDate.getFullYear() === currentYear
      })
      .reduce((sum, reward) => sum + reward.points_change, 0)

    return NextResponse.json({
      totalPoints: user.points,
      monthlyPoints,
      totalRewards: rewards.length,
      recentRewards: rewards.slice(0, 5)
    })

  } catch (error) {
    console.error('Get rewards summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}