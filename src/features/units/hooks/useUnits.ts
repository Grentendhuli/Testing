import { useState, useMemo, useCallback } from 'react';
import type { 
  Unit, 
  UnitFormData, 
  FormErrors, 
  HealthBreakdown, 
  SortOption, 
  StatusFilter 
} from '../types/unit.types';
import type { Payment, MaintenanceRequest, Lease } from '@/types';

const initialUnitForm: UnitFormData = {
  address: '',
  unitNumber: '',
  status: 'vacant',
  bedrooms: 1,
  bathrooms: 1,
  squareFeet: 0,
  rentAmount: 0,
  notes: '',
  includeLease: false,
  leaseType: 'free-market',
  leaseStart: '',
  leaseEnd: '',
  tenantName: '',
  tenantEmail: '',
  tenantPhone: '',
  securityDeposit: 0,
};

interface UseUnitsProps {
  units: Unit[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  leases: Lease[];
}

interface UseUnitsReturn {
  // State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  
  // Form state
  newUnit: UnitFormData;
  setNewUnit: React.Dispatch<React.SetStateAction<UnitFormData>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  createError: string | null;
  setCreateError: (error: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  
  // Computed
  filteredUnits: Unit[];
  occupiedCount: number;
  vacantCount: number;
  maintenanceCount: number;
  
  // Actions
  calculateUnitHealth: (unit: Unit) => HealthBreakdown;
  validateForm: (unitData: UnitFormData) => { isValid: boolean; errors: FormErrors };
  resetForm: () => void;
  initialUnitForm: UnitFormData;
}

export function useUnits({
  units,
  payments,
  maintenanceRequests,
  leases,
}: UseUnitsProps): UseUnitsReturn {
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('number');
  
  // Form state
  const [newUnit, setNewUnit] = useState<UnitFormData>(initialUnitForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Counts
  const occupiedCount = units.filter(u => u.status === 'occupied').length;
  const vacantCount = units.filter(u => u.status === 'vacant').length;
  const maintenanceCount = units.filter(u => u.status === 'maintenance').length;

  // Filter and sort units
  const filteredUnits = useMemo(() => {
    let result = [...units];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.unitNumber.toLowerCase().includes(query) ||
        u.address?.toLowerCase().includes(query) ||
        u.tenant?.name?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rent':
          return (b.rentAmount || 0) - (a.rentAmount || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'number':
        default:
          return a.unitNumber.localeCompare(b.unitNumber);
      }
    });
    
    return result;
  }, [units, searchQuery, statusFilter, sortBy]);

  // Calculate health score for a unit
  const calculateUnitHealth = useCallback((unit: Unit): HealthBreakdown => {
    const now = new Date();
    
    // Payment Status (40%)
    const unitPayments = payments.filter(p => p.unitId === unit.id);
    const latestPayment = unitPayments.sort((a, b) => 
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    )[0];
    
    let paymentScore = 100;
    let paymentLabel = 'On-time';
    if (latestPayment) {
      if (latestPayment.status === 'late' || latestPayment.status === 'failed') {
        paymentScore = 30;
        paymentLabel = 'Delinquent';
      } else if (latestPayment.status === 'pending') {
        paymentScore = 60;
        paymentLabel = 'Late';
      }
    }
    
    // Maintenance Status (30%)
    const unitMaint = maintenanceRequests.filter(m => m.unitId === unit.id);
    const openRequests = unitMaint.filter(m => m.status === 'open' || m.status === 'in_progress');
    const urgentRequests = unitMaint.filter(m => 
      (m.status === 'open' || m.status === 'in_progress') && m.priority === 'urgent'
    );
    
    let maintenanceScore = 100;
    let maintenanceLabel = 'No open requests';
    if (urgentRequests.length > 0) {
      maintenanceScore = 40;
      maintenanceLabel = `${urgentRequests.length} Urgent`;
    } else if (openRequests.length > 0) {
      maintenanceScore = 70;
      maintenanceLabel = `${openRequests.length} Open`;
    }
    
    // Lease Days Remaining (30%)
    const unitLease = leases.find(l => l.unitId === unit.id);
    let leaseScore = 100;
    let leaseLabel = 'No lease';
    
    if (unitLease?.endDate) {
      const leaseEnd = new Date(unitLease.endDate);
      const daysRemaining = Math.ceil((leaseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) {
        leaseScore = 0;
        leaseLabel = 'Expired';
      } else if (daysRemaining < 30) {
        leaseScore = 50;
        leaseLabel = `${daysRemaining} days left`;
      } else if (daysRemaining <= 90) {
        leaseScore = 70;
        leaseLabel = `${daysRemaining} days left`;
      } else {
        leaseScore = 100;
        leaseLabel = `${Math.floor(daysRemaining / 30)} months left`;
      }
    }
    
    const totalScore = Math.round(
      paymentScore * 0.4 + maintenanceScore * 0.3 + leaseScore * 0.3
    );
    
    return {
      score: totalScore,
      payment: { score: paymentScore, label: paymentLabel },
      maintenance: { score: maintenanceScore, label: maintenanceLabel },
      lease: { score: leaseScore, label: leaseLabel },
    };
  }, [payments, maintenanceRequests, leases]);

  // Validate form
  const validateForm = useCallback((unitData: UnitFormData): { isValid: boolean; errors: FormErrors } => {
    const errors: FormErrors = {};

    // Check for undefined/null
    const data = unitData || {};

    if (!data.address || String(data.address).trim() === '') {
      errors.address = 'Property address is required';
    }

    if (!data.unitNumber || String(data.unitNumber).trim() === '') {
      errors.unitNumber = 'Unit number is required';
    }

    // Validate bedrooms - must be a non-negative number
    const bedrooms = Number(data.bedrooms);
    if (isNaN(bedrooms) || bedrooms < 0) {
      errors.bedrooms = 'Bedrooms is required';
    }

    // Validate bathrooms - must be a non-negative number
    const bathrooms = Number(data.bathrooms);
    if (isNaN(bathrooms) || bathrooms < 0) {
      errors.bathrooms = 'Bathrooms is required';
    }

    // Validate rent amount - must be a positive number
    const rentAmount = Number(data.rentAmount);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      errors.rentAmount = 'Rent amount must be greater than 0';
    }

    // Validate lease fields only if includeLease is true
    if (data.includeLease) {
      if (!data.tenantName || String(data.tenantName).trim() === '') {
        errors.tenantName = 'Tenant name is required when adding a lease';
      }
      if (!data.leaseStart || String(data.leaseStart).trim() === '') {
        errors.leaseStart = 'Lease start date is required';
      }
      if (!data.leaseEnd || String(data.leaseEnd).trim() === '') {
        errors.leaseEnd = 'Lease end date is required';
      }
      if (!data.leaseType) {
        errors.leaseType = 'Select a lease type';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setNewUnit(initialUnitForm);
    setFormErrors({});
    setCreateError(null);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    
    // Form state
    newUnit,
    setNewUnit,
    formErrors,
    setFormErrors,
    createError,
    setCreateError,
    isSubmitting,
    setIsSubmitting,
    
    // Computed
    filteredUnits,
    occupiedCount,
    vacantCount,
    maintenanceCount,
    
    // Actions
    calculateUnitHealth,
    validateForm,
    resetForm,
    initialUnitForm,
  };
}
