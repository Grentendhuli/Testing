// Maintenance Feature Types

export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'closed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId?: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: string;
  photos: string[];
  notes: string;
}

export interface MaintenanceFormData {
  title: string;
  description: string;
  priority: MaintenancePriority;
  category: string;
  unitId: string;
  photos?: string[];
  notes?: string;
}

export interface MaintenanceCategory {
  id: string;
  name: string;
  icon: string;
  defaultPriority: MaintenancePriority;
}

export interface MaintenanceStats {
  totalOpen: number;
  totalInProgress: number;
  totalCompleted: number;
  urgentCount: number;
  averageResolutionTime: number;
  totalCost: number;
}
