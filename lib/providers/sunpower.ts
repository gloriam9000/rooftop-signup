import { UserConnection } from '../supabase';

interface SunPowerProductionResponse {
  addresses: Array<{
    address: string;
    timezone: string;
    systems: Array<{
      SYSTEM_ID: string;
      status: string;
      SYSTEM_NAME: string;
      POWER_W: number;
      ENERGY_LIFETIME_WH: number;
      ENERGY_DAY_WH: number;
      ENERGY_MONTH_WH: number;
      ENERGY_YEAR_WH: number;
      last_report_date: string;
    }>;
  }>;
}

export async function fetchProductionData(user: UserConnection): Promise<{ kwh: number, timestamp: string }> {
  if (!user.access_token) {
    throw new Error('No access token available for SunPower user');
  }

  try {
    // SunPower API endpoint for system production data
    const response = await fetch('https://api.sunpower.com/v1/elec/systems', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SunPower access token expired or invalid');
      }
      throw new Error(`SunPower API error: ${response.status}`);
    }

    const data: SunPowerProductionResponse = await response.json();

    // Find the system matching the user's system ID
    let targetSystem = null;
    for (const address of data.addresses) {
      targetSystem = address.systems.find(system => system.SYSTEM_ID === user.system_id);
      if (targetSystem) break;
    }

    if (!targetSystem) {
      throw new Error(`System ID ${user.system_id} not found in SunPower account`);
    }

    // Extract today's production in kWh (API returns Wh)
    const kwhToday = targetSystem.ENERGY_DAY_WH / 1000;
    const lastReportDate = targetSystem.last_report_date;

    return {
      kwh: kwhToday,
      timestamp: lastReportDate || new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching SunPower production data:', error);
    throw error;
  }
}

export async function refreshAccessToken(user: UserConnection): Promise<string> {
  if (!user.refresh_token) {
    throw new Error('No refresh token available for SunPower user');
  }

  try {
    const response = await fetch('https://api.sunpower.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.SUNPOWER_CLIENT_ID || '',
        client_secret: process.env.SUNPOWER_CLIENT_SECRET || '',
        refresh_token: user.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh SunPower access token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('Error refreshing SunPower token:', error);
    throw error;
  }
}
