// Pro tier types

export interface FinancialReport {
  id: string;
  month: number;
  year: number;
  generatedAt: string;
  status: 'draft' | 'certified' | 'finalized';
  certifiedBy?: string; // CPA name
  certificationDate?: string;
  propertyAddress?: string; // Optional property address for reports
  
  // Income
  rentalIncome: number;
  otherIncome: number;
  totalIncome: number;
  
  // Expenses
  maintenance: number;
  utilities: number;
  insurance: number;
  propertyTax: number;
  managementFees: number;
  legal: number;
  otherExpenses: number;
  totalExpenses: number;
  
  // Metrics
  netOperatingIncome: number;
  depreciation: number;
  mortgageInterest: number;
  taxableIncome: number;
  
  // Performance
  capRate: number;
  cashOnCashReturn: number;
  grossRentMultiplier: number;
  
  // Per unit breakdown
  unitPerformance: UnitPerformance[];
}

export interface UnitPerformance {
  unitId: string;
  unitNumber: string;
  tenantName: string;
  rent: number;
  daysVacant: number;
  maintenanceCosts: number;
  netIncome: number;
}

export interface MarketInsight {
  id: string;
  propertyId: string;
  generatedAt: string;
  
  // Comparable rents
  comparableRents: ComparableRent[];
  marketRangeLow: number;
  marketRangeHigh: number;
  marketMedian: number;
  
  // Current vs market
  currentRent: number;
  rentGap: number; // positive = below market, negative = above
  rentGapPercent: number;
  
  // Trends
  twelveMonthChange: number; // percent
  vacancyRate: number;
  daysOnMarket: number;
  
  // Recommendations
  suggestedRent: number;
  potentialAnnualIncrease: number;
}

export interface ComparableRent {
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  rent: number;
  distance: number; // miles
  source: 'zillow' | 'redfin' | 'apartments' | 'crexi';
}

export interface ValueRecommendation {
  id: string;
  propertyId: string;
  category: 'renovation' | 'amenity' | 'management' | 'operational';
  priority: 'high' | 'medium' | 'low';
  
  title: string;
  description: string;
  costEstimate: number;
  monthlyRentIncrease: number;
  roiMonths: number; // payback period
  annualRevenueImpact: number;
  
  // Vendor
  vendorId?: string;
  vendorName?: string;
  vendorPhone?: string;
  
  // Status
  status: 'suggested' | 'considering' | 'approved' | 'in-progress' | 'completed' | 'declined';
  createdAt: string;
}

export interface AdvisorSession {
  id: string;
  userId: string;
  scheduledAt: string;
  duration: number; // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  advisorName: string;
  meetingLink?: string;
  recordingUrl?: string;
}

export interface AdvisorMessage {
  id: string;
  userId: string;
  advisorId: string;
  content: string;
  sentAt: string;
  fromAdvisor: boolean;
  read: boolean;
}

export interface EscalationRequest {
  id: string;
  userId: string;
  unitId?: string;
  category: 'emergency' | 'legal' | 'tax' | 'insurance' | 'maintenance-review';
  description: string;
  status: 'pending' | 'in-review' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}
