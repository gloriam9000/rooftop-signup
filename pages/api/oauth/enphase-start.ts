import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // In production, these would be environment variables
  const ENPHASE_CLIENT_ID = process.env.ENPHASE_CLIENT_ID || 'your_enphase_client_id';
  const REDIRECT_URI = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  
  // Generate secure random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Enphase OAuth URL
  const oauthUrl = new URL('https://api.enphaseenergy.com/oauth/authorize');
  oauthUrl.searchParams.append('response_type', 'code');
  oauthUrl.searchParams.append('client_id', ENPHASE_CLIENT_ID);
  oauthUrl.searchParams.append('redirect_uri', `${REDIRECT_URI}/api/oauth/enphase-callback`);
  oauthUrl.searchParams.append('scope', 'read_systems');
  oauthUrl.searchParams.append('state', state);

  // Store state in secure cookie for validation in callback
  res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Strict; Max-Age=600`);

  // Redirect user to Enphase OAuth
  res.redirect(302, oauthUrl.toString());
}
