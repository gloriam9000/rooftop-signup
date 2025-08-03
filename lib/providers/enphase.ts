import { UserConnection } from '../supabase';

interface EnphaseProductionResponse {
  production: {
    wh_today: number;
    wh_last_seven_days: number;
    wh_lifetime: number;
  }[];
  system_id: number;
  total_microinverters: number;
  meta: {
    last_report_at: number;
  };
}

export async function fetchProductionData(user: UserConnection): Promise<{ kwh: number, timestamp: string }> {
  if (!user.access_token) {
    throw new Error('No access token available for Enphase user');
  }

  try {
    // Enphase API endpoint for production data
    const response = await fetch(`https://api.enphaseenergy.com/api/v4/systems/${user.system_id}/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
        'key': process.env.ENPHASE_API_KEY || '',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Enphase access token expired or invalid');
      }
      throw new Error(`Enphase API error: ${response.status}`);
    }

    const data: EnphaseProductionResponse = await response.json();

    // Extract today's production in kWh (API returns Wh)
    const production = data.production[0];
    const kwhToday = production.wh_today / 1000; // Convert Wh to kWh
    const lastReportTimestamp = new Date(data.meta.last_report_at * 1000).toISOString();

    return {
      kwh: kwhToday,
      timestamp: lastReportTimestamp
    };

  } catch (error) {
    console.error('Error fetching Enphase production data:', error);
    throw error;
  }
}

export async function refreshAccessToken(user: UserConnection): Promise<string> {
  if (!user.refresh_token) {
    throw new Error('No refresh token available for Enphase user');
  }

  try {
    const response = await fetch('https://api.enphaseenergy.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ENPHASE_CLIENT_ID || '',
        client_secret: process.env.ENPHASE_CLIENT_SECRET || '',
        refresh_token: user.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Enphase access token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('Error refreshing Enphase token:', error);
    throw error;
  }
}
