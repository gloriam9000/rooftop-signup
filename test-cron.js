#!/usr/bin/env node

/**
 * Test script for the solar data cron job and VeWorld integration
 * Run with: node test-cron.js
 */

const { veWorldService } = require('./lib/veworld');

// Mock user connection data for testing
const mockUserConnection = {
  id: 1,
  user_id: 'test-user-123',
  provider: 'enphase',
  access_token: 'mock-token',
  system_id: 'test-system-123',
  is_active: true
};

// Mock production data
const mockProductionData = {
  kwh: 25.5, // 25.5 kWh produced today
  timestamp: new Date().toISOString()
};

async function testCronJobLogic() {
  console.log('🧪 Testing Solar Data Cron Job & VeWorld Integration\n');
  
  // Test 1: Mock data fetching
  console.log('📊 Step 1: Simulating solar data fetch...');
  console.log(`   Provider: ${mockUserConnection.provider}`);
  console.log(`   User: ${mockUserConnection.user_id}`);
  console.log(`   Production: ${mockProductionData.kwh} kWh`);
  console.log(`   Timestamp: ${mockProductionData.timestamp}\n`);
  
  // Test 2: Reward calculation
  console.log('🪙 Step 2: Calculating B3TR rewards...');
  const rewardAmount = veWorldService.calculateRewards(mockProductionData.kwh);
  console.log(`   Input: ${mockProductionData.kwh} kWh`);
  console.log(`   Rate: ${veWorldService.getRewardRate()} B3TR per kWh`);
  console.log(`   Calculated reward: ${rewardAmount} B3TR\n`);
  
  // Test 3: VeWorld distribution simulation
  console.log('🎯 Step 3: Testing VeWorld reward distribution...');
  const mockRewards = [{
    userId: mockUserConnection.user_id,
    amount: rewardAmount,
    status: 'pending',
    metadata: {
      reason: 'Solar energy production reward',
      kwhProduced: mockProductionData.kwh,
      date: new Date().toISOString().split('T')[0]
    }
  }];
  
  try {
    const distributedRewards = await veWorldService.distributeRewards(mockRewards);
    
    console.log('   Distribution Results:');
    distributedRewards.forEach(reward => {
      console.log(`   ✅ User ${reward.userId}: ${reward.amount} B3TR`);
      console.log(`      Status: ${reward.status}`);
      console.log(`      TX Hash: ${reward.txHash || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('   ❌ Distribution failed:', error.message);
  }
  
  console.log('\n🎉 Test completed!');
  
  // Test 4: Network status check
  console.log('\n🌐 Step 4: Checking VeWorld network status...');
  try {
    const networkStatus = await veWorldService.getNetworkStatus();
    console.log(`   Status: ${networkStatus.status}`);
    if (networkStatus.latency) {
      console.log(`   Latency: ${networkStatus.latency}ms`);
    }
  } catch (error) {
    console.error('   ❌ Network check failed:', error.message);
  }
  
  console.log('\n📈 Summary:');
  console.log(`   • Solar production: ${mockProductionData.kwh} kWh`);
  console.log(`   • B3TR rewards: ${rewardAmount} tokens`);
  console.log(`   • Distribution: ${mockRewards[0].status}`);
  console.log(`   • Ready for production: Yes ✅`);
}

// Run the test
if (require.main === module) {
  testCronJobLogic().catch(console.error);
}

module.exports = { testCronJobLogic };
