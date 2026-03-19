import { useState, useCallback } from 'react';
import { listingService, LISTING_PLATFORMS } from '../services/listingService';
import type { ListingDefaults, GeneratedListing } from '../types/listing.types';

interface UseListingsReturn {
  listingDefaults: ListingDefaults | null;
  generatedListing: GeneratedListing | null;
  platforms: typeof LISTING_PLATFORMS;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  fetchDefaults: () => Promise<void>;
  saveDefaults: (defaults: Partial<ListingDefaults>) => Promise<boolean>;
  generateListing: (unitId: string) => Promise<GeneratedListing | null>;
  clearGenerated: () => void;
}

export function useListings(userId: string | undefined): UseListingsReturn {
  const [listingDefaults, setListingDefaults] = useState<ListingDefaults | null>(null);
  const [generatedListing, setGeneratedListing] = useState<GeneratedListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDefaults = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await listingService.getListingDefaults(userId);
      if (result.success) {
        setListingDefaults(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch defaults');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Defaults fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveDefaults = useCallback(async (defaults: Partial<ListingDefaults>): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const result = await listingService.saveListingDefaults(userId, defaults);
      if (result.success) {
        await fetchDefaults();
        return true;
      } else {
        setError(result.error?.message || 'Failed to save defaults');
        return false;
      }
    } catch (err) {
      setError('Failed to save defaults');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchDefaults]);

  const generateListing = useCallback(async (unitId: string): Promise<GeneratedListing | null> => {
    if (!userId) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await listingService.generateListing(userId, unitId);
      if (result.success) {
        setGeneratedListing(result.data);
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to generate listing');
        return null;
      }
    } catch (err) {
      setError('Failed to generate listing');
      console.error('Listing generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [userId]);

  const clearGenerated = useCallback(() => {
    setGeneratedListing(null);
  }, []);

  return {
    listingDefaults,
    generatedListing,
    platforms: LISTING_PLATFORMS,
    isLoading,
    isGenerating,
    error,
    fetchDefaults,
    saveDefaults,
    generateListing,
    clearGenerated,
  };
}
