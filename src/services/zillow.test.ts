// Test file for Zillow API integration
// Run with: npx ts-node src/services/zillow.test.ts

import {
  getRentEstimate,
  getPropertyDetails,
  getComparableRentals,
  getMarketTrends,
  analyzeRentGap,
  isZillowConfigured,
  getZillowStatus,
  clearZillowCache,
  zillowService,
} from './zillow';

async function runTests() {
  console.log('🧪 Testing Zillow API Integration\n');

  // Test 1: Configuration status
  console.log('Test 1: Configuration Status');
  const status = getZillowStatus();
  console.log('  Configured:', status.configured);
  console.log('  Bridge API:', status.bridgeApi);
  console.log('  Data API:', status.dataApi);
  console.log('  Message:', status.message);
  console.log('  ✅ Status check complete\n');

  // Test 2: Rent Estimate
  console.log('Test 2: Rent Estimate');
  try {
    const estimate = await getRentEstimate('123 Main St, New York, NY 10001', 2, 1);
    console.log('  Address:', estimate.address);
    console.log('  Estimated Rent:', `$${estimate.estimatedRent}`);
    console.log('  Range:', `$${estimate.rentRange.low} - $${estimate.rentRange.high}`);
    console.log('  Confidence:', estimate.confidence);
    console.log('  Data Source:', estimate.dataSource);
    console.log('  ✅ Rent estimate complete\n');
  } catch (error) {
    console.error('  ❌ Rent estimate failed:', error);
  }

  // Test 3: Property Details
  console.log('Test 3: Property Details');
  try {
    const details = await getPropertyDetails('456 Broadway, New York, NY 10012');
    if (details) {
      console.log('  Address:', details.address);
      console.log('  Zip Code:', details.zipCode);
      console.log('  Bedrooms:', details.bedrooms);
      console.log('  Bathrooms:', details.bathrooms);
      console.log('  Property Type:', details.propertyType);
      console.log('  ✅ Property details complete\n');
    } else {
      console.log('  ⚠️ No details returned\n');
    }
  } catch (error) {
    console.error('  ❌ Property details failed:', error);
  }

  // Test 4: Comparable Rentals
  console.log('Test 4: Comparable Rentals');
  try {
    const comparables = await getComparableRentals('789 Park Ave, New York, NY 10021', 2, 2, 1.0);
    console.log('  Found:', comparables.length, 'comparables');
    if (comparables.length > 0) {
      console.log('  First comparable:');
      console.log('    Address:', comparables[0].address);
      console.log('    Rent:', `$${comparables[0].rent}`);
      console.log('    Distance:', `${comparables[0].distance} miles`);
    }
    console.log('  ✅ Comparables complete\n');
  } catch (error) {
    console.error('  ❌ Comparables failed:', error);
  }

  // Test 5: Market Trends
  console.log('Test 5: Market Trends');
  try {
    const trends = await getMarketTrends('10001');
    console.log('  Zip Code:', trends.zipCode);
    console.log('  Neighborhood:', trends.neighborhood);
    console.log('  Borough:', trends.borough);
    console.log('  Median Rent:', `$${trends.medianRent}`);
    console.log('  12-Month Change:', `${trends.change12Months}%`);
    console.log('  Vacancy Rate:', `${trends.vacancyRate}%`);
    console.log('  ✅ Market trends complete\n');
  } catch (error) {
    console.error('  ❌ Market trends failed:', error);
  }

  // Test 6: Rent Gap Analysis
  console.log('Test 6: Rent Gap Analysis');
  try {
    const gap = await analyzeRentGap('321 Lexington Ave, New York, NY 10016', 2800, 1, 1);
    console.log('  Current Rent:', `$${gap.currentRent}`);
    console.log('  Market Median:', `$${gap.marketMedian}`);
    console.log('  Monthly Gap:', `$${gap.monthlyGap}`);
    console.log('  Annual Gap:', `$${gap.annualGap}`);
    console.log('  Percent Below Market:', `${gap.percentBelowMarket}%`);
    console.log('  Confidence:', gap.confidence);
    console.log('  Recommendation:', gap.recommendation);
    console.log('  ✅ Rent gap analysis complete\n');
  } catch (error) {
    console.error('  ❌ Rent gap analysis failed:', error);
  }

  // Test 7: Cache functionality
  console.log('Test 7: Cache Functionality');
  try {
    // First call - should cache
    const start1 = Date.now();
    await getRentEstimate('100 Test St, New York, NY 10001', 2, 1);
    const duration1 = Date.now() - start1;
    console.log('  First call duration:', `${duration1}ms`);

    // Second call - should be cached
    const start2 = Date.now();
    await getRentEstimate('100 Test St, New York, NY 10001', 2, 1);
    const duration2 = Date.now() - start2;
    console.log('  Cached call duration:', `${duration2}ms`);
    console.log('  Cache working:', duration2 < duration1 ? '✅ Yes' : '⚠️ No');
    console.log('  ✅ Cache test complete\n');
  } catch (error) {
    console.error('  ❌ Cache test failed:', error);
  }

  // Test 8: Service class
  console.log('Test 8: ZillowService Class');
  try {
    const service = zillowService;
    console.log('  Is configured:', service.isConfigured());
    console.log('  Status:', service.getStatus().message);
    
    const estimate = await service.getRentEstimate('200 Service Test St, NY 10001', 1, 1);
    console.log('  Service estimate:', `$${estimate.estimatedRent}`);
    console.log('  ✅ Service class test complete\n');
  } catch (error) {
    console.error('  ❌ Service class test failed:', error);
  }

  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
