import { supabase } from '@/lib/supabase';
import { Result, createError } from '@/types/result';
import type { Database } from '@/lib/database.types';
import type { ListingDefaults, GeneratedListing, ListingData } from '../types/listing.types';

// Type helpers for database tables
type UsersRow = Database['public']['Tables']['users']['Row'];

// Extended type with listing preference fields
interface UsersRowExtended extends UsersRow {
  listing_laundry?: string;
  listing_pets?: string;
  listing_heat_included?: boolean;
  listing_parking?: boolean;
}

const LISTING_DEFAULTS_KEY = 'listing_defaults';

export interface ListingService {
  getListingDefaults(userId: string): Promise<Result<ListingDefaults>>;
  saveListingDefaults(userId: string, defaults: Partial<ListingDefaults>): Promise<Result<void>>;
  generateListing(userId: string, unitId: string): Promise<Result<GeneratedListing>>;
  getUnitForListing(userId: string, unitId: string): Promise<Result<any>>;
}

// Platform configurations for one-click posting
export const LISTING_PLATFORMS = [
  { name: 'StreetEasy', url: 'https://streeteasy.com/nyc/listings/create', icon: 'Building' },
  { name: 'Zillow', url: 'https://www.zillow.com/rental-manager/listings', icon: 'Home' },
  { name: 'Craigslist', url: 'https://post.craigslist.org', icon: 'FileText' },
  { name: 'Facebook', url: 'https://www.facebook.com/marketplace/create/rental', icon: 'Facebook' },
];

export const listingService: ListingService = {
  async getListingDefaults(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('listing_laundry, listing_pets, listing_heat_included, listing_parking')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const user = data as UsersRowExtended;
      const defaults: ListingDefaults = {
        listing_laundry: (user?.listing_laundry || 'none') as ListingDefaults['listing_laundry'],
        listing_pets: (user?.listing_pets || 'case_by_case') as ListingDefaults['listing_pets'],
        listing_heat_included: user?.listing_heat_included ?? true,
        listing_parking: user?.listing_parking ?? false,
      };

      return Result.ok(defaults);
    } catch (error) {
      console.error('Error fetching listing defaults:', error);
      // Return defaults on error
      return Result.ok({
        listing_laundry: 'none',
        listing_pets: 'case_by_case',
        listing_heat_included: true,
        listing_parking: false,
      });
    }
  },

  async saveListingDefaults(userId: string, defaults: Partial<ListingDefaults>) {
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({
          listing_laundry: defaults.listing_laundry,
          listing_pets: defaults.listing_pets,
          listing_heat_included: defaults.listing_heat_included,
          listing_parking: defaults.listing_parking,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error saving listing defaults:', error);
      return Result.err(createError('DEFAULTS_SAVE_ERROR', 'Failed to save listing defaults'));
    }
  },

  async getUnitForListing(userId: string, unitId: string) {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return Result.ok(data);
    } catch (error) {
      console.error('Error fetching unit:', error);
      return Result.err(createError('UNIT_FETCH_ERROR', 'Failed to fetch unit'));
    }
  },

  async generateListing(userId: string, unitId: string) {
    try {
      // Get unit data
      const unitResult = await this.getUnitForListing(userId, unitId);
      if (!unitResult.success) {
        return Result.err(unitResult.error!);
      }
      const unit = unitResult.data;

      // Get listing defaults
      const defaultsResult = await this.getListingDefaults(userId);
      const defaults = defaultsResult.success ? defaultsResult.data : {
        listing_laundry: 'none',
        listing_pets: 'case_by_case',
        listing_heat_included: true,
        listing_parking: false,
      };

      // Generate title
      const bedrooms = unit.bedrooms || 1;
      const bathrooms = unit.bathrooms || 1;
      const title = `${bedrooms}BR/${bathrooms}BA ${unit.unit_number || 'Apartment'} in ${unit.address?.split(',')[0] || 'NYC'}`;

      // Generate description
      const amenities: string[] = [];
      if (defaults.listing_heat_included) amenities.push('heat included');
      if (defaults.listing_parking) amenities.push('parking available');
      if (defaults.listing_laundry === 'in_unit') amenities.push('in-unit laundry');
      else if (defaults.listing_laundry === 'in_building') amenities.push('laundry in building');

      const petPolicy = defaults.listing_pets === 'allowed' 
        ? 'Pets welcome!' 
        : defaults.listing_pets === 'case_by_case' 
          ? 'Pets considered on a case-by-case basis.' 
          : 'No pets, please.';

      const description = `Beautiful ${bedrooms}-bedroom, ${bathrooms}-bathroom apartment available for rent.

${unit.description || 'This well-maintained unit features modern finishes and plenty of natural light.'}

Amenities:
${amenities.map(a => `• ${a}`).join('\n')}

${petPolicy}

Rent: $${unit.rent_amount?.toLocaleString() || 'Contact for pricing'}/month

Contact us to schedule a viewing today!`;

      // Calculate rent suggestion (could integrate with Rentometer API here)
      const rentSuggestion = unit.rent_amount || 0;

      const generatedListing: GeneratedListing = {
        title,
        description,
        amenities,
        rentSuggestion,
      };

      return Result.ok(generatedListing);
    } catch (error) {
      console.error('Error generating listing:', error);
      return Result.err(createError('LISTING_GENERATE_ERROR', 'Failed to generate listing'));
    }
  }
};

export { listingService as default };
