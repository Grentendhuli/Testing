// NYC Compliance Types
export interface NYCTenantRights {
  unitId: string;
  unitNumber: string;
  tenantName: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  
  // FARE Act Compliance
  fareActDisclosure: {
    disclosedAt: string;
    backgroundCheckPolicy: 'none' | 'case-by-case' | 'prohibited';
    housingVoucherAccepted: boolean;
    voucherProgramTypes: string[];
  };
  
  // Good Cause Eviction Protection
  goodCauseProtected: boolean;
  exemptFromGoodCause: GoodCauseExemption[];
  
  // Security Deposit (NYC = max 1 month)
  securityDeposit: {
    amount: number;
    collectedAt: string;
    heldIn: 'landlord-account' | 'separate-interest-bearing';
    interestRate?: number;
  };
  
  // Late Fees (NYC = max $50 or 5% of rent, 5-day grace)
  lateFeeStructure: {
    flatFee?: number; // max $50
    percentageFee?: number; // max 5%
    gracePeriodDays: number; // min 5 days
  };
  
  // Lead Paint Disclosure (for pre-1978 buildings)
  leadPaintDisclosure: {
    buildingBuiltBefore1978: boolean;
    disclosureGiven: boolean;
    givenAt: string;
    knownLeadHazards: string;
    inspectionHistory: string;
  };
  
  // Rent Regulation
  rentRegulated: boolean;
  regulatedType?: 'rent-control' | 'rent-stabilization' | 'none';
  mciApplied?: boolean;
  iaiApplied?: boolean;
}

type GoodCauseExemption = 
  | 'owner-occupied-under-10-units'
  | 'subsidized-housing'
  | 'coop-condo'
  | 'new-construction-post-2009'
  | 'temporary-short-term'
  | 'commercial';

export interface NYCComplianceChecklist {
  propertyId: string;
  
  // Fair Housing
  fareActPosted: boolean;
  fairHousingPosted: boolean;
  nonDiscriminationPolicyDocumented: boolean;
  
  // Tenant Rights
  tenantRightsNoticePosted: boolean;
  tenantRightsNoticeGiven: boolean;
  
  // Financial
  securityDepositWithinLimit: boolean; // <= 1 month
  lateFeeWithinLimit: boolean; // <= $50 or 5%
  gracePeriodMinimum: boolean; // >= 5 days
  
  // Maintenance
  hpdViolationsResolved: boolean;
  leadPaintInspectionCurrent: boolean;
  windowGuardCompliance: boolean;
  heatHotWaterCompliance: boolean;
  
  // Documentation
  leasesNYCCompliant: boolean;
  ridersAttached: boolean; // Legal Occupancy, Window Guards, etc.
}

export interface NYCNoticeTemplate {
  id: string;
  name: string;
  type: 'fare-act' | 'good-cause' | 'rent-increase' | 'lease-renewal' | 'termination' | 'nonpayment';
  content: string;
  requiredByLaw: boolean;
  nycrrReference: string; // NYC Administrative Code reference
  lastUpdated: string;
}

export const DEFAULT_NYC_LATE_FEE_CONFIG = {
  flatFee: 50, // NYC max: $50
  percentageFee: 5, // NYC max: 5%
  gracePeriodDays: 5, // NYC minimum: 5 days
  maxLateFee: 50, // Explicit cap
};

export const DEFAULT_NYC_SECURITY_DEPOSIT_LIMIT = 1; // 1 month rent max

export const FARE_ACT_REQUIRED_LANGUAGE = `
  NOTICE: A landlord, owner, managing agent, superintendent, or any other person 
  acting on behalf of a landlord may not require that a housing applicant disclose 
  whether that applicant or any person residing in or intending to reside in the 
  housing unit has a criminal conviction or arrest record. A housing provider may 
  not deny housing based on an arrest record or criminal conviction. This prohibition 
  does not apply where a tenant intends to reside in the same unit as the owner, or 
  where a Federal or State law requires consideration of criminal history.
`;

export const GOOD_CAUSE_PROTECTED_MESSAGE = `
  Your tenancy is protected under the Good Cause Eviction Law. A landlord may not 
  refuse to renew your lease or evict you except for specific reasons allowed by law, 
  including nonpayment of rent, violating lease terms, creating a nuisance, or using 
  the unit for an illegal purpose. Rent increases are limited to specific caps unless 
  specific exceptions apply.
`;
