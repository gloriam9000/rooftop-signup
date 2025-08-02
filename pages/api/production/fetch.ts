import { NextApiRequest, NextApiResponse } from 'next';

interface ProductionData {
  daily: number;
  monthly: number;
  total: number;
  b3trEarned: number;
  lastUpdated: string;
  provider: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ProductionData | { error: string }>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider } = req.query;

  // Simulated production data - varies slightly by provider to make it realistic
  const baseData = {
    enphase: {
      daily: 45.2,
      monthly: 950,
      total: 12500,
      b3trEarned: 1250
    },
    solaredge: {
      daily: 42.8,
      monthly: 885,
      total: 11200,
      b3trEarned: 1120
    },
    tesla: {
      daily: 38.5,
      monthly: 820,
      total: 9800,
      b3trEarned: 980
    },
    sma: {
      daily: 41.3,
      monthly: 900,
      total: 10500,
      b3trEarned: 1050
    },
    sunpower: {
      daily: 47.1,
      monthly: 975,
      total: 13200,
      b3trEarned: 1320
    },
    other: {
      daily: 40.0,
      monthly: 850,
      total: 10000,
      b3trEarned: 1000
    }
  };

  const providerData = baseData[provider as keyof typeof baseData] || baseData.other;

  // Add some randomness to make it feel more realistic
  const variance = 0.95 + (Math.random() * 0.1); // ±5% variance
  
  const mockProductionData: ProductionData = {
    daily: Math.round(providerData.daily * variance * 10) / 10,
    monthly: Math.round(providerData.monthly * variance),
    total: Math.round(providerData.total * variance),
    b3trEarned: Math.round(providerData.b3trEarned * variance),
    lastUpdated: new Date().toISOString(),
    provider: provider as string || 'unknown'
  };

  // Simulate API delay
  setTimeout(() => {
    res.status(200).json(mockProductionData);
  }, 500 + Math.random() * 1000); // 0.5-1.5 second delay
}
