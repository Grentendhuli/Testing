import { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../services/maintenanceService';
import type { 
  MaintenanceRequest, 
  MaintenanceFormData, 
  MaintenanceStats,
  MaintenanceStatus,
  MaintenancePriority 
} from '../types/maintenance.types';

interface UseMaintenanceReturn {
  requests: MaintenanceRequest[];
  maintenanceStats: MaintenanceStats | null;
  isLoading: boolean;
  error: string | null;
  refreshRequests: () => Promise<void>;
  createRequest: (data: MaintenanceFormData) => Promise<MaintenanceRequest | null>;
  updateRequest: (requestId: string, updates: Partial<MaintenanceRequest>) => Promise<boolean>;
  deleteRequest: (requestId: string) => Promise<boolean>;
  updateStatus: (requestId: string, status: MaintenanceStatus) => Promise<boolean>;
  updatePriority: (requestId: string, priority: MaintenancePriority) => Promise<boolean>;
  getUrgentRequests: () => Promise<MaintenanceRequest[]>;
}

export function useMaintenance(userId: string | undefined): UseMaintenanceReturn {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [requestsResult, statsResult] = await Promise.all([
        maintenanceService.getRequests(userId),
        maintenanceService.getMaintenanceStats(userId),
      ]);

      if (requestsResult.success) {
        setRequests(requestsResult.data);
      } else {
        setError(requestsResult.error?.message || 'Failed to fetch maintenance requests');
      }

      if (statsResult.success) {
        setMaintenanceStats(statsResult.data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Maintenance fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = useCallback(async (data: MaintenanceFormData): Promise<MaintenanceRequest | null> => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const result = await maintenanceService.createRequest(userId, data);
      if (result.success) {
        await fetchRequests();
        return result.data;
      } else {
        setError(result.error?.message || 'Failed to create request');
        return null;
      }
    } catch (err) {
      setError('Failed to create request');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchRequests]);

  const updateRequest = useCallback(async (requestId: string, updates: Partial<MaintenanceRequest>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await maintenanceService.updateRequest(requestId, updates);
      if (result.success) {
        await fetchRequests();
        return true;
      } else {
        setError(result.error?.message || 'Failed to update request');
        return false;
      }
    } catch (err) {
      setError('Failed to update request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRequests]);

  const deleteRequest = useCallback(async (requestId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await maintenanceService.deleteRequest(requestId);
      if (result.success) {
        await fetchRequests();
        return true;
      } else {
        setError(result.error?.message || 'Failed to delete request');
        return false;
      }
    } catch (err) {
      setError('Failed to delete request');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRequests]);

  const updateStatus = useCallback(async (requestId: string, status: MaintenanceStatus): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await maintenanceService.updateStatus(requestId, status);
      if (result.success) {
        await fetchRequests();
        return true;
      } else {
        setError(result.error?.message || 'Failed to update status');
        return false;
      }
    } catch (err) {
      setError('Failed to update status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRequests]);

  const updatePriority = useCallback(async (requestId: string, priority: MaintenancePriority): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await maintenanceService.updatePriority(requestId, priority);
      if (result.success) {
        await fetchRequests();
        return true;
      } else {
        setError(result.error?.message || 'Failed to update priority');
        return false;
      }
    } catch (err) {
      setError('Failed to update priority');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRequests]);

  const getUrgentRequests = useCallback(async (): Promise<MaintenanceRequest[]> => {
    if (!userId) return [];
    
    try {
      const result = await maintenanceService.getUrgentRequests(userId);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching urgent requests:', err);
      return [];
    }
  }, [userId]);

  return {
    requests,
    maintenanceStats,
    isLoading,
    error,
    refreshRequests: fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    updateStatus,
    updatePriority,
    getUrgentRequests,
  };
}
