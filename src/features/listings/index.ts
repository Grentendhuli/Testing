// Listings Feature Barrel Export
export type { 
  ListingDefaults,
  GeneratedListing,
  PlatformConfig,
  ListingData,
  UseListingsReturn
} from './types/listing.types';

export { useListings } from './hooks/useListings';
export { listingService, LISTING_PLATFORMS } from './services/listingService';
