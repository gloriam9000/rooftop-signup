import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserConnection } from '../lib/supabase';

interface ProductionData {
  daily: number;
  monthly: number;
  total: number;
  b3trEarned: number;
  lastUpdated: string;
  provider: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [productionData, setProductionData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/production/fetch?provider=enphase');

        if (!res.ok) {
          throw new Error('Failed to fetch production data');
        }

        const data: ProductionData = await res.json();
        setProductionData(data);
        setConnections([]); // still mocked for now

      } catch (error) {
        console.error('Dashboard error:', error);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your solar production data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solar Dashboard</h1>
              <p className="text-gray-600">Track your clean energy production and B3TR rewards</p>
            </div>
            <button
              onClick={() => router.push('/add-rooftop')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Add Another System
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No connections state */}
        {connections.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Solar Systems Connected</h3>
            <p className="text-gray-600 mb-6">Connect your solar monitoring system to start tracking your clean energy production and earning B3TR rewards.</p>
            
            {/* Demo/Preview Data */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
              <h4 className="text-sm font-medium text-blue-900 mb-4">📊 Preview: What you'll see after connecting</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">25.5 kWh</div>
                  <div className="text-xs text-gray-600">Today's Production</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">785 kWh</div>
                  <div className="text-xs text-gray-600">This Month</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">9,240 kWh</div>
                  <div className="text-xs text-gray-600">Total Generated</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">924 B3TR</div>
                  <div className="text-xs text-gray-600">Rewards Earned</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/add-rooftop')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Connect Your First System
            </button>
          </div>
        )}

        {/* Connected Systems */}
        {connections.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Connected Systems</h2>
              <p className="text-sm text-gray-600">Your solar monitoring connections</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((connection, index) => (
                  <div key={connection.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {connection.provider.charAt(0).toUpperCase() + connection.provider.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {index === 0 ? 'Primary' : `System ${index + 1}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Connected: {new Date(connection.connected_at).toLocaleDateString()}
                    </p>
                    {connection.system_size && (
                      <p className="text-sm text-gray-600 mb-1">
                        Size: {connection.system_size} kW
                      </p>
                    )}
                    {connection.system_id && (
                      <p className="text-xs text-gray-500">
                        System ID: {connection.system_id}
                      </p>
                    )}
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-xs text-gray-600">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {productionData && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Daily Production */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Today</p>
                    <p className="text-2xl font-bold text-gray-900">{productionData.daily} kWh</p>
                  </div>
                </div>
              </div>

              {/* Monthly Production */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{productionData.monthly} kWh</p>
                  </div>
                </div>
              </div>

              {/* Total Production */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Lifetime</p>
                    <p className="text-2xl font-bold text-gray-900">{productionData.total.toLocaleString()} kWh</p>
                  </div>
                </div>
              </div>

              {/* B3TR Rewards */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">B3TR Earned</p>
                    <p className="text-2xl font-bold text-green-600">{productionData.b3trEarned.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected System Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected System</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{productionData.provider} System</p>
                    <p className="text-sm text-gray-600">
                      Last updated: {new Date(productionData.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* B3TR Rewards Section */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow p-6 text-white mt-8">
              <h2 className="text-2xl font-bold mb-2">🎉 Keep Earning B3TR!</h2>
              <p className="text-green-100 mb-4">
                You earn 1 B3TR token for every kWh of clean energy your system produces.
              </p>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-lg">
                  <span className="font-bold">{productionData.b3trEarned}</span> B3TR tokens earned from{' '}
                  <span className="font-bold">{productionData.total.toLocaleString()}</span> kWh of clean energy! 🌱
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
