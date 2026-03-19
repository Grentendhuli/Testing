// Listings Feature Types

export interface ListingDefaults {
  listing_laundry: 'none' | 'in_building' | 'in_unit';
  listing_pets: 'not_allowed' | 'case_by_case' | 'allowed';
  listing_heat_included: boolean;
  listing_parking: boolean;
}

export interface GeneratedListing {
  title: string;
  description: string;
  amenities: string[];
  rentSuggestion: number;
}

export interface PlatformConfig {
  name: string;
  url: string;
  icon: string;
}

export interface ListingData {
  unitId: string;
  title: string;
  description: string;
  amenities: string[];
  rent: number;
  platforms: PlatformConfig[];
}

export interface UseListingsReturn {
  generateListing: (unitId: string) => Promise<GeneratedListing | null>;
  isGenerating: boolean;
  error: string | null;
  saveListingDefaults: (defaults: Partial<ListingDefaults>) => Promise<void>;
}
