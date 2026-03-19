import { useState, useEffect, useCallback, useRef } from 'react';
import {
  runComplianceCheck,
  searchBuildingByAddress,
  getHPDViolations,
  checkRentStabilization,
  getBuildingCodeViolations,
  getGoodCauseEvictionEligibility,
  NYCOpenDataService,
  type ComplianceCheckResult,
  type HPDViolation,
  type DOBViolation,
  type RentStabilizationRecord,
  type BuildingInfo,
  type GoodCauseEligibilityInput,
} from '../services/nycOpenData';
import { Result } from '../types/result';

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

interface CacheEntry {
  data: ComplianceCheckResult;
  timestamp: number;
}

interface HookState {
  data: ComplianceCheckResult | null;
  loading: boolean;
  error: string | null;
}

// Global cache for compliance data
const complianceCache = new Map<string, CacheEntry>();

/**
 * React hook for fetching NYC compliance data
 * Features:
 * - Automatic caching to avoid repeated API calls
 * - Error handling with retry logic
 * - Loading states
 * - Manual refresh capability
 */
export function useNYCCompliance(bbl?: string) {
  const [state, setState] = useState<HookState>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Clear expired cache entries
   */
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of complianceCache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION_MS) {
        complianceCache.delete(key);
      }
    }
  }, []);

  /**
   * Get cached data if available and not expired
   */
  const getCachedData = useCallback((cacheKey: string): ComplianceCheckResult | null => {
    clearExpiredCache();
    const entry = complianceCache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION_MS) {
      return entry.data;
    }
    return null;
  }, [clearExpiredCache]);

  /**
   * Set data in cache with size limit
   */
  const setCachedData = useCallback((cacheKey: string, data: ComplianceCheckResult) => {
    // If cache is full, remove oldest entry
    if (complianceCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = complianceCache.keys().next().value;
      if (oldestKey) {
        complianceCache.delete(oldestKey);
      }
    }
    
    complianceCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Fetch compliance data for a BBL
   */
  const fetchComplianceData = useCallback(async (
    targetBbl: string,
    options: { skipCache?: boolean; signal?: AbortSignal } = {}
  ): Promise<ComplianceCheckResult> => {
    const cacheKey = targetBbl.trim();
    
    // Check cache first
    if (!options.skipCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    const result = await runComplianceCheck(targetBbl);
    
    // Check if request was aborted
    if (options.signal?.aborted || abortControllerRef.current.signal.aborted) {
      throw new Error('Request aborted');
    }
    
    if (!result.success) {
      throw new Error(result.error.message || 'Failed to fetch compliance data');
    }
    
    // Cache the result
    setCachedData(cacheKey, result.data);
    
    return result.data;
  }, [getCachedData, setCachedData]);

  /**
   * Load compliance data
   */
  const loadComplianceData = useCallback(async (targetBbl?: string) => {
    const bblToUse = targetBbl || bbl;
    
    if (!bblToUse) {
      setState({ data: null, loading: false, error: 'BBL is required' });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchComplianceData(bblToUse);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch compliance data';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [bbl, fetchComplianceData]);

  /**
   * Refresh data (bypass cache)
   */
  const refresh = useCallback(async () => {
    if (!bbl) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await fetchComplianceData(bbl, { skipCache: true });
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [bbl, fetchComplianceData]);

  /**
   * Clear cache for a specific BBL or all cache
   */
  const clearCache = useCallback((targetBbl?: string) => {
    if (targetBbl) {
      complianceCache.delete(targetBbl.trim());
    } else {
      complianceCache.clear();
    }
  }, []);

  // Load data on mount if BBL is provided
  useEffect(() => {
    if (bbl) {
      loadComplianceData(bbl);
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [bbl, loadComplianceData]);

  return {
    ...state,
    refresh,
    clearCache,
    loadComplianceData,
    fetchComplianceData,
  };
}

/**
 * Hook for searching buildings by address
 */
export function useBuildingSearch() {
  const [state, setState] = useState<{
    bbl: string | null;
    loading: boolean;
    error: string | null;
  }>({
    bbl: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (address: string, borough?: string) => {
    if (!address.trim()) {
      setState({ bbl: null, loading: false, error: 'Address is required' });
      return null;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({ bbl: null, loading: true, error: null });

    try {
      const result = await searchBuildingByAddress(address, borough);
      
      if (abortControllerRef.current.signal.aborted) {
        throw new Error('Search cancelled');
      }

      if (!result.success) {
        throw new Error(result.error.message || 'Search failed');
      }

      if (result.data) {
        setState({ bbl: result.data, loading: false, error: null });
        return result.data;
      } else {
        setState({ bbl: null, loading: false, error: 'No building found for this address' });
        return null;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState({ bbl: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setState({ bbl: null, loading: false, error: null });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    search,
    clear,
  };
}

/**
 * Hook for checking Good Cause Eviction eligibility
 */
export function useGoodCauseEligibility() {
  const checkEligibility = useCallback((unitData: GoodCauseEligibilityInput) => {
    const result = getGoodCauseEvictionEligibility(unitData);
    return result.success ? result.data : { protected: false, reasons: [], exemptions: [] };
  }, []);

  return {
    checkEligibility,
    rentThreshold: NYCOpenDataService.GOOD_CAUSE_RENT_THRESHOLD_2025,
  };
}

/**
 * Hook for fetching individual violation types
 * Useful when you only need specific data
 */
export function useViolationQueries() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchHPDViolations = useCallback(async (bbl: string): Promise<HPDViolation[]> => {
    setLoading(prev => ({ ...prev, hpd: true }));
    setErrors(prev => ({ ...prev, hpd: '' }));
    
    try {
      const result = await getHPDViolations(bbl);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch HPD violations';
      setErrors(prev => ({ ...prev, hpd: message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, hpd: false }));
    }
  }, []);

  const fetchDOBViolations = useCallback(async (bbl: string): Promise<DOBViolation[]> => {
    setLoading(prev => ({ ...prev, dob: true }));
    setErrors(prev => ({ ...prev, dob: '' }));
    
    try {
      const result = await getBuildingCodeViolations(bbl);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch DOB violations';
      setErrors(prev => ({ ...prev, dob: message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, dob: false }));
    }
  }, []);

  const fetchRentStabilization = useCallback(async (bbl: string): Promise<RentStabilizationRecord | null> => {
    setLoading(prev => ({ ...prev, rentStab: true }));
    setErrors(prev => ({ ...prev, rentStab: '' }));
    
    try {
      const result = await checkRentStabilization(bbl);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check rent stabilization';
      setErrors(prev => ({ ...prev, rentStab: message }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, rentStab: false }));
    }
  }, []);

  const fetchBuildingInfo = useCallback(async (bbl: string): Promise<BuildingInfo | null> => {
    setLoading(prev => ({ ...prev, buildingInfo: true }));
    setErrors(prev => ({ ...prev, buildingInfo: '' }));
    
    try {
      const result = await NYCOpenDataService.getBuildingInfo(bbl);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch building info';
      setErrors(prev => ({ ...prev, buildingInfo: message }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, buildingInfo: false }));
    }
  }, []);

  return {
    loading,
    errors,
    fetchHPDViolations,
    fetchDOBViolations,
    fetchRentStabilization,
    fetchBuildingInfo,
  };
}

// Export all hooks
export default {
  useNYCCompliance,
  useBuildingSearch,
  useGoodCauseEligibility,
  useViolationQueries,
};
