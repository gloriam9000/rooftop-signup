import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { provider, apiKey, systemId, systemSize, monthlyGeneration, country } = req.body;

    // Validate required fields
    if (!provider || !apiKey || !systemId) {
      return res.status(400).json({ 
        message: 'Missing required fields: provider, apiKey, and systemId are required' 
      });
    }

    // Generate a temporary user ID (in production, this would come from your auth system)
    const tempUserId = req.cookies.temp_user_id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the manual connection in database
    const connection = await DatabaseService.saveUserConnection({
      userId: tempUserId,
      provider,
      apiKey,
      systemId,
      systemSize: systemSize ? parseFloat(systemSize) : undefined,
      monthlyGeneration: monthlyGeneration ? parseFloat(monthlyGeneration) : undefined,
      country,
    });

    if (!connection) {
      throw new Error('Failed to save connection to database');
    }

    console.log('Manual connection saved:', {
      connectionId: connection.id,
      provider: connection.provider,
      userId: connection.user_id
    });

    // Set a cookie to remember the user for the demo
    res.setHeader('Set-Cookie', [
      `temp_user_id=${tempUserId}; Path=/; HttpOnly; SameSite=Strict`,
    ]);

    res.status(200).json({ 
      success: true, 
      message: `${provider} connection saved successfully`,
      connectionId: connection.id 
    });

  } catch (error) {
    console.error('Manual connection error:', error);
    res.status(500).json({ 
      message: 'Failed to save manual connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
