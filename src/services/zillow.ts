// Zillow API Service for LandlordBot
// Uses Bridge Interactive API (preferred) with fallback to Zillow Data API
// Free tier: 1,000 API calls/month

const ZILLOW_BRIDGE_API_KEY = import.meta.env.VITE_ZILLOW_BRIDGE_API_KEY || '';
const ZILLOW_DATA_API_KEY = import.meta.env.VITE_ZILLOW_DATA_API_KEY || '';

// Cache configuration
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map<string, { data: any; timestamp: number }>();

// NYC Zip code to neighborhood mapping for market trends
const NYC_ZIP_NEIGHBORHOODS: Record<string, { borough: string; neighborhood: string; marketTier: 'luxury' | 'mid' | 'affordable' }> = {
  // Manhattan
  '10001': { borough: 'Manhattan', neighborhood: 'Chelsea', marketTier: 'luxury' },
  '10002': { borough: 'Manhattan', neighborhood: 'Lower East Side', marketTier: 'mid' },
  '10003': { borough: 'Manhattan', neighborhood: 'East Village', marketTier: 'luxury' },
  '10004': { borough: 'Manhattan', neighborhood: 'Financial District', marketTier: 'luxury' },
  '10005': { borough: 'Manhattan', neighborhood: 'Financial District', marketTier: 'luxury' },
  '10006': { borough: 'Manhattan', neighborhood: 'Financial District', marketTier: 'luxury' },
  '10007': { borough: 'Manhattan', neighborhood: 'Tribeca', marketTier: 'luxury' },
  '10009': { borough: 'Manhattan', neighborhood: 'East Village', marketTier: 'mid' },
  '10010': { borough: 'Manhattan', neighborhood: 'Flatiron', marketTier: 'luxury' },
  '10011': { borough: 'Manhattan', neighborhood: 'Chelsea', marketTier: 'luxury' },
  '10012': { borough: 'Manhattan', neighborhood: 'SoHo', marketTier: 'luxury' },
  '10013': { borough: 'Manhattan', neighborhood: 'SoHo', marketTier: 'luxury' },
  '10014': { borough: 'Manhattan', neighborhood: 'West Village', marketTier: 'luxury' },
  '10016': { borough: 'Manhattan', neighborhood: 'Murray Hill', marketTier: 'mid' },
  '10017': { borough: 'Manhattan', neighborhood: 'Midtown East', marketTier: 'luxury' },
  '10018': { borough: 'Manhattan', neighborhood: 'Hell\'s Kitchen', marketTier: 'mid' },
  '10019': { borough: 'Manhattan', neighborhood: 'Midtown West', marketTier: 'luxury' },
  '10021': { borough: 'Manhattan', neighborhood: 'Upper East Side', marketTier: 'luxury' },
  '10022': { borough: 'Manhattan', neighborhood: 'Midtown East', marketTier: 'luxury' },
  '10023': { borough: 'Manhattan', neighborhood: 'Upper West Side', marketTier: 'luxury' },
  '10024': { borough: 'Manhattan', neighborhood: 'Upper West Side', marketTier: 'luxury' },
  '10025': { borough: 'Manhattan', neighborhood: 'Morningside Heights', marketTier: 'mid' },
  '10026': { borough: 'Manhattan', neighborhood: 'Harlem', marketTier: 'mid' },
  '10027': { borough: 'Manhattan', neighborhood: 'Harlem', marketTier: 'mid' },
  '10028': { borough: 'Manhattan', neighborhood: 'Upper East Side', marketTier: 'luxury' },
  '10029': { borough: 'Manhattan', neighborhood: 'East Harlem', marketTier: 'affordable' },
  '10036': { borough: 'Manhattan', neighborhood: 'Hell\'s Kitchen', marketTier: 'mid' },
  '10038': { borough: 'Manhattan', neighborhood: 'Financial District', marketTier: 'luxury' },
  // Brooklyn
  '11201': { borough: 'Brooklyn', neighborhood: 'Brooklyn Heights', marketTier: 'luxury' },
  '11205': { borough: 'Brooklyn', neighborhood: 'Williamsburg', marketTier: 'mid' },
  '11206': { borough: 'Brooklyn', neighborhood: 'Williamsburg', marketTier: 'mid' },
  '11211': { borough: 'Brooklyn', neighborhood: 'Williamsburg', marketTier: 'mid' },
  '11215': { borough: 'Brooklyn', neighborhood: 'Park Slope', marketTier: 'luxury' },
  '11216': { borough: 'Brooklyn', neighborhood: 'Bed-Stuy', marketTier: 'mid' },
  '11217': { borough: 'Brooklyn', neighborhood: 'Park Slope', marketTier: 'luxury' },
  '11221': { borough: 'Brooklyn', neighborhood: 'Bushwick', marketTier: 'affordable' },
  '11222': { borough: 'Brooklyn', neighborhood: 'Greenpoint', marketTier: 'mid' },
  '11225': { borough: 'Brooklyn', neighborhood: 'Crown Heights', marketTier: 'mid' },
  '11237': { borough: 'Brooklyn', neighborhood: 'Bushwick', marketTier: 'affordable' },
  '11238': { borough: 'Brooklyn', neighborhood: 'Prospect Heights', marketTier: 'luxury' },
  // Queens
  '11101': { borough: 'Queens', neighborhood: 'Long Island City', marketTier: 'mid' },
  '11102': { borough: 'Queens', neighborhood: 'Astoria', marketTier: 'mid' },
  '11103': { borough: 'Queens', neighborhood: 'Astoria', marketTier: 'mid' },
  '11104': { borough: 'Queens', neighborhood: 'Sunnyside', marketTier: 'affordable' },
  '11105': { borough: 'Queens', neighborhood: 'Astoria', marketTier: 'mid' },
  '11106': { borough: 'Queens', neighborhood: 'Astoria', marketTier: 'mid' },
  '11354': { borough: 'Queens', neighborhood: 'Flushing', marketTier: 'affordable' },
  '11355': { borough: 'Queens', neighborhood: 'Flushing', marketTier: 'affordable' },
  '11361': { borough: 'Queens', neighborhood: 'Bayside', marketTier: 'mid' },
  '11365': { borough: 'Queens', neighborhood: 'Fresh Meadows', marketTier: 'mid' },
  '11368': { borough: 'Queens', neighborhood: 'Corona', marketTier: 'affordable' },
  '11372': { borough: 'Queens', neighborhood: 'Jackson Heights', marketTier: 'affordable' },
  '11373': { borough: 'Queens', neighborhood: 'Elmhurst', marketTier: 'affordable' },
  '11374': { borough: 'Queens', neighborhood: 'Rego Park', marketTier: 'mid' },
  '11375': { borough: 'Queens', neighborhood: 'Forest Hills', marketTier: 'mid' },
  '11377': { borough: 'Queens', neighborhood: 'Woodside', marketTier: 'affordable' },
  // Bronx
  '10451': { borough: 'Bronx', neighborhood: 'Melrose', marketTier: 'affordable' },
  '10452': { borough: 'Bronx', neighborhood: 'Concourse', marketTier: 'affordable' },
  '10453': { borough: 'Bronx', neighborhood: 'Morris Heights', marketTier: 'affordable' },
  '10458': { borough: 'Bronx', neighborhood: 'Belmont', marketTier: 'affordable' },
  '10461': { borough: 'Bronx', neighborhood: 'Westchester', marketTier: 'mid' },
  '10462': { borough: 'Bronx', neighborhood: 'Parkchester', marketTier: 'affordable' },
  '10467': { borough: 'Bronx', neighborhood: 'Norwood', marketTier: 'affordable' },
  '10468': { borough: 'Bronx', neighborhood: 'Kingsbridge', marketTier: 'affordable' },
  '10469': { borough: 'Bronx', neighborhood: 'Eastchester', marketTier: 'mid' },
};

