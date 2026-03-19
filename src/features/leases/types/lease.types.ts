// Leases Feature Types

export type LeaseStatus = 'active' | 'expired' | 'terminating' | 'pending';

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  status: LeaseStatus;
  documents: LeaseDocument[];
  terms: LeaseTerms;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseDocument {
  id: string;
  name: string;
  url: string;
  type: 'lease_agreement' | 'addendum' | 'inspection' | 'other';
  uploadedAt: string;
}

export interface LeaseTerms {
  leaseTerm: number; // in months
  petPolicy: 'allowed' | 'not_allowed' | 'case_by_case';
  smokingPolicy: 'allowed' | 'not_allowed';
  utilitiesIncluded: string[];
  lateFeeAmount: number;
  lateFeeGracePeriod: number; // in days
  renewalTerms?: string;
}

export interface LeaseFormData {
  unitId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  terms: Partial<LeaseTerms>;
}

export interface LeaseStats {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  averageRent: number;
  totalMonthlyRent: number;
}
