// Property Valuation Service (Zillow-style)
// Provides market valuation estimates based on address and unit characteristics

export interface PropertyValuationRequest {
  address: string;
  unitNumber?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  yearBuilt?: number;
  propertyType?: 'single-family' | 'condo' | 'co-op' | 'multi-family' | 'townhouse';
  buildingClass?: 'A' | 'B' | 'C';
}

export interface PropertyValuation {
  zpid: string; // Zillow Property ID equivalent
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;
  };
  
  // Market Values
  estimatedValue: number;
  estimatedValueLow: number;
  estimatedValueHigh: number;
  valueChange30Days: number;
  valueChange1Year: number;
  
  // Price per sqft
  pricePerSqft: number;
  pricePerSqftRange: {
    low: number;
    high: number;
  };
  
  // Rental Estimate
  estimatedRent: number;
  estimatedRentLow: number;
  estimatedRentHigh: number;
  rentChange30Days: number;
  rentEstimatePerSqft: number;
  
  // Investment Metrics
  capRate: number;
  grossRentMultiplier: number;
  cashOnCashReturn: number; // Estimated with 20% down
  
  // Market Comparables
  comparables: PropertyComparable[];
  
  // Tax & Ownership
  taxAssessment: number;
  taxYear: number;
  
  // Building Info
  yearBuilt: number;
  lotSize?: number;
  buildingSize?: number;
  
  // Confidence
  confidence: 'high' | 'medium' | 'low';
  valuationPercentile: number; // 0-100 where 50 is average
  
  // Last Updated
  lastUpdated: string;
  
  // NYC Specific
  nycBuildingClass?: string;
  rentStabilized?: boolean;
}

export interface PropertyComparable {
  address: string;
  price: number;
  pricePerSqft: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  distance: number; // in miles
  soldDate?: string;
  soldPrice?: number;
  daysOnMarket: number;
  source: 'zillow' | 'redfin' | 'public-record';
}

