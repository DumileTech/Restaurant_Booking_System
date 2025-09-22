import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getServerUser } from '@/lib/auth-server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.decode(token) as any
    const userId = decoded?.sub
    if (!userId) return null
    
    return await getServerUser(userId)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('supabase-auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
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