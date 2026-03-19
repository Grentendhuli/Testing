import type { UnitStatus, Tenant, LeaseType } from '@/types';

export interface UnitFormData {
  address: string;
  unitNumber: string;
  status: UnitStatus;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  notes: string;
  includeLease?: boolean;
  leaseType?: LeaseType;
  leaseStart?: string;
  leaseEnd?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  securityDeposit?: number;
}

export interface FormErrors {
  address?: string;
  unitNumber?: string;
  bedrooms?: string;
  bathrooms?: string;
  rentAmount?: string;
  leaseType?: string;
  leaseStart?: string;
  leaseEnd?: string;
  tenantName?: string;
}

export interface HealthBreakdown {
  score: number;
  payment: { score: number; label: string };
  maintenance: { score: number; label: string };
  lease: { score: number; label: string };
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}

export type SortOption = 'rent' | 'status' | 'number';
export type StatusFilter = UnitStatus | 'all';

export { type UnitStatus, type Tenant } from '@/types';
export type { Unit } from '@/types';
