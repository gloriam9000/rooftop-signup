import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect('/add-rooftop?error=oauth_denied');
  }

  if (!code) {
    return res.redirect('/add-rooftop?error=missing_code');
  }

  try {
    const tokenResponse = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.TESLA_CLIENT_ID || 'your_tesla_client_id',
        client_secret: process.env.TESLA_CLIENT_SECRET || 'your_tesla_client_secret',
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/tesla-callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    // Generate a temporary user ID (in production, this would come from your auth system)
    const tempUserId = req.cookies.temp_user_id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the connection in database
    const connection = await DatabaseService.saveUserConnection({
      userId: tempUserId,
      provider: 'tesla',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      systemId: tokenData.system_id || null,
    });

    if (!connection) {
      throw new Error('Failed to save connection to database');
    }

    console.log('Tesla connection saved:', {
      connectionId: connection.id,
      provider: connection.provider,
      userId: connection.user_id
    });

    // Set a cookie to remember the user for the demo
    res.setHeader('Set-Cookie', `temp_user_id=${tempUserId}; Path=/; HttpOnly; SameSite=Strict`);
    
    res.redirect('/add-rooftop?success=tesla_connected');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/add-rooftop?error=token_exchange_failed');
  }
}
