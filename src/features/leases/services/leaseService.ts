import { supabase } from '@/lib/supabase';
import { Result, createError } from '@/types/result';
import { sanitizeText, sanitizeEmail, sanitizePhone } from '@/lib/sanitize';
import type { Database } from '@/lib/database.types';
import type { Lease, LeaseFormData, LeaseStats, LeaseStatus, LeaseDocument, LeaseTerms } from '../types/lease.types';

// Type helpers for database tables
type LeasesRow = Database['public']['Tables']['leases']['Row'];
type UnitsRow = Database['public']['Tables']['units']['Row'];

const LEASES_TABLE = 'leases';

export interface LeaseService {
  getLeases(userId: string): Promise<Result<Lease[]>>;
  getLeaseById(leaseId: string): Promise<Result<Lease>>;
  getLeasesByUnit(unitId: string): Promise<Result<Lease[]>>;
  createLease(userId: string, data: LeaseFormData): Promise<Result<Lease>>;
  updateLease(leaseId: string, updates: Partial<Lease>): Promise<Result<void>>;
  deleteLease(leaseId: string): Promise<Result<void>>;
  terminateLease(leaseId: string, reason: string): Promise<Result<void>>;
  renewLease(leaseId: string, extensionMonths: number): Promise<Result<void>>;
  getLeaseStats(userId: string): Promise<Result<LeaseStats>>;
  getExpiringLeases(userId: string, days: number): Promise<Result<Lease[]>>;
}

