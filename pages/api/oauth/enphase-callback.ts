import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    // User denied access or other OAuth error
    return res.redirect('/add-rooftop?error=oauth_denied');
  }

  if (!code) {
    return res.redirect('/add-rooftop?error=missing_code');
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ENPHASE_CLIENT_ID || 'your_enphase_client_id',
        client_secret: process.env.ENPHASE_CLIENT_SECRET || 'your_enphase_client_secret',
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/enphase-callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    // TODO: Store the access token in your database linked to the user
    console.log('Enphase access token received:', tokenData);
    
    // Redirect back to success page
    res.redirect('/add-rooftop?success=enphase_connected');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/add-rooftop?error=token_exchange_failed');
  }
}
