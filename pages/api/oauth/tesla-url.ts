import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientId = process.env.TESLA_CLIENT_ID || 'your_tesla_client_id';
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/tesla-callback`;
  
  const authUrl = `https://auth.tesla.com/oauth2/v3/authorize?${new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'energy_device_data',
    state: Math.random().toString(36).substr(2, 10), // CSRF protection
  })}`;

  res.redirect(authUrl);
}
