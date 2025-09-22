import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getServerUser, hasRole } from '@/lib/auth-server'
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

    const isAdmin = await hasRole(user.id, 'admin')
    
    let query = supabaseAdmin.from('rewards').select('*')
    
    // Non-admin users can only see their own rewards
    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data: rewards, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ rewards })

  } catch (error) {
    console.error('Get rewards error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}