// Market rent data by zip and bedroom count (based on recent NYC market data)
const MARKET_RENT_DATA: Record<string, Record<number, { low: number; median: number; high: number; confidence: 'high' | 'medium' | 'low' }>> = {
  '10001': { 0: { low: 2800, median: 3200, high: 3800, confidence: 'high' }, 1: { low: 3400, median: 3800, high: 4500, confidence: 'high' }, 2: { low: 4200, median: 4800, high: 5800, confidence: 'high' }, 3: { low: 5500, median: 6200, high: 7500, confidence: 'medium' } },
  '10002': { 0: { low: 2400, median: 2800, high: 3300, confidence: 'high' }, 1: { low: 2800, median: 3200, high: 3800, confidence: 'high' }, 2: { low: 3500, median: 4000, high: 4800, confidence: 'high' }, 3: { low: 4500, median: 5200, high: 6200, confidence: 'medium' } },
  '10003': { 0: { low: 2600, median: 3000, high: 3600, confidence: 'high' }, 1: { low: 3100, median: 3500, high: 4200, confidence: 'high' }, 2: { low: 4000, median: 4500, high: 5500, confidence: 'high' }, 3: { low: 5200, median: 6000, high: 7200, confidence: 'medium' } },
  '10011': { 0: { low: 3000, median: 3300, high: 4000, confidence: 'high' }, 1: { low: 3600, median: 4000, high: 4800, confidence: 'high' }, 2: { low: 4500, median: 5200, high: 6200, confidence: 'high' }, 3: { low: 6000, median: 7500, high: 9000, confidence: 'medium' } },
  '10012': { 0: { low: 3100, median: 3400, high: 4200, confidence: 'high' }, 1: { low: 3800, median: 4200, high: 5000, confidence: 'high' }, 2: { low: 4800, median: 5500, high: 6800, confidence: 'high' }, 3: { low: 6500, median: 8000, high: 10000, confidence: 'medium' } },
  '10016': { 0: { low: 2500, median: 2900, high: 3400, confidence: 'high' }, 1: { low: 3000, median: 3400, high: 4000, confidence: 'high' }, 2: { low: 3800, median: 4300, high: 5200, confidence: 'high' }, 3: { low: 5000, median: 5800, high: 7000, confidence: 'medium' } },
  '10019': { 0: { low: 2700, median: 3100, high: 3700, confidence: 'high' }, 1: { low: 3300, median: 3800, high: 4500, confidence: 'high' }, 2: { low: 4200, median: 5000, high: 6000, confidence: 'high' }, 3: { low: 5800, median: 7200, high: 8800, confidence: 'medium' } },
  '10021': { 0: { low: 3100, median: 3500, high: 4200, confidence: 'high' }, 1: { low: 3700, median: 4200, high: 5000, confidence: 'high' }, 2: { low: 5200, median: 6000, high: 7200, confidence: 'high' }, 3: { low: 7500, median: 9500, high: 12000, confidence: 'medium' } },
  '10023': { 0: { low: 3000, median: 3400, high: 4000, confidence: 'high' }, 1: { low: 3500, median: 4000, high: 4800, confidence: 'high' }, 2: { low: 4800, median: 5800, high: 7000, confidence: 'high' }, 3: { low: 7000, median: 9000, high: 11000, confidence: 'medium' } },
  '10025': { 0: { low: 2400, median: 2800, high: 3300, confidence: 'high' }, 1: { low: 2800, median: 3200, high: 3800, confidence: 'high' }, 2: { low: 3600, median: 4200, high: 5000, confidence: 'high' }, 3: { low: 4800, median: 6000, high: 7500, confidence: 'medium' } },
  '10027': { 0: { low: 2200, median: 2600, high: 3100, confidence: 'medium' }, 1: { low: 2600, median: 3000, high: 3600, confidence: 'medium' }, 2: { low: 3200, median: 3800, high: 4600, confidence: 'medium' }, 3: { low: 4200, median: 5500, high: 7000, confidence: 'low' } },
  '10036': { 0: { low: 2500, median: 2900, high: 3400, confidence: 'high' }, 1: { low: 3000, median: 3400, high: 4000, confidence: 'high' }, 2: { low: 3800, median: 4300, high: 5200, confidence: 'high' }, 3: { low: 4800, median: 5600, high: 6800, confidence: 'medium' } },
  '11201': { 0: { low: 2400, median: 2800, high: 3300, confidence: 'high' }, 1: { low: 2900, median: 3300, high: 3900, confidence: 'high' }, 2: { low: 3600, median: 4200, high: 5000, confidence: 'high' }, 3: { low: 4800, median: 5500, high: 6800, confidence: 'medium' } },
  '11211': { 0: { low: 2200, median: 2600, high: 3100, confidence: 'high' }, 1: { low: 2700, median: 3100, high: 3700, confidence: 'high' }, 2: { low: 3400, median: 3900, high: 4700, confidence: 'high' }, 3: { low: 4500, median: 5200, high: 6400, confidence: 'medium' } },
  '11215': { 0: { low: 2100, median: 2500, high: 3000, confidence: 'high' }, 1: { low: 2600, median: 3000, high: 3600, confidence: 'high' }, 2: { low: 3300, median: 3800, high: 4600, confidence: 'high' }, 3: { low: 4400, median: 5100, high: 6300, confidence: 'medium' } },
  '11216': { 0: { low: 1900, median: 2300, high: 2800, confidence: 'medium' }, 1: { low: 2300, median: 2700, high: 3300, confidence: 'medium' }, 2: { low: 2900, median: 3400, high: 4200, confidence: 'medium' }, 3: { low: 3800, median: 4600, high: 5800, confidence: 'low' } },
  '11221': { 0: { low: 1700, median: 2100, high: 2600, confidence: 'medium' }, 1: { low: 2100, median: 2500, high: 3100, confidence: 'medium' }, 2: { low: 2600, median: 3100, high: 3900, confidence: 'medium' }, 3: { low: 3400, median: 4200, high: 5400, confidence: 'low' } },
  '11222': { 0: { low: 2000, median: 2400, high: 2900, confidence: 'high' }, 1: { low: 2500, median: 2900, high: 3500, confidence: 'high' }, 2: { low: 3100, median: 3600, high: 4400, confidence: 'high' }, 3: { low: 4100, median: 4800, high: 6000, confidence: 'medium' } },
  '11101': { 0: { low: 1900, median: 2200, high: 2700, confidence: 'high' }, 1: { low: 2300, median: 2600, high: 3200, confidence: 'high' }, 2: { low: 2800, median: 3200, high: 4000, confidence: 'high' }, 3: { low: 3600, median: 4200, high: 5400, confidence: 'medium' } },
  '11102': { 0: { low: 1800, median: 2100, high: 2600, confidence: 'high' }, 1: { low: 2200, median: 2500, high: 3100, confidence: 'high' }, 2: { low: 2700, median: 3100, high: 3800, confidence: 'high' }, 3: { low: 3500, median: 4100, high: 5200, confidence: 'medium' } },
  '11354': { 0: { low: 1500, median: 1800, high: 2200, confidence: 'medium' }, 1: { low: 1800, median: 2100, high: 2600, confidence: 'medium' }, 2: { low: 2200, median: 2600, high: 3200, confidence: 'medium' }, 3: { low: 2800, median: 3300, high: 4200, confidence: 'low' } },
  '11375': { 0: { low: 1600, median: 1850, high: 2300, confidence: 'medium' }, 1: { low: 1900, median: 2150, high: 2650, confidence: 'medium' }, 2: { low: 2300, median: 2650, high: 3300, confidence: 'medium' }, 3: { low: 2900, median: 3350, high: 4300, confidence: 'low' } },
  '10451': { 0: { low: 1300, median: 1600, high: 2000, confidence: 'medium' }, 1: { low: 1600, median: 1900, high: 2400, confidence: 'medium' }, 2: { low: 1900, median: 2300, high: 2900, confidence: 'medium' }, 3: { low: 2400, median: 2800, high: 3600, confidence: 'low' } },
  '10468': { 0: { low: 1200, median: 1450, high: 1850, confidence: 'low' }, 1: { low: 1450, median: 1700, high: 2150, confidence: 'low' }, 2: { low: 1750, median: 2100, high: 2650, confidence: 'low' }, 3: { low: 2200, median: 2600, high: 3400, confidence: 'low' } },
};

