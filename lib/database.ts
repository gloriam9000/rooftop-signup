import { supabase, UserConnection } from './supabase'

// Export the UserConnection type for use in other modules
export type { UserConnection }

export class DatabaseService {
  
  // Create or update user connection after OAuth/manual setup
  static async saveUserConnection(connectionData: {
    userId: string
    provider: string
    accessToken?: string
    refreshToken?: string
    systemId?: string
    apiKey?: string
    systemSize?: number
    monthlyGeneration?: number
    country?: string
  }): Promise<UserConnection | null> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .upsert({
          user_id: connectionData.userId,
          provider: connectionData.provider,
          access_token: connectionData.accessToken,
          refresh_token: connectionData.refreshToken,
          system_id: connectionData.systemId,
          api_key: connectionData.apiKey,
          system_size: connectionData.systemSize,
          monthly_generation: connectionData.monthlyGeneration,
          country: connectionData.country,
          connected_at: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving user connection:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  // Get user's connections
  static async getUserConnections(userId: string): Promise<UserConnection[]> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('connected_at', { ascending: false })

      if (error) {
        console.error('Error fetching user connections:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  }

  // Get all connected users for cron job processing
  static async getAllConnectedUsers(): Promise<UserConnection[]> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('is_active', true)
        .order('connected_at', { ascending: false })

      if (error) {
        console.error('Error fetching all connected users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  }

  // Get specific connection by provider
  static async getConnectionByProvider(userId: string, provider: string): Promise<UserConnection | null> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching connection:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  // Update last sync time
  static async updateLastSync(connectionId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', connectionId)

      if (error) {
        console.error('Error updating last sync:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Database error:', error)
      return false
    }
  }

  // Store production data
  static async storeProductionData(data: {
    connectionId: number
    date: string
    dailyKwh: number
    monthlyKwh: number
    totalKwh: number
    b3trEarned: number
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('production_data')
        .upsert({
          connection_id: data.connectionId,
          date: data.date,
          daily_kwh: data.dailyKwh,
          monthly_kwh: data.monthlyKwh,
          total_kwh: data.totalKwh,
          b3tr_earned: data.b3trEarned,
          fetched_at: new Date().toISOString()
        }, {
          onConflict: 'connection_id,date'
        })

      if (error) {
        console.error('Error storing production data:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Database error:', error)
      return false
    }
  }
}
