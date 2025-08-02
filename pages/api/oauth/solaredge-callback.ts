import { NextApiRequest, NextApiResponse } from 'next';

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
    const tokenResponse = await fetch('https://monitoring.solaredge.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SOLAREDGE_CLIENT_ID || 'your_solaredge_client_id',
        client_secret: process.env.SOLAREDGE_CLIENT_SECRET || 'your_solaredge_client_secret',
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/solaredge-callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    console.log('SolarEdge access token received:', tokenData);
    
    res.redirect('/add-rooftop?success=solaredge_connected');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/add-rooftop?error=token_exchange_failed');
  }
}
