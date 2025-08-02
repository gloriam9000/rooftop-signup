import { UserConnection } from '../supabase';

interface SolarEdgeEnergyResponse {
  energy: {
    timeUnit: string;
    unit: string;
    values: Array<{
      date: string;
      value: number;
    }>;
  };
}

export async function fetchProductionData(user: UserConnection): Promise<{ kwh: number, timestamp: string }> {
  if (!user.access_token && !user.api_key) {
    throw new Error('No access token or API key available for SolarEdge user');
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // SolarEdge API endpoint for energy production
    const apiKey = user.access_token || user.api_key;
    const response = await fetch(
      `https://monitoringapi.solaredge.com/site/${user.system_id}/energy?timeUnit=DAY&endDate=${today}&startDate=${today}&api_key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SolarEdge API key or access token invalid');
      }
      throw new Error(`SolarEdge API error: ${response.status}`);
    }

    const data: SolarEdgeEnergyResponse = await response.json();

    // Extract today's production
    const todayProduction = data.energy.values.find(entry => entry.date === today);
    
    if (!todayProduction) {
      // If no data for today, return 0 (might be early in the day)
      return {
        kwh: 0,
        timestamp: new Date().toISOString()
      };
    }

    // SolarEdge API returns energy in Wh, convert to kWh
    const kwhToday = todayProduction.value / 1000;

    return {
      kwh: kwhToday,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching SolarEdge production data:', error);
    throw error;
  }
}

export async function refreshAccessToken(user: UserConnection): Promise<string> {
  if (!user.refresh_token) {
    throw new Error('No refresh token available for SolarEdge user');
  }

  try {
    const response = await fetch('https://monitoring.solaredge.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SOLAREDGE_CLIENT_ID || '',
        client_secret: process.env.SOLAREDGE_CLIENT_SECRET || '',
        refresh_token: user.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh SolarEdge access token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('Error refreshing SolarEdge token:', error);
    throw error;
  }
}
