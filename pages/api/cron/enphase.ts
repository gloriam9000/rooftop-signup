// pages/api/cron/enphase.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // AUTH check
  if (req.headers.authorization !== `Bearer ${process.env.CRON_AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('📡 Enphase cron hit (disabled for now)...')

  // LATER: fetch Enphase users, refresh token, fetch production, store, reward

  res.status(200).json({ message: 'Enphase cron scaffolded but not live yet.' })
}

/*
Later, call enphase.ts from daily-fetch.ts like:

await fetch(`${APP_URL}/api/cron/enphase`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.CRON_AUTH_TOKEN}` }
})
*/
