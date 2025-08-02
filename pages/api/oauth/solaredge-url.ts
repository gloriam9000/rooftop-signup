import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const SOLAREDGE_CLIENT_ID = process.env.SOLAREDGE_CLIENT_ID || 'your_solaredge_client_id';
  const REDIRECT_URI = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  
  // SolarEdge OAuth URL
  const oauthUrl = new URL('https://monitoring.solaredge.com/oauth/authorize');
  oauthUrl.searchParams.append('response_type', 'code');
  oauthUrl.searchParams.append('client_id', SOLAREDGE_CLIENT_ID);
  oauthUrl.searchParams.append('redirect_uri', `${REDIRECT_URI}/api/oauth/solaredge-callback`);
  oauthUrl.searchParams.append('scope', 'read');
  oauthUrl.searchParams.append('state', 'random_state_string');

  res.redirect(302, oauthUrl.toString());
}
