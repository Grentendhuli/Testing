import { useState, useEffect, useCallback } from 'react';
import { leaseService } from '../services/leaseService';
import type { Lease, LeaseFormData, LeaseStats } from '../types/lease.types';

interface UseLeasesReturn {
  leases: Lease[];
  leaseStats: LeaseStats | null;
  isLoading: boolean;
  error: string | null;
  refreshLeases: () => Promise<void>;
  createLease: (data: LeaseFormData) => Promise<Lease | null>;
  updateLease: (leaseId: string, updates: Partial<Lease>) => Promise<boolean>;
  deleteLease: (leaseId: string) => Promise<boolean>;
  terminateLease: (leaseId: string, reason: string) => Promise<boolean>;
  renewLease: (leaseId: string, extensionMonths: number) => Promise<boolean>;
  getLeasesByUnit: (unitId: string) => Promise<Lease[]>;
  getExpiringLeases: (days: number) => Promise<Lease[]>;
}

export function useLeases(userId: string | undefined): UseLeasesReturn {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [leaseStats, setLeaseStats] = useState<LeaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeases = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [leasesResult, statsResult] = await Promise.all([
        leaseService.getLeases(userId),
        leaseService.getLeaseStats(userId),
      ]);

      if (leasesResult.success) {
        setLeases(leasesResult.data);
      } else {
        setError(leasesResult.error?.message || 'Failed to fetch leases');
      }

      if (statsResult.success) {
        setLeaseStats(statsResult.data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Leases fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  const createLease = useCallback(async (data: LeaseFormData): Promise<Lease | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const result = await leaseService.createLease(userId, data);
      if (result.success) {
        await fetchLeases();
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to create lease');
        return null;
      }
    } catch (err) {
      setError('Failed to create lease');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchLeases]);

  const updateLease = useCallback(async (leaseId: string, updates: Partial<Lease>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await leaseService.updateLease(leaseId, updates);
      if (result.success) {
        await fetchLeases();
        return true;
      } else {
        setError(result.error?.message || 'Failed to update lease');
        return false;
      }
    } catch (err) {
      setError('Failed to update lease');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeases]);

  const deleteLease = useCallback(async (leaseId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await leaseService.deleteLease(leaseId);
      if (result.success) {
        await fetchLeases();
        return true;
      } else {
        setError(result.error?.message || 'Failed to delete lease');
        return false;
      }
    } catch (err) {
      setError('Failed to delete lease');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeases]);

  const terminateLease = useCallback(async (leaseId: string, reason: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await leaseService.terminateLease(leaseId, reason);
      if (result.success) {
        await fetchLeases();
        return true;
      } else {
        setError(result.error?.message || 'Failed to terminate lease');
        return false;
      }
    } catch (err) {
      setError('Failed to terminate lease');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeases]);

  const renewLease = useCallback(async (leaseId: string, extensionMonths: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await leaseService.renewLease(leaseId, extensionMonths);
      if (result.success) {
        await fetchLeases();
        return true;
      } else {
        setError(result.error?.message || 'Failed to renew lease');
        return false;
      }
    } catch (err) {
      setError('Failed to renew lease');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeases]);

  const getLeasesByUnit = useCallback(async (unitId: string): Promise<Lease[]> => {
    try {
      const result = await leaseService.getLeasesByUnit(unitId);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching unit leases:', err);
      return [];
    }
  }, []);

  const getExpiringLeases = useCallback(async (days: number): Promise<Lease[]> => {
    if (!userId) return [];
    
    try {
      const result = await leaseService.getExpiringLeases(userId, days);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching expiring leases:', err);
      return [];
    }
  }, [userId]);

  return {
    leases,
    leaseStats,
    isLoading,
    error,
    refreshLeases: fetchLeases,
    createLease,
    updateLease,
    deleteLease,
    terminateLease,
    renewLease,
    getLeasesByUnit,
    getExpiringLeases,
  };
}
