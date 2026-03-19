import type {
  User,
  Message,
  BotStatus,
  BotConfig,
  Invoice,
  DailyStats,
  MonthlySummary,
  Unit,
  Lead,
  Lease,
  Payment,
  MaintenanceRequest,
} from '../types';

// All mock data disabled for production – real data comes from Supabase.

export const mockUser: User | null = null;

export const mockUnits: Unit[] = [];

export const mockLeads: Lead[] = [];

export const mockMessages: Message[] = [];

export const mockBotStatus: BotStatus | null = null;

export const mockBotConfig: BotConfig | null = null;

export const mockInvoices: Invoice[] = [];

export const mockDailyStats: DailyStats | null = null;

export const mockMonthlySummary: MonthlySummary | null = null;

export const mockLeases: Lease[] = [];

export const mockPayments: Payment[] = [];

export const mockMaintenanceRequests: MaintenanceRequest[] = [];

