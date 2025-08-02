import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientId = process.env.SUNPOWER_CLIENT_ID || 'your_sunpower_client_id';
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/oauth/sunpower-callback`;
  
  const authUrl = `https://api.sunpower.com/oauth/authorize?${new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'production',
    state: Math.random().toString(36).substr(2, 10), // CSRF protection
  })}`;

  res.redirect(authUrl);
}
