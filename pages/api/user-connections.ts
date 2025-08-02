import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the temp user ID from cookies (in production, this would come from your auth system)
    const tempUserId = req.cookies.temp_user_id;

    if (!tempUserId) {
      return res.status(401).json({ message: 'No user session found' });
    }

    // Fetch user's connections
    const connections = await DatabaseService.getUserConnections(tempUserId);

    res.status(200).json({ 
      success: true, 
      connections 
    });

  } catch (error) {
    console.error('Error fetching user connections:', error);
    res.status(500).json({ 
      message: 'Failed to fetch connections',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
