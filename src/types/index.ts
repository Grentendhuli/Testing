// Types for NYC Landlord SaaS Dashboard

export type MessageType = 'inquiry' | 'lead' | 'emergency' | 'maintenance';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';
// Simplified: only 'free' and 'concierge' tiers
export type SubscriptionTier = 'free' | 'concierge';
export type ResponseTone = 'professional' | 'friendly' | 'warm';
export type UnitStatus = 'occupied' | 'vacant' | 'maintenance';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'showing' | 'scheduled' | 'closed' | 'converted';
export type LeaseStatus = 'active' | 'expiring' | 'expired' | 'renewed' | 'terminated' | 'pending';
export type LeaseType = 'fixed-term' | 'month-to-month' | 'rent-stabilized' | 'free-market' | 'renewal' | 'sublease';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'online' | 'zelle' | 'venmo' | 'other';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'late' | 'overdue' | 'cancelled';
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent' | 'emergency' | 'routine';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  propertyAddress: string;
  botPhoneNumber: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes (50MB for free = 52428800)
  maxUnits: number; // -1 = unlimited (free tier)
  unitsCount?: number; // Optional: current count of units
  trialStartDate?: string; // Optional: trial start date
  trialDaysRemaining?: number; // Optional: days remaining in trial
  createdAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  moveInDate: string;
  leaseEndDate: string;
  rentAmount: number;
}

export interface Unit {
  id: string;
  address?: string;
  unitNumber: string;
  status: UnitStatus;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  monthlyRent?: number; // Alias for rentAmount for backward compatibility
  tenant?: Tenant;
  lastMaintenanceDate?: string;
  notes: string;
  // Legacy fields for backward compatibility
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  leaseStart?: string;
  leaseEnd?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  inquiryDate: string;
  moveInPreference?: string;
  moveInDate?: string;
  budget?: number;
  status: LeadStatus;
  source?: string;
  notes?: string;
  messages?: number;
  bedrooms?: number;
  bathrooms?: number;
  createdAt?: string;
}

export interface Message {
  id: string;
  tenantMessage: string;
  botResponse: string;
  timestamp: string;
  type: MessageType;
  escalated: boolean;
  landlordResponded?: boolean;
  tenantPhone?: string;
}

export interface BotStatus {
  isRunning: boolean;
  lastActivityTime: string;
  messagesThisMonth: number;
  messagesThisWeek: number;
  leadsQualified: number;
  maintenanceLogged: number;
  timeSavedHours: number;
  uptimePercentage: number;
}

export interface LateFeeConfig {
  enabled: boolean;
  gracePeriodDays: number;
  flatFee?: number;
  percentageFee?: number;
  maxLateFee?: number;
}

export interface BotConfig {
  businessHours: {
    start: string;
    end: string;
  };
  afterHoursCollect: boolean;
  escalationKeywords: string[];
  tone: ResponseTone;
  propertyRules: {
    petPolicy: string;
    parking: string;
    amenities: string;
  };
  autoEscalateEmergency: boolean;
  lateFeeConfig?: LateFeeConfig;
}

export interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
  pdfUrl?: string;
}

export interface Subscription {
  plan: string;
  price: number;
  nextChargeDate: string;
  status: SubscriptionStatus;
}

export interface DailyStats {
  messagesHandled: number;
  tenantInquiries: number;
  leadsQualified: number;
  timeSavedMinutes: number;
}

export interface MonthlySummary {
  messagesHandled: number;
  messagesTotal: number;
  leadsQualified: number;
  maintenanceLogged: number;
  timeSavedHours: number;
}

export interface Payment {
  id: string;
  unitId: string;
  unitNumber?: string;
  tenantId?: string;
  tenantName?: string;
  amount: number;
  paymentDate?: string;
  dueDate: string;
  paidDate?: string; // When the payment was actually paid
  method?: PaymentMethod;
  status: PaymentStatus;
  lateFee?: number; // Late fee amount if applicable
  notes?: string;
  createdAt: string;
}

export interface Lease {
  id: string;
  unitId: string;
  unitNumber: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  petDeposit?: number;
  leaseType: LeaseType;
  status: LeaseStatus;
  renewalNoticeSent?: string;
  notes: string;
  terminationReason?: string;
  terminatedDate?: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  unitNumber?: string;
  tenantId?: string;
  tenantName?: string;
  tenantPhone?: string;
  title: string; // Short title for the request
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  photos?: string[]; // base64 or URL
  category?: string;
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  vendorId?: string;
  costEstimate?: number;
  actualCost?: number;
  notes?: string;
}

// Concierge Tier features (formerly Pro/Elite)
export interface FinancialReport {
  id: string;
  year: number;
  month: number;
  propertyAddress: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashOnCashReturn: number;
  capRate: number;
  marketValue: number;
  recommendations: string[];
  cpaReviewed: boolean;
  cpaName?: string;
  cpaLicense?: string;
  generatedAt: string;
}

export * from './pro';
export * from './nyc-compliance';

// New type system exports
export * from './result';
export * from './api';