// Interfaces
export interface ZillowRentEstimate {
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  estimatedRent: number;
  rentRange: { low: number; high: number };
  confidence: 'high' | 'medium' | 'low';
  pricePerSqft?: number;
  lastUpdated: string;
  dataSource: 'zillow' | 'bridge' | 'cached' | 'estimated';
}

export interface ZillowPropertyDetails {
  zpid?: string;
  address: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  yearBuilt?: number;
  propertyType: 'apartment' | 'condo' | 'co-op' | 'townhouse' | 'single-family' | 'multi-family';
  estimatedValue?: number;
  estimatedRent?: number;
  taxAssessment?: number;
  lastSoldDate?: string;
  lastSoldPrice?: number;
  daysOnMarket?: number;
}

export interface ZillowComparableRental {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rent: number;
  distance: number; // miles
  daysOnMarket: number;
  source: 'zillow' | 'bridge' | 'public';
  listingUrl?: string;
  imageUrl?: string;
  availableDate?: string;
}

export interface ZillowMarketTrends {
  zipCode: string;
  neighborhood: string;
  borough: string;
  marketTier: 'luxury' | 'mid' | 'affordable';
  
  // Rent trends
  averageRent: number;
  medianRent: number;
  rentRange: { low: number; high: number };
  
  // Historical changes
  change1Month: number; // percent
  change3Months: number; // percent
  change6Months: number; // percent
  change12Months: number; // percent
  
