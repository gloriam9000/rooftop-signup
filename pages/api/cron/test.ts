import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cronUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/cron/daily-fetch`
    const authToken = process.env.CRON_AUTH_TOKEN || 'test-token-123'

    console.log('🧪 Testing cron job endpoint...')
    
    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    return res.status(response.status).json({
      message: 'Cron job test completed',
      status: response.status,
      result
    })
  } catch (error) {
    console.error('Test cron job error:', error)
    return res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
