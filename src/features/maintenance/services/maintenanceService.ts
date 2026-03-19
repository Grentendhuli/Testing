import { supabase } from '@/lib/supabase';
import { Result, createError } from '@/types/result';
import { sanitizeText, sanitizeRichText } from '@/lib/sanitize';
import type { Database } from '@/lib/database.types';
import type { 
  MaintenanceRequest, 
  MaintenanceFormData, 
  MaintenanceStats,
  MaintenanceStatus,
  MaintenancePriority 
} from '../types/maintenance.types';

// Type helpers for database tables
type MaintenanceRow = Database['public']['Tables']['maintenance_requests']['Row'];

const MAINTENANCE_TABLE = 'maintenance_requests';

export interface MaintenanceService {
  getRequests(userId: string): Promise<Result<MaintenanceRequest[]>>;
  getRequestById(requestId: string): Promise<Result<MaintenanceRequest>>;
  getRequestsByUnit(unitId: string): Promise<Result<MaintenanceRequest[]>>;
  createRequest(userId: string, data: MaintenanceFormData): Promise<Result<MaintenanceRequest>>;
  updateRequest(requestId: string, updates: Partial<MaintenanceRequest>): Promise<Result<void>>;
  deleteRequest(requestId: string): Promise<Result<void>>;
  updateStatus(requestId: string, status: MaintenanceStatus): Promise<Result<void>>;
  updatePriority(requestId: string, priority: MaintenancePriority): Promise<Result<void>>;
  getMaintenanceStats(userId: string): Promise<Result<MaintenanceStats>>;
  getUrgentRequests(userId: string): Promise<Result<MaintenanceRequest[]>>;
}

function mapDatabaseToRequest(data: any): MaintenanceRequest {
  return {
    id: data.id,
    unitId: data.unit_id,
    tenantId: data.tenant_id,
    title: data.title,
    description: data.description,
    status: data.status as MaintenanceStatus,
    priority: data.priority as MaintenancePriority,
    category: data.category || 'general',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
    estimatedCost: data.estimated_cost,
    actualCost: data.actual_cost,
    assignedTo: data.assigned_to,
    photos: data.photos || [],
    notes: data.notes || '',
  };
}

export const maintenanceService: MaintenanceService = {
  async getRequests(userId: string) {
    try {
      const { data, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests = (data || []).map(mapDatabaseToRequest);
      return Result.ok(requests);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      return Result.err(createError('MAINTENANCE_FETCH_ERROR', 'Failed to fetch maintenance requests'));
    }
  },

  async getRequestById(requestId: string) {
    try {
      const { data, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;

      return Result.ok(mapDatabaseToRequest(data));
    } catch (error) {
      console.error('Error fetching maintenance request:', error);
      return Result.err(createError('MAINTENANCE_FETCH_ERROR', 'Failed to fetch maintenance request'));
    }
  },

  async getRequestsByUnit(unitId: string) {
    try {
      const { data, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests = (data || []).map(mapDatabaseToRequest);
      return Result.ok(requests);
    } catch (error) {
      console.error('Error fetching unit maintenance requests:', error);
      return Result.err(createError('UNIT_MAINTENANCE_FETCH_ERROR', 'Failed to fetch unit maintenance requests'));
    }
  },

  async createRequest(userId: string, data: MaintenanceFormData) {
    try {
      // Sanitize user inputs before storage
      const sanitizedData = {
        user_id: userId,
        unit_id: data.unitId,
        title: sanitizeText(data.title),
        description: sanitizeRichText(data.description),
        priority: data.priority,
        category: data.category,
        status: 'open',
        photos: data.photos || [],
        notes: sanitizeRichText(data.notes),
      };

      const { data: request, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .insert(sanitizedData as any)
        .select()
        .single();

      if (error) throw error;

      return Result.ok(mapDatabaseToRequest(request as MaintenanceRow));
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      return Result.err(createError('MAINTENANCE_CREATE_ERROR', 'Failed to create maintenance request'));
    }
  },

  async updateRequest(requestId: string, updates: Partial<MaintenanceRequest>) {
    try {
      const dbUpdates: any = {};
      
      if (updates.title) dbUpdates.title = sanitizeText(updates.title);
      if (updates.description) dbUpdates.description = sanitizeRichText(updates.description);
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.estimatedCost) dbUpdates.estimated_cost = updates.estimatedCost;
      if (updates.actualCost) dbUpdates.actual_cost = updates.actualCost;
      if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo;
      if (updates.photos) dbUpdates.photos = updates.photos;
      if (updates.notes !== undefined) dbUpdates.notes = sanitizeRichText(updates.notes);
      
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await (supabase
        .from(MAINTENANCE_TABLE) as any)
        .update(dbUpdates)
        .eq('id', requestId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      return Result.err(createError('MAINTENANCE_UPDATE_ERROR', 'Failed to update maintenance request'));
    }
  },

  async deleteRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from(MAINTENANCE_TABLE)
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      return Result.err(createError('MAINTENANCE_DELETE_ERROR', 'Failed to delete maintenance request'));
    }
  },

  async updateStatus(requestId: string, status: MaintenanceStatus) {
    try {
      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from(MAINTENANCE_TABLE) as any)
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      return Result.err(createError('STATUS_UPDATE_ERROR', 'Failed to update status'));
    }
  },

  async updatePriority(requestId: string, priority: MaintenancePriority) {
    try {
      const { error } = await (supabase
        .from(MAINTENANCE_TABLE) as any)
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error updating maintenance priority:', error);
      return Result.err(createError('PRIORITY_UPDATE_ERROR', 'Failed to update priority'));
    }
  },

  async getMaintenanceStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .select('status, priority, actual_cost, created_at, completed_at')
        .eq('user_id', userId);

      if (error) throw error;

      const requests = (data || []) as MaintenanceRow[];
      
      const totalOpen = requests.filter(r => r.status === 'open').length;
      const totalInProgress = requests.filter(r => r.status === 'in_progress').length;
      const totalCompleted = requests.filter(r => r.status === 'completed').length;
      const urgentCount = requests.filter(r => r.priority === 'urgent' && r.status !== 'completed' && r.status !== 'closed').length;
      
      const totalCost = requests.reduce((sum, r) => sum + (r.actual_cost || 0), 0);
      
      // Calculate average resolution time for completed requests
      const completedRequests = requests.filter(r => r.status === 'completed' && r.completed_at);
      let totalResolutionTime = 0;
      
      completedRequests.forEach(r => {
        const created = new Date(r.created_at);
        const completed = r.completed_at ? new Date(r.completed_at) : created;
        totalResolutionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      });
      
      const averageResolutionTime = completedRequests.length > 0 
        ? totalResolutionTime / completedRequests.length 
        : 0;

      const stats: MaintenanceStats = {
        totalOpen,
        totalInProgress,
        totalCompleted,
        urgentCount,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        totalCost,
      };

      return Result.ok(stats);
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      return Result.err(createError('MAINTENANCE_STATS_ERROR', 'Failed to fetch maintenance statistics'));
    }
  },

  async getUrgentRequests(userId: string) {
    try {
      const { data, error } = await supabase
        .from(MAINTENANCE_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('priority', 'urgent')
        .not('status', 'in', '(completed,closed)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests = (data || []).map(mapDatabaseToRequest);
      return Result.ok(requests);
    } catch (error) {
      console.error('Error fetching urgent requests:', error);
      return Result.err(createError('URGENT_REQUESTS_ERROR', 'Failed to fetch urgent requests'));
    }
  }
};

export { maintenanceService as default };