function mapDatabaseToLease(data: LeasesRow): Lease {
  return {
    id: data.id,
    unitId: data.unit_id,
    tenantId: data.tenant_id || '',
    tenantName: data.tenant_name,
    tenantEmail: data.tenant_email || '',
    tenantPhone: data.tenant_phone || '',
    startDate: data.start_date,
    endDate: data.end_date,
    rentAmount: data.rent_amount,
    securityDeposit: data.security_deposit || 0,
    status: data.status as LeaseStatus,
    documents: (data.documents || []) as LeaseDocument[],
    terms: (data.terms || {
      leaseTerm: 12,
      petPolicy: 'case_by_case',
      smokingPolicy: 'not_allowed',
      utilitiesIncluded: [],
      lateFeeAmount: 50,
      lateFeeGracePeriod: 5,
    }) as LeaseTerms,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const leaseService: LeaseService = {
  async getLeases(userId: string) {
    try {
      const { data, error } = await supabase
        .from(LEASES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leases = (data || []).map(mapDatabaseToLease);
      return Result.ok(leases);
    } catch (error) {
      console.error('Error fetching leases:', error);
      return Result.err(createError('LEASES_FETCH_ERROR', 'Failed to fetch leases'));
    }
  },

  async getLeaseById(leaseId: string) {
    try {
      const { data, error } = await supabase
        .from(LEASES_TABLE)
        .select('*')
        .eq('id', leaseId)
        .single();

      if (error) throw error;

      return Result.ok(mapDatabaseToLease(data));
    } catch (error) {
      console.error('Error fetching lease:', error);
      return Result.err(createError('LEASE_FETCH_ERROR', 'Failed to fetch lease'));
    }
  },

  async getLeasesByUnit(unitId: string) {
    try {
      const { data, error } = await supabase
        .from(LEASES_TABLE)
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const leases = (data || []).map(mapDatabaseToLease);
      return Result.ok(leases);
    } catch (error) {
      console.error('Error fetching unit leases:', error);
      return Result.err(createError('UNIT_LEASES_FETCH_ERROR', 'Failed to fetch unit leases'));
    }
  },

  async createLease(userId: string, data: LeaseFormData) {
    try {
      // Sanitize user inputs before storage
      const sanitizedData = {
        user_id: userId,
        unit_id: data.unitId,
        tenant_name: sanitizeText(data.tenantName),
        tenant_email: sanitizeEmail(data.tenantEmail),
        tenant_phone: sanitizePhone(data.tenantPhone),
        start_date: data.startDate,
        end_date: data.endDate,
        rent_amount: data.rentAmount,
        security_deposit: data.securityDeposit,
        status: 'active',
        terms: data.terms,
      };

      const { data: lease, error } = await supabase
        .from(LEASES_TABLE)
        .insert(sanitizedData as any)
        .select()
        .single();

      if (error) throw error;

      // Update unit status to occupied
      await (supabase
        .from('units') as any)
        .update({ 
          status: 'occupied',
          tenant_name: sanitizedData.tenant_name,
          tenant_email: sanitizedData.tenant_email,
          tenant_phone: sanitizedData.tenant_phone,
          lease_start: data.startDate,
          lease_end: data.endDate,
          rent_amount: data.rentAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.unitId);

      return Result.ok(mapDatabaseToLease(lease as LeasesRow));
    } catch (error) {
      console.error('Error creating lease:', error);
      return Result.err(createError('LEASE_CREATE_ERROR', 'Failed to create lease'));
    }
  },

  async updateLease(leaseId: string, updates: Partial<Lease>) {
    try {
      const dbUpdates: Partial<LeasesRow> = {};
      
      if (updates.tenantName) dbUpdates.tenant_name = sanitizeText(updates.tenantName);
      if (updates.tenantEmail) dbUpdates.tenant_email = sanitizeEmail(updates.tenantEmail);
      if (updates.tenantPhone) dbUpdates.tenant_phone = sanitizePhone(updates.tenantPhone);
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.endDate) dbUpdates.end_date = updates.endDate;
      if (updates.rentAmount) dbUpdates.rent_amount = updates.rentAmount;
      if (updates.securityDeposit) dbUpdates.security_deposit = updates.securityDeposit;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.terms) dbUpdates.terms = updates.terms as any;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await (supabase
        .from(LEASES_TABLE) as any)
        .update(dbUpdates)
        .eq('id', leaseId);

      if (error) throw error;

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error updating lease:', error);
      return Result.err(createError('LEASE_UPDATE_ERROR', 'Failed to update lease'));
    }
  },

  async deleteLease(leaseId: string) {
    try {
      // Get lease to find unit
      const { data: lease } = await supabase
        .from(LEASES_TABLE)
        .select('unit_id')
        .eq('id', leaseId)
        .single();

      const { error } = await supabase
        .from(LEASES_TABLE)
        .delete()
        .eq('id', leaseId);

      if (error) throw error;

      // Update unit to vacant if lease deleted
      const leaseRow = lease as LeasesRow | null;
      if (leaseRow?.unit_id) {
        await (supabase
          .from('units') as any)
          .update({ 
            status: 'vacant',
            tenant_name: null,
            tenant_email: null,
            tenant_phone: null,
            lease_start: null,
            lease_end: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', leaseRow.unit_id);
      }

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error deleting lease:', error);
      return Result.err(createError('LEASE_DELETE_ERROR', 'Failed to delete lease'));
    }
  },

  async terminateLease(leaseId: string, reason: string) {
    try {
      const { data: lease, error: fetchError } = await supabase
        .from(LEASES_TABLE)
        .select('unit_id')
        .eq('id', leaseId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await (supabase
        .from(LEASES_TABLE) as any)
        .update({ 
          status: 'terminating',
          termination_reason: reason,
          termination_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId);

      if (error) throw error;

      // Update unit status
      if ((lease as LeasesRow)?.unit_id) {
        await (supabase
          .from('units') as any)
          .update({ 
            status: 'terminating',
            updated_at: new Date().toISOString()
          })
          .eq('id', (lease as LeasesRow).unit_id);
      }

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error terminating lease:', error);
      return Result.err(createError('LEASE_TERMINATE_ERROR', 'Failed to terminate lease'));
    }
  },

  async renewLease(leaseId: string, extensionMonths: number) {
    try {
      const { data: lease, error: fetchError } = await supabase
        .from(LEASES_TABLE)
        .select('*')
        .eq('id', leaseId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new end date
      const currentEndDate = new Date((lease as LeasesRow).end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + extensionMonths);

      const { error } = await (supabase
        .from(LEASES_TABLE) as any)
        .update({ 
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active',
          renewal_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseId);

      if (error) throw error;

      // Update unit lease end date
      if ((lease as LeasesRow)?.unit_id) {
        await (supabase
          .from('units') as any)
          .update({ 
            lease_end: newEndDate.toISOString().split('T')[0],
            status: 'occupied',
            updated_at: new Date().toISOString()
          })
          .eq('id', (lease as LeasesRow).unit_id);
      }

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error renewing lease:', error);
      return Result.err(createError('LEASE_RENEW_ERROR', 'Failed to renew lease'));
    }
  },

  async getLeaseStats(userId: string) {
    try {
      const { data: leases, error } = await supabase
        .from(LEASES_TABLE)
        .select('status, rent_amount, end_date')
        .eq('user_id', userId);

      if (error) throw error;

      const now = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const leaseRows = (leases || []) as LeasesRow[];
      const activeCount = leaseRows.filter(l => l.status === 'active').length || 0;
      const expiredCount = leaseRows.filter(l => l.status === 'expired').length || 0;
      
      const expiringSoonCount = leaseRows.filter(l => {
        if (l.status !== 'active') return false;
        const endDate = new Date(l.end_date);
        return endDate <= sixtyDaysFromNow && endDate >= now;
      }).length || 0;

      const activeLeases = leaseRows.filter(l => l.status === 'active') || [];
      const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + (l.rent_amount || 0), 0);
      const averageRent = activeLeases.length > 0 ? totalMonthlyRent / activeLeases.length : 0;

      const stats: LeaseStats = {
        activeCount,
        expiringSoonCount,
        expiredCount,
        averageRent,
        totalMonthlyRent,
      };

      return Result.ok(stats);
    } catch (error) {
      console.error('Error fetching lease stats:', error);
      return Result.err(createError('LEASE_STATS_ERROR', 'Failed to fetch lease statistics'));
    }
  },

  async getExpiringLeases(userId: string, days: number) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from(LEASES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;

      const leases = (data || []).map(mapDatabaseToLease);
      return Result.ok(leases);
    } catch (error) {
      console.error('Error fetching expiring leases:', error);
      return Result.err(createError('EXPIRING_LEASES_ERROR', 'Failed to fetch expiring leases'));
    }
  }
};

export { leaseService as default };
