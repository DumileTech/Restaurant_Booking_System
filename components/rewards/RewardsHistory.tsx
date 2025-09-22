'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, TrendingUp, Calendar } from 'lucide-react'

interface Reward {
  id: string
  points_change: number
  reason: string | null
  created_at: string
}

interface RewardsHistoryProps {
  rewards: Reward[]
  totalPoints: number
}

export default function RewardsHistory({ rewards, totalPoints }: RewardsHistoryProps) {
  const monthlyPoints = rewards
    .filter(reward => {
      const rewardDate = new Date(reward.created_at)
      const now = new Date()
      return rewardDate.getMonth() === now.getMonth() && rewardDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, reward) => sum + reward.points_change, 0)

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">+{monthlyPoints}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rewards History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-green-100 rounded-full">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {reward.reason || 'Points earned'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reward.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    +{reward.points_change} pts
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rewards earned yet</p>
              <p className="text-sm text-muted-foreground">Make your first booking to start earning points!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards Info */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">How to Earn More Points</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Earn 10 points for each confirmed booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Points are automatically added when restaurants confirm your reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Keep booking to build up your rewards balance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}