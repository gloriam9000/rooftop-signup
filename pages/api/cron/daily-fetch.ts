import { NextApiRequest, NextApiResponse } from 'next'
import { supabase, UserConnection } from '../../../lib/supabase'
import { DatabaseService } from '../../../lib/database'
import { fetchProductionData } from '../../../lib/providers'
import { veWorldService } from '../../../lib/veworld'
import type { VeWorldReward } from '../../../lib/veworld'

// Remove the local interface since we're importing it

// Store reward distribution results
const storeRewardResults = async (rewards: VeWorldReward[]): Promise<void> => {
  try {
    const rewardRecords = rewards.map(reward => ({
      user_id: reward.userId,
      amount: reward.amount,
      tx_hash: reward.txHash,
      status: reward.status,
      distributed_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('b3tr_rewards')
      .insert(rewardRecords)

    if (error) {
      console.error('Error storing reward results:', error)
    } else {
      console.log('✅ Stored reward results for', rewards.length, 'users')
    }
  } catch (error) {
    console.error('Database error storing rewards:', error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Only allow POST requests with proper authorization
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth token for cron job (in production, use proper authentication)
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  if (authToken !== process.env.CRON_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('🔄 Starting daily solar data fetch and B3TR reward distribution...')
    
    // Step 1: Get all connected users
    const connectedUsers = await DatabaseService.getAllConnectedUsers()
    console.log(`📊 Found ${connectedUsers.length} connected users`)

    if (connectedUsers.length === 0) {
      return res.status(200).json({
        message: 'No connected users found',
        processed: 0,
        rewards: 0
      })
    }

    let totalProcessed = 0
    let totalKwh = 0
    const rewardsToDistribute: VeWorldReward[] = []

    // Step 2: Loop through all connected users
    for (const connection of connectedUsers) {
      try {
        console.log(`🔌 Processing ${connection.provider} connection for user ${connection.user_id}`)

        // Step 3: Fetch kWh from the appropriate provider
        const productionData = await fetchProductionData(connection)
        
        if (productionData && productionData.kwh) {
          // Step 4: Store kWh history (by date)
          const rewardAmount = veWorldService.calculateRewards(productionData.kwh)
          const stored = await DatabaseService.storeProductionData({
            connectionId: connection.id,
            date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            dailyKwh: productionData.kwh,
            monthlyKwh: productionData.kwh, // This would be calculated from monthly data
            totalKwh: productionData.kwh,
            b3trEarned: rewardAmount
          })

          if (stored) {
            totalKwh += productionData.kwh
            totalProcessed++

            // Step 5: Calculate B3TR rewards
            if (rewardAmount > 0) {
              rewardsToDistribute.push({
                userId: connection.user_id,
                amount: rewardAmount,
                status: 'pending',
                metadata: {
                  reason: 'Solar energy production reward',
                  kwhProduced: productionData.kwh,
                  date: new Date().toISOString().split('T')[0]
                }
              })
            }

            console.log(`✅ User ${connection.user_id}: ${productionData.kwh} kWh → ${rewardAmount} B3TR`)
          } else {
            console.log(`❌ Failed to store data for user ${connection.user_id}`)
          }
        } else {
          console.log(`❌ Failed to fetch data for user ${connection.user_id}: No production data`)
        }
      } catch (error) {
        console.error(`Error processing user ${connection.user_id}:`, error)
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Step 6: Distribute B3TR rewards via VeWorld/VeBetterDAO
    if (rewardsToDistribute.length > 0) {
      console.log(`🎁 Distributing ${rewardsToDistribute.length} B3TR rewards...`)
      const distributedRewards = await veWorldService.distributeRewards(rewardsToDistribute)
      await storeRewardResults(distributedRewards)
    }

    const totalRewards = rewardsToDistribute.reduce((sum, reward) => sum + reward.amount, 0)

    console.log('🎉 Daily fetch completed!')
    console.log(`📈 Total processed: ${totalProcessed} users`)
    console.log(`⚡ Total kWh: ${totalKwh}`)
    console.log(`🪙 Total B3TR distributed: ${totalRewards}`)

    return res.status(200).json({
      message: 'Daily fetch and reward distribution completed successfully',
      processed: totalProcessed,
      totalKwh,
      rewards: {
        count: rewardsToDistribute.length,
        totalB3TR: totalRewards,
        successful: rewardsToDistribute.filter(r => r.status === 'success').length,
        failed: rewardsToDistribute.filter(r => r.status === 'failed').length
      }
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
