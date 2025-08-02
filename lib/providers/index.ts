import { UserConnection } from '../supabase';
import * as enphase from './enphase';
import * as solaredge from './solaredge';
import * as sma from './sma';
import * as tesla from './tesla';
import * as sunpower from './sunpower';

export interface ProductionData {
  kwh: number;
  timestamp: string;
}

// Provider registry
const providers = {
  enphase,
  solaredge,
  sma,
  tesla,
  sunpower,
  // Add alias for 'other' to use SMA as fallback
  other: sma,
} as const;

/**
 * Fetch production data for a user based on their connected provider
 */
export async function fetchProductionData(user: UserConnection): Promise<ProductionData> {
  const provider = providers[user.provider as keyof typeof providers];
  
  if (!provider) {
    throw new Error(`Unsupported provider: ${user.provider}`);
  }

  try {
    return await provider.fetchProductionData(user);
  } catch (error) {
    console.error(`Error fetching data for provider ${user.provider}:`, error);
    
    // If token expired, try to refresh and retry once
    if (error instanceof Error && error.message.includes('expired')) {
      try {
        console.log(`Attempting to refresh token for provider ${user.provider}`);
        const newToken = await provider.refreshAccessToken(user);
        
        // Update user object with new token for retry
        const updatedUser = { ...user, access_token: newToken };
        return await provider.fetchProductionData(updatedUser);
      } catch (refreshError) {
        console.error(`Failed to refresh token for ${user.provider}:`, refreshError);
        throw refreshError;
      }
    }
    
    throw error;
  }
}

/**
 * Refresh access token for a user's provider
 */
export async function refreshAccessToken(user: UserConnection): Promise<string> {
  const provider = providers[user.provider as keyof typeof providers];
  
  if (!provider) {
    throw new Error(`Unsupported provider: ${user.provider}`);
  }

  return await provider.refreshAccessToken(user);
}

/**
 * Get list of supported providers
 */
export function getSupportedProviders(): string[] {
  return Object.keys(providers);
}

// Export individual providers for direct use if needed
export { enphase, solaredge, sma, tesla, sunpower };