// Generate realistic mock valuation data based on NYC market
function generateMockValuation(request: PropertyValuationRequest): PropertyValuation {
  const { bedrooms, bathrooms, squareFeet } = request;
  const baseSqft = squareFeet || (bedrooms === 1 ? 650 : bedrooms === 2 ? 900 : 1200);
  
  // NYC pricing matrix
  const pricePerSqft = bedrooms === 0 ? 850 : // Studio
                       bedrooms === 1 ? 950 : // 1BR
                       bedrooms === 2 ? 850 : // 2BR
                       bedrooms === 3 ? 750 : // 3BR
                       700; // 4+BR
  
  const baseValue = baseSqft * pricePerSqft;
  const variance = 0.1; // 10% variance
  
  const estimatedValue = Math.round(baseValue * (1 + (Math.random() * variance * 2 - variance)));
  const estimatedRent = bedrooms === 0 ? 2400 :
                       bedrooms === 1 ? 3200 :
                       bedrooms === 2 ? 4200 :
                       bedrooms === 3 ? 5500 :
                       bedrooms === 4 ? 7000 :
                       8500;

  // Generate comparables
  const comparables: PropertyComparable[] = Array.from({ length: 5 }, (_, i) => ({
    address: `${1420 + i * 3} Nearby St, Apt ${i + 1}B`,
    price: Math.round(estimatedValue * (0.95 + Math.random() * 0.1)),
    pricePerSqft: Math.round(pricePerSqft * (0.95 + Math.random() * 0.1)),
    bedrooms,
    bathrooms,
    squareFeet: baseSqft + Math.floor(Math.random() * 50 - 25),
    distance: 0.1 + Math.random() * 0.5,
    daysOnMarket: Math.floor(Math.random() * 60),
    source: ['zillow', 'redfin', 'public-record'][Math.floor(Math.random() * 3)] as PropertyComparable['source'],
    soldDate: new Date(Date.now() - Math.floor(Math.random() * 180) * 86400000).toISOString().split('T')[0],
    soldPrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.15)),
  }));

  return {
    zpid: `ZP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    address: {
      street: request.address.split(',')[0] || '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      full: request.address,
    },
    estimatedValue,
    estimatedValueLow: Math.round(estimatedValue * 0.92),
    estimatedValueHigh: Math.round(estimatedValue * 1.08),
    valueChange30Days: Math.round((Math.random() * 2 - 0.5) * 100) / 100, // -0.5% to +1.5%
    valueChange1Year: Math.round((Math.random() * 8 - 2) * 100) / 100, // -2% to +6%
    pricePerSqft,
    pricePerSqftRange: {
      low: Math.round(pricePerSqft * 0.85),
      high: Math.round(pricePerSqft * 1.15),
    },
    estimatedRent,
    estimatedRentLow: Math.round(estimatedRent * 0.9),
    estimatedRentHigh: Math.round(estimatedRent * 1.1),
    rentChange30Days: Math.round((Math.random() * 1.5) * 100) / 100, // 0% to +1.5%
    rentEstimatePerSqft: Math.round(estimatedRent / baseSqft * 100) / 100,
    capRate: Math.round((estimatedRent * 12 / estimatedValue) * 10000) / 100,
    grossRentMultiplier: Math.round(estimatedValue / estimatedRent * 100) / 100,
    cashOnCashReturn: Math.round(((estimatedRent * 12 - estimatedValue * 0.04) / (estimatedValue * 0.2)) * 100 * 100) / 100,
    comparables: comparables.sort((a, b) => a.distance - b.distance),
    taxAssessment: Math.round(estimatedValue * 0.15),
    taxYear: new Date().getFullYear(),
    yearBuilt: request.yearBuilt || 1950 + Math.floor(Math.random() * 70),
    buildingSize: baseSqft * 1.2,
    confidence: 'medium',
    valuationPercentile: Math.floor(Math.random() * 40) + 30, // 30-70th percentile
    lastUpdated: new Date().toISOString(),
  };
}

export class PropertyValuationService {
  private apiKey: string;
  private isConfigured: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (import.meta as any).env?.VITE_ZILLOW_API_KEY || '';
    this.isConfigured = !!this.apiKey;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (this.isConfigured) {
      return { configured: true, message: 'Property valuation API connected' };
    }
    return {
      configured: false,
      message: 'Property valuation API not configured. Using demo mode with mock data.',
    };
  }

  async getValuation(request: PropertyValuationRequest): Promise<PropertyValuation> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // If not configured, return mock data
    if (!this.isConfigured) {
      return generateMockValuation(request);
    }

    // In real implementation, this would call an external API
    // For now, return mock data
    return generateMockValuation(request);
  }

  async getRentEstimate(address: string, bedrooms: number, bathrooms: number): Promise<{
    rent: number;
    range: { low: number; high: number };
    pricePerSqft: number;
  }> {
    const valuation = await this.getValuation({
      address,
      bedrooms,
      bathrooms,
    });

    return {
      rent: valuation.estimatedRent,
      range: {
        low: valuation.estimatedRentLow,
        high: valuation.estimatedRentHigh,
      },
      pricePerSqft: valuation.rentEstimatePerSqft,
    };
  }

  async searchAddress(query: string): Promise<Array<{
    address: string;
    city: string;
    state: string;
    zip: string;
  }>> {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Mock address search results
    return [
      { address: `${query} St, Apt 1A`, city: 'New York', state: 'NY', zip: '10001' },
      { address: `${query} St, Apt 2B`, city: 'Brooklyn', state: 'NY', zip: '11201' },
      { address: `${query} Ave, Apt 3C`, city: 'New York', state: 'NY', zip: '10025' },
    ];
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPercentage(value: number, decimals: number = 2): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }
}

// Singleton instance
export const propertyValuationService = new PropertyValuationService();
