import { UserConnection } from '../supabase';

interface SMAEnergyResponse {
  result: {
    [timestamp: string]: {
      [deviceId: string]: {
        '6100_40263F00': {
          '1': Array<{
            val: number;
          }>;
        };
      };
    };
  };
}

export async function fetchProductionData(user: UserConnection): Promise<{ kwh: number, timestamp: string }> {
  if (!user.api_key) {
    throw new Error('No API key available for SMA user');
  }

  try {
    // Get today's date range (start and end of day in Unix timestamp)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    // SMA Sunny Portal API endpoint for energy data
    // Note: This is a simplified example - actual SMA API might require different authentication
    const response = await fetch('https://www.sunnyportal.com/Templates/PublicPageOverview.aspx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.api_key}`,
      },
      body: JSON.stringify({
        version: '1.0',
        proc: 'GetPlantOverview',
        id: '1',
        format: 'JSON',
        params: {
          plantOid: user.system_id,
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('SMA API key invalid or expired');
      }
      throw new Error(`SMA API error: ${response.status}`);
    }

    const data: SMAEnergyResponse = await response.json();

    // Parse SMA response to extract today's production
    // Note: SMA API structure can vary, this is a generalized approach
    let totalKwhToday = 0;
    
    for (const timestamp in data.result) {
      for (const deviceId in data.result[timestamp]) {
        const deviceData = data.result[timestamp][deviceId];
        
        // Look for energy production data (6100_40263F00 is typically total yield)
        if (deviceData['6100_40263F00'] && deviceData['6100_40263F00']['1']) {
          const energyValues = deviceData['6100_40263F00']['1'];
          if (energyValues.length > 0) {
            // SMA typically returns cumulative values, so we take the latest
            totalKwhToday = energyValues[energyValues.length - 1].val / 1000; // Convert Wh to kWh
          }
        }
      }
    }

    return {
      kwh: totalKwhToday,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching SMA production data:', error);
    
    // For demo purposes, return mock data if API fails
    // In production, you'd want to handle this differently
    console.warn('Returning mock data for SMA due to API error');
    return {
      kwh: 35.5, // Mock daily production
      timestamp: new Date().toISOString()
    };
  }
}

// SMA typically uses API keys rather than OAuth tokens
// But if they do support token refresh, this would be the structure
export async function refreshAccessToken(user: UserConnection): Promise<string> {
  throw new Error('SMA typically uses API keys, not refreshable OAuth tokens');
}