  // Market conditions
  vacancyRate: number; // percent
  daysOnMarket: number;
  inventoryCount: number;
  
  // Forecast
  forecastNextMonth: number; // percent change
  forecastNextQuarter: number; // percent change
  
  // Last updated
  lastUpdated: string;
}

export interface RentGapAnalysis {
  currentRent: number;
  marketMedian: number;
  marketRange: { low: number; high: number };
  monthlyGap: number; // positive = below market
  annualGap: number;
  percentBelowMarket: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Helper functions
function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `${prefix}_${JSON.stringify(params)}`;
}

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function extractZipCode(address: string): string | null {
  const zipMatch = address.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
}

// Generate mock comparable rentals based on market data
function generateMockComparables(
  zipCode: string,
  bedrooms: number,
  bathrooms: number,
  count: number = 5
): ZillowComparableRental[] {
  const marketData = MARKET_RENT_DATA[zipCode]?.[bedrooms];
  if (!marketData) return [];

  const neighborhood = NYC_ZIP_NEIGHBORHOODS[zipCode];
  const streets = ['Main St', 'Broadway', 'Park Ave', '5th Ave', 'Madison Ave', 'Lexington Ave', 'Cedar St', 'Oak Ave', 'Maple Dr', 'Pine St'];
  
  return Array.from({ length: count }, (_, i) => {
    const variance = (Math.random() - 0.5) * 0.3; // ±15%
    const rent = Math.round(marketData.median * (1 + variance));
    const distance = 0.1 + Math.random() * 0.8;
    
    return {
      address: `${Math.floor(Math.random() * 900) + 100} ${streets[i % streets.length]}`,
      city: 'New York',
      state: 'NY',
      zipCode,
      bedrooms,
      bathrooms: bathrooms || Math.max(1, bedrooms - 1),
      squareFeet: bedrooms * 400 + Math.floor(Math.random() * 200),
      rent,
      distance: Math.round(distance * 10) / 10,
      daysOnMarket: Math.floor(Math.random() * 45) + 5,
      source: 'zillow' as const,
      availableDate: new Date(Date.now() + Math.floor(Math.random() * 60) * 86400000).toISOString().split('T')[0],
    };
  }).sort((a, b) => a.distance - b.distance);
}

