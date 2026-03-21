// Rentometer API Integration
// Rentometer provides rent comparison data for rental properties
// Docs: https://www.rentometer.com/api/v1/documentation

import type { MarketInsight, ComparableRent } from '../types/pro';

export interface RentometerConfig {
  apiKey: string;
}

export interface RentometerAddressSearchRequest {
  address: string;
  bedrooms: number;
  bathrooms?: number;
  propertyType?: 'house' | 'apartment' | 'condo' | 'townhouse';
  rent?: number;
}

export interface RentometerCompsResponse {
  address: {
    full: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  bedrooms: number;
  bathrooms?: number;
  rent: {
    mean: number;
    median: number;
    min: number;
    max: number;
    percentile_25: number;
    percentile_75: number;
    sample_size: number;
  };
  comps: Array<{
    address: string;
    city: string;
    state: string;
    zip: string;
    bedrooms: number;
    bathrooms?: number;
    rent: number;
    distance_miles: number;
    days_on_market?: number;
    source: string;
  }>;
  vacancy?: {
    rate: number;
    days_on_market: number;
  };
  year_over_year_change?: number;
}

export interface RentometerError {
  error: string;
  message: string;
}

const RENTOMETER_API_BASE = 'https://www.rentometer.com/api/v1';

export class RentometerService {
  private apiKey: string;
  private isConfigured: boolean;

  constructor(config?: RentometerConfig) {
    this.apiKey = config?.apiKey || (import.meta as any).env?.VITE_RENTOMETER_API_KEY || '';
    this.isConfigured = !!this.apiKey;
  }

  isReady(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (this.isConfigured) {
      return { configured: true, message: 'Rentometer API connected' };
    }
    return { 
      configured: false, 
      message: 'Rentometer API key not configured. Add VITE_RENTOMETER_API_KEY to your .env file.' 
    };
  }

  async getRentComps(request: RentometerAddressSearchRequest): Promise<RentometerCompsResponse> {
    if (!this.isConfigured) {
      throw new Error('Rentometer API not configured. Set VITE_RENTOMETER_API_KEY environment variable.');
    }

    const url = new URL(`${RENTOMETER_API_BASE}/comps`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('address', request.address);
    url.searchParams.append('bedrooms', request.bedrooms.toString());
    
    if (request.bathrooms) {
      url.searchParams.append('bathrooms', request.bathrooms.toString());
    }
    if (request.propertyType) {
      url.searchParams.append('property_type', request.propertyType);
    }
    if (request.rent) {
      url.searchParams.append('rent', request.rent.toString());
    }

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data: RentometerCompsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Rentometer API error:', error);
      throw error;
    }
  }

  async getMarketInsight(
    propertyId: string,
    unitAddress: string,
    currentRent: number,
    bedrooms: number,
    bathrooms?: number
  ): Promise<MarketInsight> {
    const comps = await this.getRentComps({
      address: unitAddress,
      bedrooms,
      bathrooms,
    });

    const comparableRents: ComparableRent[] = comps.comps.map(comp => ({
      address: comp.address,
      beds: comp.bedrooms,
      baths: comp.bathrooms || bedrooms,
      sqft: 0, // Rentometer doesn't always provide sqft
      rent: comp.rent,
      distance: comp.distance_miles,
      source: this.mapSource(comp.source),
    }));

    const marketMedian = comps.rent.median;
    const rentGap = marketMedian > currentRent ? marketMedian - currentRent : 0;
    const rentGapPercent = currentRent > 0 ? ((marketMedian - currentRent) / currentRent) * 100 : 0;
    const suggestedRent = Math.max(currentRent, marketMedian);
    const potentialAnnualIncrease = rentGap * 12;

    return {
      id: `insight_${propertyId}_${Date.now()}`,
      propertyId,
      generatedAt: new Date().toISOString(),
      comparableRents: comparableRents.slice(0, 5),
      marketRangeLow: comps.rent.min,
      marketRangeHigh: comps.rent.max,
      marketMedian,
      currentRent,
      rentGap,
      rentGapPercent,
      twelveMonthChange: comps.year_over_year_change || 0,
      vacancyRate: comps.vacancy?.rate || 3.5,
      daysOnMarket: comps.vacancy?.days_on_market || 18,
      suggestedRent,
      potentialAnnualIncrease,
    };
  }

  private mapSource(source: string): ComparableRent['source'] {
    const sourceLower = source?.toLowerCase() || '';
    if (sourceLower.includes('zillow')) return 'zillow';
    if (sourceLower.includes('redfin')) return 'redfin';
    if (sourceLower.includes('apartments')) return 'apartments';
    if (sourceLower.includes('crexi')) return 'crexi';
    return 'apartments';
  }
}

// Fallback demo data generator for when API is not available
export function generateDemoMarketInsight(
  propertyId: string,
  unitAddress: string,
  currentRent: number,
  bedrooms: number,
  bathrooms: number
): MarketInsight {
  // Generate realistic market data based on unit characteristics
  const baseRent = bedrooms === 1 ? 2000 : bedrooms === 2 ? 2800 : 3500;
  const marketMedian = baseRent + Math.floor(Math.random() * 300) - 100;
  const marketRangeLow = marketMedian - 400;
  const marketRangeHigh = marketMedian + 500;
  const rentGap = marketMedian > currentRent ? marketMedian - currentRent : 0;

  const comparableRents: ComparableRent[] = [
    {
      address: '1423 Similar St, Unit 2B',
      beds: bedrooms,
      baths: bathrooms,
      sqft: 850 + (bedrooms * 100),
      rent: marketMedian - 100,
      distance: 0.2,
      source: 'zillow',
    },
    {
      address: '1427 Similar St, Unit 3A',
      beds: bedrooms,
      baths: bathrooms,
      sqft: 900 + (bedrooms * 100),
      rent: marketMedian + 50,
      distance: 0.3,
      source: 'redfin',
    },
    {
      address: '1400 Nearby Ave, Unit 1A',
      beds: bedrooms,
      baths: bathrooms,
      sqft: 800 + (bedrooms * 100),
      rent: marketMedian - 150,
      distance: 0.5,
      source: 'apartments',
    },
    {
      address: `143${Math.floor(Math.random() * 9)} Close St, Unit 4B`,
      beds: bedrooms,
      baths: bathrooms,
      sqft: 875 + (bedrooms * 100),
      rent: marketMedian + 25,
      distance: 0.3,
      source: 'zillow',
    },
    {
      address: `142${Math.floor(Math.random() * 9)} Local Rd, Unit 2C`,
      beds: bedrooms,
      baths: bathrooms,
      sqft: 825 + (bedrooms * 100),
      rent: marketMedian - 75,
      distance: 0.6,
      source: 'apartments',
    },
  ];

  return {
    id: `insight_${propertyId}_demo`,
    propertyId,
    generatedAt: new Date().toISOString(),
    comparableRents,
    marketRangeLow,
    marketRangeHigh,
    marketMedian,
    currentRent,
    rentGap,
    rentGapPercent: currentRent > 0 ? (rentGap / currentRent) * 100 : 0,
    twelveMonthChange: 5 + Math.random() * 8,
    vacancyRate: 2.5 + Math.random() * 2,
    daysOnMarket: 12 + Math.floor(Math.random() * 15),
    suggestedRent: marketMedian,
    potentialAnnualIncrease: rentGap * 12,
  };
}

// Singleton instance
export const rentometerService = new RentometerService();
