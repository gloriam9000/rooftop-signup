# Cron Job Setup for Solar Data & B3TR Rewards

This document explains how to set up automated daily fetching of solar production data and distribution of B3TR rewards via VeWorld/VeBetterDAO.

## Overview

The cron job system performs the following tasks daily:
1. **Fetch Solar Data**: Retrieves kWh production from all connected solar providers
2. **Store Data**: Saves production data to Supabase database
3. **Calculate Rewards**: Computes B3TR rewards based on energy production
4. **Distribute Tokens**: Sends B3TR rewards via VeWorld/VeBetterDAO integration
5. **Track Results**: Logs all transactions and statuses

## API Endpoints

### `/api/cron/daily-fetch`
- **Method**: POST
- **Purpose**: Main cron job endpoint for daily data processing
- **Authentication**: Requires Bearer token in Authorization header
- **Response**: JSON with processing statistics

### `/api/cron/test`
- **Method**: POST
- **Purpose**: Test the cron job functionality
- **Usage**: For development and debugging

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Cron Job Security
CRON_AUTH_TOKEN=your-secure-cron-token-here

# VeWorld Integration
VEWORLD_API_KEY=your-veworld-api-key
VEWORLD_NETWORK_ID=testnet
B3TR_CONTRACT_ADDRESS=your-b3tr-contract-address
```

### 2. Database Setup

Ensure your Supabase database includes the B3TR rewards table:

```sql
-- Run this in your Supabase SQL editor
CREATE TABLE b3tr_rewards (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,6) NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    distributed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Deployment Options

#### Option A: Vercel Cron (Recommended)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-fetch",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6 AM UTC.

#### Option B: GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Daily Solar Data Fetch
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Job
        run: |
          curl -X POST \\
            -H "Authorization: Bearer ${{ secrets.CRON_AUTH_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            "${{ secrets.APP_URL }}/api/cron/daily-fetch"
```

#### Option C: External Service

Use services like:
- **Cron-job.org**: Free web-based cron scheduler
- **EasyCron**: Paid service with advanced features
- **AWS EventBridge**: For AWS deployments

Configure them to send POST requests to your `/api/cron/daily-fetch` endpoint.

### 4. Security Considerations

1. **Authentication Token**: Use a strong, randomly generated CRON_AUTH_TOKEN
2. **Rate Limiting**: The cron job includes delays to respect API limits
3. **Error Handling**: Failed requests are logged and retried appropriately
4. **Database Security**: Uses Supabase RLS policies for data protection

## VeWorld/VeBetterDAO Integration

### Current Implementation

The system currently includes a simulation layer for VeWorld integration:

```typescript
// lib/veworld.ts
export class VeWorldService {
  async distributeRewards(rewards: VeWorldReward[]): Promise<VeWorldReward[]> {
    // TODO: Replace with actual VeWorld SDK
    // Currently simulates distribution for development
  }
}
```

### Production Setup

To integrate with actual VeWorld/VeBetterDAO:

1. **Install VeWorld SDK** (when available):
   ```bash
   npm install @veworld/sdk
   ```

2. **Replace simulation code** in `lib/veworld.ts`:
   ```typescript
   import { VeWorldSDK } from '@veworld/sdk'
   
   const veWorld = new VeWorldSDK({
     apiKey: process.env.VEWORLD_API_KEY,
     networkId: process.env.VEWORLD_NETWORK_ID
   })
   ```

3. **Update reward distribution**:
   ```typescript
   const transaction = await veWorld.sendB3TR({
     recipient: reward.userId,
     amount: reward.amount,
     memo: 'Solar energy production reward'
   })
   ```

## Reward Calculation

Current reward structure:
- **Rate**: 0.1 B3TR per kWh produced
- **Example**: 50 kWh daily production = 5 B3TR reward
- **Precision**: Rounded to 6 decimal places

To adjust the reward rate:
```typescript
veWorldService.updateRewardRate(0.2) // 0.2 B3TR per kWh
```

## Monitoring & Logs

### View Cron Job Logs

1. **Vercel**: Check Function Logs in Vercel dashboard
2. **Local Development**: Monitor console output
3. **Database**: Query `b3tr_rewards` table for distribution history

### Health Checks

Test the cron job manually:
```bash
curl -X POST \\
  -H "Authorization: Bearer your-cron-token" \\
  -H "Content-Type: application/json" \\
  "http://localhost:3002/api/cron/test"
```

### Common Issues

1. **Provider API Limits**: Increase delays between requests
2. **Token Expiration**: Ensure refresh token logic is working
3. **VeWorld Network**: Check network status before distribution
4. **Database Errors**: Verify Supabase connection and RLS policies

## Development Testing

Run the test endpoint during development:

```bash
# Start your Next.js server
npm run dev

# In another terminal, test the cron job
curl -X POST http://localhost:3002/api/cron/test
```

This will trigger the daily fetch process and show you the results.

## Future Enhancements

- **Batch Processing**: Process users in batches for better performance
- **Retry Logic**: Automatic retry for failed provider requests
- **Analytics**: Detailed reporting on energy production and rewards
- **Governance**: Dynamic reward rates based on VeBetterDAO proposals
- **Multi-chain**: Support for multiple blockchain networks