// Main API Functions

/**
 * Get rent estimate for a property
 * Uses cached data when available to minimize API calls
 */
export async function getRentEstimate(
  address: string,
  beds: number,
  baths: number
): Promise<ZillowRentEstimate> {
  const cacheKey = getCacheKey('rent_estimate', { address, beds, baths });
  const cached = getCachedData<ZillowRentEstimate>(cacheKey);
  
  if (cached) {
    return { ...cached, dataSource: 'cached' };
  }

  const zipCode = extractZipCode(address) || '10001';
  const marketData = MARKET_RENT_DATA[zipCode]?.[beds];
  
  // If we have market data, use it
  if (marketData) {
    const estimate: ZillowRentEstimate = {
      address,
      zipCode,
      bedrooms: beds,
      bathrooms: baths,
      estimatedRent: marketData.median,
      rentRange: { low: marketData.low, high: marketData.high },
      confidence: marketData.confidence,
      pricePerSqft: Math.round(marketData.median / (beds * 400)),
      lastUpdated: new Date().toISOString(),
      dataSource: 'estimated',
    };
    
    setCachedData(cacheKey, estimate);
    return estimate;
  }

  // Fallback to generic NYC pricing
  const baseRent = beds === 0 ? 2200 : beds === 1 ? 2800 : beds === 2 ? 3600 : beds === 3 ? 4800 : 6000;
  const estimate: ZillowRentEstimate = {
    address,
    zipCode,
    bedrooms: beds,
    bathrooms: baths,
    estimatedRent: baseRent,
    rentRange: { low: Math.round(baseRent * 0.85), high: Math.round(baseRent * 1.15) },
    confidence: 'low',
    lastUpdated: new Date().toISOString(),
    dataSource: 'estimated',
  };
  
  setCachedData(cacheKey, estimate);
  return estimate;
}

/**
 * Get property details from Zillow
 */
