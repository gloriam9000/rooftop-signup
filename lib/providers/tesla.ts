import { UserConnection } from '../supabase';

interface TeslaSolarResponse {
  response: {
    solar_power: number;
    energy_left: number;
    total_pack_energy: number;
    percentage_charged: number;
    solar: {
      last_communication_time: string;
      instant_power: number;
      instant_reactive_power: number;
      instant_apparent_power: number;
    };
  };
}

interface TeslaEnergyHistoryResponse {
  response: {
    time_series: Array<{
      timestamp: string;
      solar_energy_exported: number;
      solar_energy_imported: number;
      grid_energy_exported: number;
      grid_energy_imported: number;
    }>;
  };
}

export async function fetchProductionData(user: UserConnection): Promise<{ kwh: number, timestamp: string }> {
  if (!user.access_token) {
    throw new Error('No access token available for Tesla user');
  }

  try {
    // Tesla API endpoint for energy site data
    const response = await fetch(`https://owner-api.teslamotors.com/api/1/energy_sites/${user.system_id}/live_status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Tesla access token expired or invalid');
      }
      throw new Error(`Tesla API error: ${response.status}`);
    }

    const data: TeslaSolarResponse = await response.json();

    // Get today's energy history for more accurate daily production
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const historyResponse = await fetch(
      `https://owner-api.teslamotors.com/api/1/energy_sites/${user.system_id}/history?kind=energy&start_date=${startOfDay.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (historyResponse.ok) {
      const historyData: TeslaEnergyHistoryResponse = await historyResponse.json();
      
      // Sum up today's solar energy production
      let totalKwhToday = 0;
      for (const entry of historyData.response.time_series) {
        totalKwhToday += entry.solar_energy_exported || 0;
      }

      return {
        kwh: totalKwhToday,
        timestamp: data.response.solar.last_communication_time || new Date().toISOString()
      };
    } else {
      // Fallback to current power data if history isn't available
      // This would need to be accumulated over time for daily totals
      const currentPowerKw = data.response.solar_power / 1000; // Convert W to kW
      
      return {
        kwh: currentPowerKw * 8, // Rough estimate: 8 hours of current power
        timestamp: data.response.solar.last_communication_time || new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('Error fetching Tesla production data:', error);
    throw error;
  }
}

export async function refreshAccessToken(user: UserConnection): Promise<string> {
  if (!user.refresh_token) {
    throw new Error('No refresh token available for Tesla user');
  }

  try {
    const response = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.TESLA_CLIENT_ID || '',
        client_secret: process.env.TESLA_CLIENT_SECRET || '',
        refresh_token: user.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Tesla access token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;

  } catch (error) {
    console.error('Error refreshing Tesla token:', error);
    throw error;
  }
}
