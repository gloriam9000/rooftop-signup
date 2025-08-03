import { NextApiRequest, NextApiResponse } from 'next';
import { DatabaseService } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, error, state } = req.query;
  const returnedState = state as string;
  const savedState = req.cookies.oauth_state;

  if (!returnedState || returnedState !== savedState) {
    return res.redirect('/add-rooftop?error=csrf_detected');
  }

  if (error) return res.redirect('/add-rooftop?error=oauth_denied');
  if (!code) return res.redirect('/add-rooftop?error=missing_code');

  try {
    // Clear the OAuth state cookie
    res.setHeader('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ENPHASE_CLIENT_ID || '',
        client_secret: process.env.ENPHASE_CLIENT_SECRET || '',
        code: code as string,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/enphase-callback`,
      }),
    });

    if (!tokenResponse.ok) throw new Error('Failed to exchange code for token');
    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // 2. Use access token to fetch system_id
    const systemsResponse = await fetch('https://api.enphaseenergy.com/api/v4/systems', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'key': process.env.ENPHASE_API_KEY || '',
      },
    });

    if (!systemsResponse.ok) throw new Error('Failed to fetch Enphase systems');

    const systemsData = await systemsResponse.json();

    const firstSystem = systemsData.systems?.[0];
    const systemId = firstSystem?.system_id;

    if (!systemId) throw new Error('No system ID found for Enphase user');

    // 3. Save everything to DB
    const tempUserId = req.cookies.temp_user_id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const connection = await DatabaseService.saveUserConnection({
      userId: tempUserId,
      provider: 'enphase',
      accessToken,
      refreshToken,
      systemId,
    });

    if (!connection) throw new Error('Failed to save connection to database');

    console.log('✅ Enphase connection saved:', connection);

    res.setHeader('Set-Cookie', `temp_user_id=${tempUserId}; Path=/; HttpOnly; SameSite=Strict`);
    res.redirect('/add-rooftop?success=enphase_connected');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/add-rooftop?error=token_exchange_failed');
  }
}