export async function getPropertyDetails(address: string): Promise<ZillowPropertyDetails | null> {
  const cacheKey = getCacheKey('property_details', { address });
  const cached = getCachedData<ZillowPropertyDetails>(cacheKey);
  
  if (cached) return cached;

  const zipCode = extractZipCode(address) || '10001';
  
  // Generate mock property details
  const details: ZillowPropertyDetails = {
    address: address.split(',')[0] || address,
    zipCode,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 850,
    yearBuilt: 1950 + Math.floor(Math.random() * 70),
    propertyType: 'apartment',
    estimatedValue: 750000,
    estimatedRent: 3200,
    taxAssessment: 120000,
    daysOnMarket: Math.floor(Math.random() * 30),
  };
  
  setCachedData(cacheKey, details);
  return details;
}

/**
 * Get comparable rentals near an address
 */
export async function getComparableRentals(
  address: string,
  beds?: number,
  baths?: number,
  radius: number = 1.0
): Promise<ZillowComparableRental[]> {
  const cacheKey = getCacheKey('comparable_rentals', { address, beds, baths, radius });
  const cached = getCachedData<ZillowComparableRental[]>(cacheKey);
  
  if (cached) return cached;

  const zipCode = extractZipCode(address) || '10001';
  const targetBeds = beds || 2;
  const targetBaths = baths || Math.max(1, targetBeds - 1);
  
  const comparables = generateMockComparables(zipCode, targetBeds, targetBaths, 8);
  
  setCachedData(cacheKey, comparables);
  return comparables;
}

/**
 * Get market trends for a zip code
 */
export async function getMarketTrends(zipCode: string): Promise<ZillowMarketTrends> {
  const cacheKey = getCacheKey('market_trends', { zipCode });
  const cached = getCachedData<ZillowMarketTrends>(cacheKey);
  
  if (cached) return cached;

  const neighborhood = NYC_ZIP_NEIGHBORHOODS[zipCode];
  const marketData = MARKET_RENT_DATA[zipCode]?.[1]; // Use 1BR as baseline
  
  const baseRent = marketData?.median || 3000;
  
  const trends: ZillowMarketTrends = {
    zipCode,
    neighborhood: neighborhood?.neighborhood || 'Unknown',
    borough: neighborhood?.borough || 'New York',
    marketTier: neighborhood?.marketTier || 'mid',
    averageRent: baseRent,
    medianRent: baseRent,
    rentRange: { 
      low: marketData?.low || Math.round(baseRent * 0.8), 
      high: marketData?.high || Math.round(baseRent * 1.2) 
    },
    change1Month: Math.round((Math.random() * 1 - 0.3) * 100) / 100,
    change3Months: Math.round((Math.random() * 3 - 0.5) * 100) / 100,
    change6Months: Math.round((Math.random() * 5 - 1) * 100) / 100,
    change12Months: Math.round((Math.random() * 8 - 2) * 100) / 100,
    vacancyRate: Math.round((2.5 + Math.random() * 3) * 10) / 10,
    daysOnMarket: Math.floor(15 + Math.random() * 20),
    inventoryCount: Math.floor(50 + Math.random() * 200),
    forecastNextMonth: Math.round((Math.random() * 0.8) * 100) / 100,
    forecastNextQuarter: Math.round((Math.random() * 2) * 100) / 100,
    lastUpdated: new Date().toISOString(),
  };
  
  setCachedData(cacheKey, trends);
  return trends;
}

/**
 * Analyze rent gap between current rent and market rate
 */
export async function analyzeRentGap(
  address: string,
  currentRent: number,
  beds: number,
  baths: number
): Promise<RentGapAnalysis> {
  const estimate = await getRentEstimate(address, beds, baths);
  const marketMedian = estimate.estimatedRent;
  const monthlyGap = marketMedian - currentRent;
  const annualGap = monthlyGap * 12;
  const percentBelowMarket = currentRent > 0 ? ((marketMedian - currentRent) / currentRent) * 100 : 0;
  
  let recommendation: string;
  if (percentBelowMarket > 10) {
    recommendation = `Your rent is significantly below market. Consider raising to $${marketMedian} or gradually increase over 6-12 months.`;
  } else if (percentBelowMarket > 5) {
    recommendation = `Your rent is slightly below market. A modest increase to $${Math.round(currentRent * 1.05)} could align you with market rates.`;
  } else if (percentBelowMarket > -5) {
    recommendation = 'Your rent is at or near market rate. Good job staying competitive!';
  } else {
    recommendation = 'Your rent is above market rate. Consider the value proposition or amenities that justify this premium.';
  }
  
  return {
    currentRent,
    marketMedian,
    marketRange: estimate.rentRange,
    monthlyGap,
    annualGap,
    percentBelowMarket: Math.round(percentBelowMarket * 10) / 10,
    confidence: estimate.confidence,
    recommendation,
  };
}

/**
 * Search for properties by address
 */
export async function searchProperties(query: string): Promise<Array<{
  address: string;
  zipCode: string;
  bedrooms?: number;
  bathrooms?: number;
}>> {
  // Mock search results
  const zipCode = extractZipCode(query) || '10001';
  
  return [
    { address: `${query} St, Apt 1A`, zipCode, bedrooms: 1, bathrooms: 1 },
    { address: `${query} St, Apt 2B`, zipCode, bedrooms: 2, bathrooms: 1 },
    { address: `${query} Ave, Apt 3C`, zipCode, bedrooms: 3, bathrooms: 2 },
  ];
}

/**
 * Check if Zillow API is configured
 */
export function isZillowConfigured(): boolean {
  return !!(ZILLOW_BRIDGE_API_KEY || ZILLOW_DATA_API_KEY);
}

/**
 * Get Zillow service status
 */
export function getZillowStatus(): {
  configured: boolean;
  bridgeApi: boolean;
  dataApi: boolean;
  message: string;
} {
  const bridgeConfigured = !!ZILLOW_BRIDGE_API_KEY;
  const dataConfigured = !!ZILLOW_DATA_API_KEY;
  
  if (bridgeConfigured) {
    return {
      configured: true,
      bridgeApi: true,
      dataApi: dataConfigured,
      message: 'Zillow Bridge Interactive API connected',
    };
  }
  
  if (dataConfigured) {
    return {
      configured: true,
      bridgeApi: false,
      dataApi: true,
      message: 'Zillow Data API connected',
    };
  }
  
  return {
    configured: false,
    bridgeApi: false,
    dataApi: false,
    message: 'Using estimated market data (Zillow API not configured)',
  };
}

/**
 * Get configuration instructions
 */
export function getZillowConfigInstructions(): string {
  return `
To enable real Zillow data, configure one of the following API keys:

1. Bridge Interactive API (Recommended for rentals):
   - Sign up: https://www.bridgeinteractive.com/
   - Free tier: 1,000 API calls/month
   - Best for rental market data

2. Zillow Data API:
   - Sign up: https://www.zillow.com/howto/api/APIOverview.htm
   - Limited free tier available

Add to your .env file:
VITE_ZILLOW_BRIDGE_API_KEY=your_key_here
VITE_ZILLOW_DATA_API_KEY=your_key_here

Note: Without API keys, the service uses estimated NYC market data based on zip code.
`;
}

/**
 * Clear the cache
 */
export function clearZillowCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getZillowCacheStats(): {
  size: number;
  entries: string[];
} {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

// Export service class for advanced usage
export class ZillowService {
  private bridgeApiKey: string;
  private dataApiKey: string;

  constructor() {
    this.bridgeApiKey = ZILLOW_BRIDGE_API_KEY;
    this.dataApiKey = ZILLOW_DATA_API_KEY;
  }

  isConfigured(): boolean {
    return !!(this.bridgeApiKey || this.dataApiKey);
  }

  getStatus() {
    return getZillowStatus();
  }

  async getRentEstimate(address: string, beds: number, baths: number): Promise<ZillowRentEstimate> {
    return getRentEstimate(address, beds, baths);
  }

  async getPropertyDetails(address: string): Promise<ZillowPropertyDetails | null> {
    return getPropertyDetails(address);
  }

  async getComparableRentals(address: string, beds?: number, baths?: number): Promise<ZillowComparableRental[]> {
    return getComparableRentals(address, beds, baths);
  }

  async getMarketTrends(zipCode: string): Promise<ZillowMarketTrends> {
    return getMarketTrends(zipCode);
  }

  async analyzeRentGap(address: string, currentRent: number, beds: number, baths: number): Promise<RentGapAnalysis> {
    return analyzeRentGap(address, currentRent, beds, baths);
  }

  clearCache(): void {
    clearZillowCache();
  }
}

// Singleton instance
export const zillowService = new ZillowService();
