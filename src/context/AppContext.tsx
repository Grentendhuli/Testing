import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { User, Message, BotStatus, BotConfig, Invoice, DailyStats, MonthlySummary, Unit, Lead, Lease, Payment, LateFeeConfig, MaintenanceRequest, UnitStatus, LeadStatus, LeaseStatus, MaintenanceStatus, MaintenancePriority, PaymentStatus, PaymentMethod, LeaseType, SubscriptionStatus, SubscriptionTier } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/features/auth';

// App version
const APP_VERSION = '1.1.0';

export interface PersistedState {
  user: User | null;
  messages: Message[];
  botStatus: BotStatus | null;
  botConfig: BotConfig | null;
  invoices: Invoice[];
  dailyStats: DailyStats | null;
  monthlySummary: MonthlySummary | null;
  units: Unit[];
  leads: Lead[];
  leases: Lease[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  isAuthenticated: boolean;
}

interface AppContextType extends PersistedState {
  // User state
  login: (email: string, password: string) => Promise<{ error: Error | null | undefined; remainingAttempts?: number; isLocked?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  
  // Actions
  refreshMessages: () => Promise<void>;
  updateBotConfig: (config: Partial<BotConfig>) => void;
  markMessageResponded: (messageId: string) => void;
  subscribe: () => Promise<void>;
  cancelSubscription: (reason: string) => Promise<void>;
  updateUnit: (unitId: string, updates: Partial<Unit>) => Promise<void>;
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<Unit | null>;
  deleteUnit: (unitId: string) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  
  // Lease actions
  addLease: (lease: Omit<Lease, 'id'>) => Promise<void>;
  updateLease: (leaseId: string, updates: Partial<Lease>) => Promise<void>;
  deleteLease: (leaseId: string) => Promise<void>;
  terminateLease: (leaseId: string, reason: string) => Promise<void>;
  renewLease: (leaseId: string, extensionMonths: number) => Promise<void>;
  
  // Payment actions
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  getUnitPaymentStatus: (unitId: string, year: number, month: number) => { isPaid: boolean; amountPaid: number; expectedAmount: number };
  
  // Maintenance request actions
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id'>) => Promise<void>;
  updateMaintenanceRequest: (id: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
  deleteMaintenanceRequest: (id: string) => Promise<void>;
  
  // Subscription tier
  updateSubscriptionTier: (tier: SubscriptionTier) => void;
  
  // Late fee automation (Premium feature)
  calculateLateFees: () => { applied: number; totalAmount: number };
  getLateFeeConfig: () => LateFeeConfig | null;
  updateLateFeeConfig: (config: Partial<LateFeeConfig>) => void;
  canAddUnit: () => boolean; // Always true — unlimited free
  getUnitsRemaining: () => number;
  getStorageUsed: () => number;
  getStorageLimit: () => number;
  getStoragePercentage: () => number;
  isStorageFull: () => boolean;
  isStorageNearLimit: () => boolean;
  upgradeToPremium: () => void;
  
  // Data persistence (deprecated - kept for compatibility)
  resetToDemoData: () => void;
  clearAllData: () => void;
  enablePersistence: () => void;
  disablePersistence: () => void;
  persistenceEnabled: boolean;
  showPersistenceBanner: boolean;
  dismissPersistenceBanner: () => void;
  
  // Onboarding tracking
  markOnboardingProgress: (key: 'units' | 'property' | 'leases', value: boolean) => void;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultState: PersistedState = {
  user: null,
  messages: [],
  botStatus: null,
  botConfig: {
    businessHours: { start: '09:00', end: '17:00' },
    afterHoursCollect: true,
    escalationKeywords: ['heat', 'hot water', 'emergency', 'safety', 'fire', 'injury'],
    tone: 'professional',
    propertyRules: { petPolicy: 'No pets', parking: 'Street parking', amenities: 'None' },
    autoEscalateEmergency: true,
  },
  invoices: [],
  dailyStats: null,
  monthlySummary: null,
  units: [],
  leads: [],
  leases: [],
  payments: [],
  maintenanceRequests: [],
  isAuthenticated: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, userData: authUserData, isAuthenticated: authIsAuthenticated, login: authLogin, logout: authLogout } = useAuth();
  
  // State
  const [user, setUser] = useState<User | null>(defaultState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(defaultState.isAuthenticated);
  const [messages, setMessages] = useState<Message[]>(defaultState.messages);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(defaultState.botStatus);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(defaultState.botConfig);
  const [invoices, setInvoices] = useState<Invoice[]>(defaultState.invoices);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(defaultState.dailyStats);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(defaultState.monthlySummary);
  const [units, setUnits] = useState<Unit[]>(defaultState.units);
  const [leads, setLeads] = useState<Lead[]>(defaultState.leads);
  const [leases, setLeases] = useState<Lease[]>(defaultState.leases);
  const [payments, setPayments] = useState<Payment[]>(defaultState.payments);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(defaultState.maintenanceRequests);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Persistence states (deprecated - kept for interface compatibility)
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [showPersistenceBanner, setShowPersistenceBanner] = useState(false);

  const hasLoadedRef = useRef(false);

  // Sync real auth user into app state
  useEffect(() => {
    if (authUser && authUserData && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsAuthenticated(true);
      setUser({
        id: authUser.id,
        email: authUser.email ?? '',
        firstName: authUserData.first_name ?? '',
        lastName: authUserData.last_name ?? '',
        phoneNumber: authUserData.phone_number ?? '',
        propertyAddress: authUserData.property_address ?? '',
        botPhoneNumber: authUserData.bot_phone_number || '',
        subscriptionTier: (authUserData.subscription_tier as SubscriptionTier) ?? 'free',
        subscriptionStatus: authUserData.subscription_status ?? 'active',
        maxUnits: -1,
        storageUsed: authUserData.storage_used,
        storageLimit: authUserData.storage_limit,
        createdAt: authUserData.created_at || new Date().toISOString(),
        trialDaysRemaining: 0,
      } as User);
      loadUserData(authUser.id);
    } else if (authUser === null && !isLoading) {
      hasLoadedRef.current = false;
      setIsAuthenticated(false);
      setUser(null);
      setUnits([]);
      setLeads([]);
      setLeases([]);
      setPayments([]);
      setMaintenanceRequests([]);
    }
  }, [authUser?.id, authUserData?.id]);

  // Load all real data from Supabase for the authenticated user
  const loadUserData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    // Load from comprehensive cache first for instant display and offline support
    const cachedData = localStorage.getItem(`lb_data_${userId}`);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.units) setUnits(parsed.units);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.leases) setLeases(parsed.leases);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.maintenanceRequests) setMaintenanceRequests(parsed.maintenanceRequests);
        if (parsed.messages) setMessages(parsed.messages);
        console.log('[AppContext] Loaded from cache:', new Date(parsed.timestamp).toLocaleString());
      } catch (e) {
        console.warn('[AppContext] Failed to parse cached data:', e);
      }
    }
    // Fallback to old individual caches
    const cachedUnits = localStorage.getItem(`lb_units_${userId}`);
    const cachedLeads = localStorage.getItem(`lb_leads_${userId}`);
    if (cachedUnits && !units.length) {
      try { setUnits(JSON.parse(cachedUnits)); } catch {}
    }
    if (cachedLeads && !leads.length) {
      try { setLeads(JSON.parse(cachedLeads)); } catch {}
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('[AppContext] loadUserData timed out after 15 seconds');
      setIsLoading(false);
      setError('Data loading timed out. Data loaded from cache.');
    }, 15000); // Increased to 15 seconds
    
    try {
      const [unitsRes, leadsRes, leasesRes, paymentsRes, maintRes, msgsRes] = await Promise.all([
        supabase.from('units').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('leases' as any).select('*').eq('user_id', userId).order('end_date', { ascending: true }),
        supabase.from('payments').select('*').eq('user_id', userId).order('due_date', { ascending: false }),
        supabase.from('maintenance_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('messages' as any).select('*').eq('landlord_user_id', userId).order('timestamp', { ascending: false }).limit(50),
      ]);
      
      clearTimeout(timeoutId);

      if (unitsRes.error) throw unitsRes.error;
      if (leadsRes.error) throw leadsRes.error;
      // Graceful handling for leases/messages - treat missing table as empty array
      if (leasesRes.error) {
        const err = leasesRes.error as any;
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          console.warn('[AppContext] leases table not found, treating as empty');
        } else {
          throw leasesRes.error;
        }
      }
      if (paymentsRes.error) throw paymentsRes.error;
      if (maintRes.error) throw maintRes.error;
      // Graceful handling for leases/messages - treat missing table as empty array
      if (msgsRes.error) {
        const err = msgsRes.error as any;
        if (err.code === '42P01' || err.message?.includes('does not exist')) {
          console.warn('[AppContext] messages table not found, treating as empty');
        } else {
          throw msgsRes.error;
        }
      }
      
      const loadedUnits: Unit[] = (unitsRes.data || []).map((u: any) => ({
        id: u.id,
        address: u.address || '',
        unitNumber: u.unit_number || '',
        rentAmount: u.rent_amount || 0,
        status: u.status || 'vacant',
        bedrooms: u.bedrooms || 0,
        bathrooms: u.bathrooms || 0,
        squareFeet: u.square_feet || 0,
        notes: u.notes || '',
        tenantName: u.tenant_name || undefined,
        tenantEmail: u.tenant_email || undefined,
        tenantPhone: u.tenant_phone || undefined,
        leaseStart: u.lease_start || undefined,
        leaseEnd: u.lease_end || undefined,
        createdAt: u.created_at,
      }));
      setUnits(loadedUnits);

      const loadedLeads: Lead[] = (leadsRes.data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        email: l.email || undefined,
        phone: l.phone || undefined,
        status: l.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'closed',
        notes: l.notes || undefined,
        inquiryDate: l.created_at,
        createdAt: l.created_at,
      }));
      setLeads(loadedLeads);

      const loadedLeases: Lease[] = ((leasesRes.data || []) as any[]).map((l: any) => ({
        id: l.id,
        unitId: l.unit_id || '',
        unitNumber: l.unit_number || '',
        tenantName: l.tenant_name || '',
        tenantPhone: l.tenant_phone || '',
        tenantEmail: l.tenant_email || '',
        startDate: l.start_date || '',
        endDate: l.end_date || '',
        rentAmount: l.rent_amount || 0,
        securityDeposit: l.security_deposit || 0,
        status: l.status || 'active',
        leaseType: l.lease_type || 'annual',
        notes: l.notes || '',
        createdAt: l.created_at,
        userId: l.user_id || '',
      }));
      setLeases(loadedLeases);

      const loadedPayments: Payment[] = ((paymentsRes.data || []) as any[]).map((p: any) => ({
        id: p.id,
        unitId: p.unit_id || '',
        amount: p.amount || 0,
        dueDate: p.due_date || '',
        paidDate: p.paid_date || undefined,
        status: p.status || 'pending',
        method: p.method || 'other',
        notes: p.notes || undefined,
        userId: p.user_id || '',
        createdAt: p.created_at,
        tenantName: p.tenant_name || undefined,
        unitNumber: p.unit_number || undefined,
      }));
      setPayments(loadedPayments);

      const loadedMaint: MaintenanceRequest[] = ((maintRes.data || []) as any[]).map((r: any) => ({
        id: r.id,
        unitId: r.unit_id || '',
        title: r.title || '',
        description: r.description || '',
        status: r.status || 'open',
        priority: r.priority || 'medium',
        category: r.category || 'other',
        notes: r.notes || undefined,
        estimatedCost: r.estimated_cost || undefined,
        actualCost: r.actual_cost || undefined,
        assignedTo: r.assigned_to || undefined,
        completedAt: r.completed_at || undefined,
        userId: r.user_id || '',
        createdAt: r.created_at,
        updatedAt: r.updated_at || r.created_at,
        unitNumber: r.unit_number || undefined,
        tenantName: r.tenant_name || undefined,
      }));
      setMaintenanceRequests(loadedMaint);

      setMessages(((msgsRes.data || []) as Message[]) || []);
      
      // Cache ALL data in localStorage for bulletproof persistence across deployments
      try {
        const cacheData = {
          units: loadedUnits,
          leads: loadedLeads,
          leases: loadedLeases,
          payments: loadedPayments,
          maintenanceRequests: loadedMaint,
          messages: (msgsRes.data || []) as Message[],
          timestamp: Date.now(),
        };
        localStorage.setItem(`lb_data_${userId}`, JSON.stringify(cacheData));
        // Also keep individual caches for backward compatibility
        localStorage.setItem(`lb_units_${userId}`, JSON.stringify(loadedUnits));
        localStorage.setItem(`lb_leads_${userId}`, JSON.stringify(loadedLeads));
      } catch (e) {
        console.warn('[AppContext] Failed to cache data:', e);
      }
      
      // Track onboarding progress for PWA timing
      const hasUnits = (unitsRes.data?.length || 0) > 0;
      const hasLeases = (leasesRes.data?.length || 0) > 0;
      markOnboardingProgress('units', hasUnits);
      markOnboardingProgress('leases', hasLeases);
      
      // Check user data for property address
      const userRes = await (supabase as any)
        .from('users')
        .select('property_address')
        .eq('id', userId)
        .single();
      markOnboardingProgress('property', !!userRes.data?.property_address);
    } catch (err: any) {
      console.error('[AppContext] loadUserData error:', err);
      if (err?.code === '42501' || err?.message?.includes('permission denied')) {
        setError('Permission error loading data. Please log out and log in again.');
      } else if (err?.code === 'PGRST301') {
        setError('Session expired. Please refresh the page.');
      } else {
        setError(null);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Helper: Persist current state to localStorage cache
  const persistCache = useCallback(() => {
    if (!authUser?.id) return;
    try {
      const cacheData = {
        units,
        leads,
        leases,
        payments,
        maintenanceRequests,
        messages,
        timestamp: Date.now(),
      };
      localStorage.setItem(`lb_data_${authUser.id}`, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('[AppContext] Failed to persist cache:', e);
    }
  }, [authUser?.id, units, leads, leases, payments, maintenanceRequests, messages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!authUser?.id) return;

    // Subscribe to units changes
    const unitsSubscription = supabase
      .channel('units_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'units', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUnits(prev => [...prev, payload.new as Unit]);
          } else if (payload.eventType === 'UPDATE') {
            setUnits(prev => prev.map(u => u.id === payload.new.id ? payload.new as Unit : u));
          } else if (payload.eventType === 'DELETE') {
            setUnits(prev => prev.filter(u => u.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to leads changes
    const leadsSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new as Lead : l));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to maintenance_requests changes
    const maintenanceSubscription = supabase
      .channel('maintenance_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMaintenanceRequests(prev => [payload.new as MaintenanceRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMaintenanceRequests(prev => prev.map(m => m.id === payload.new.id ? payload.new as MaintenanceRequest : m));
          } else if (payload.eventType === 'DELETE') {
            setMaintenanceRequests(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to payments changes
    const paymentsSubscription = supabase
      .channel('payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPayments(prev => [...prev, payload.new as Payment]);
          } else if (payload.eventType === 'UPDATE') {
            setPayments(prev => prev.map(p => p.id === payload.new.id ? payload.new as Payment : p));
          } else if (payload.eventType === 'DELETE') {
            setPayments(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to leases changes
    const leasesSubscription = supabase
      .channel('leases_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leases', filter: `user_id=eq.${authUser.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeases(prev => [...prev, payload.new as Lease]);
          } else if (payload.eventType === 'UPDATE') {
            setLeases(prev => prev.map(l => l.id === payload.new.id ? payload.new as Lease : l));
          } else if (payload.eventType === 'DELETE') {
            setLeases(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const messagesSubscription = supabase
      .channel('messages_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `landlord_user_id=eq.${authUser.id}` },
        (payload) => {
          setMessages(prev => [payload.new as Message, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unitsSubscription);
      supabase.removeChannel(leadsSubscription);
      supabase.removeChannel(maintenanceSubscription);
      supabase.removeChannel(paymentsSubscription);
      supabase.removeChannel(leasesSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, [authUser?.id]);

  // Auth actions (delegate to AuthContext)
  const login = async (email: string, password: string) => {
    return await authLogin(email, password);
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
    setIsAuthenticated(false);
    setUnits([]);
    setLeads([]);
    setMaintenanceRequests([]);
    setPayments([]);
    setLeases([]);
    // Clear localStorage cache on logout
    const userId = authUser?.id;
    if (userId) {
      localStorage.removeItem(`lb_units_${userId}`);
      localStorage.removeItem(`lb_leads_${userId}`);
      localStorage.removeItem(`lb_data_${userId}`);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    // Updates are handled through userData updates in AuthContext
    // This is kept for interface compatibility
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const refreshMessages = async () => {
    if (!authUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('landlord_user_id', authUser.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(((data || []) as Message[]) || []);
    } catch (err) {
      console.error('[AppContext] refreshMessages error:', err);
      setError('Failed to refresh messages. Please try again.');
    }
  };

  const updateBotConfig = (config: Partial<BotConfig>) => {
    setBotConfig(prev => prev ? { ...prev, ...config } : null);
  };

  const markMessageResponded = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, landlordResponded: true }
          : msg
      )
    );
  };

  const subscribe = async () => {
    if (!authUser?.id) return;
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) throw error;
      if (user) {
        setUser({
          ...user,
          subscriptionStatus: 'active',
        });
      }
    } catch (err) {
      console.error('[AppContext] subscribe error:', err);
      setError('Failed to update subscription. Please try again.');
    }
  };

  const cancelSubscription = async (reason: string) => {
    if (!authUser?.id) return;
    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_tier: 'free',
          cancellation_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) throw error;
      if (user) {
        setUser({
          ...user,
          subscriptionStatus: 'canceled',
          subscriptionTier: 'free',
        });
      }
    } catch (err) {
      console.error('[AppContext] cancelSubscription error:', err);
      setError('Failed to cancel subscription. Please try again.');
    }
  };

  const updateSubscriptionTier = (tier: SubscriptionTier) => {
    if (user) {
      setUser({ 
        ...user, 
        subscriptionTier: tier,
        subscriptionStatus: tier === 'free' ? 'canceled' : 'active',
      });
    }
  };

  // Track onboarding progress for PWA prompt
  const markOnboardingProgress = useCallback((key: 'units' | 'property' | 'leases', value: boolean) => {
    try {
      const storageKey = `pwa-onboarding-${key}-added`;
      localStorage.setItem(storageKey, value ? 'true' : 'false');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Unit CRUD operations
  const updateUnit = async (unitId: string, updates: Partial<Unit>) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('units')
      .update({
        address: updates.address,
        unit_number: updates.unitNumber,
        rent_amount: updates.rentAmount,
        status: updates.status,
        bedrooms: updates.bedrooms,
        bathrooms: updates.bathrooms,
        square_feet: updates.squareFeet,
        notes: updates.notes,
        tenant_name: updates.tenantName,
        tenant_email: updates.tenantEmail,
        tenant_phone: updates.tenantPhone,
        lease_start: updates.leaseStart,
        lease_end: updates.leaseEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error updating unit:', error);
      throw error;
    }

    // Optimistic update
    setUnits(prev => 
      prev.map(unit => 
        unit.id === unitId 
          ? { ...unit, ...updates }
          : unit
      )
    );
    // Persist cache
    setTimeout(persistCache, 0);
  };

  const addUnit = async (unit: Omit<Unit, 'id'>) => {
    if (!authUser?.id) {
      throw new Error('You must be logged in to add a unit.');
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database request timed out. Please try again.')), 15000);
    });

    const insertPromise = (supabase as any)
      .from('units')
      .insert({
        user_id: authUser.id,
        address: unit.address,
        unit_number: unit.unitNumber,
        rent_amount: unit.rentAmount,
        status: unit.status,
        bedrooms: unit.bedrooms || 0,
        bathrooms: unit.bathrooms || 0,
        square_feet: unit.squareFeet || 0,
        notes: unit.notes || null,
        tenant_name: unit.tenantName || null,
        tenant_email: unit.tenantEmail || null,
        tenant_phone: unit.tenantPhone || null,
        lease_start: unit.leaseStart || null,
        lease_end: unit.leaseEnd || null,
      })
      .select()
      .maybeSingle();

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      console.error('Error adding unit:', error);
      throw error;
    }

    const newUnit: Unit = {
      id: (data as any).id,
      address: (data as any).address,
      unitNumber: (data as any).unit_number || '',
      rentAmount: (data as any).rent_amount,
      status: (data as any).status as 'occupied' | 'vacant' | 'maintenance',
      bedrooms: (data as any).bedrooms || 0,
      bathrooms: (data as any).bathrooms || 0,
      squareFeet: (data as any).square_feet || 0,
      notes: (data as any).notes || '',
      tenantName: (data as any).tenant_name || undefined,
      tenantEmail: (data as any).tenant_email || undefined,
      tenantPhone: (data as any).tenant_phone || undefined,
      leaseStart: (data as any).lease_start || undefined,
      leaseEnd: (data as any).lease_end || undefined,
    };

    setUnits(prev => [...prev, newUnit]);
    // Persist to cache immediately for bulletproof data persistence
    setTimeout(persistCache, 0);
    // Mark onboarding progress for PWA
    markOnboardingProgress('units', true);
    return newUnit;
  };

  const deleteUnit = async (unitId: string) => {
    if (!authUser?.id) {
      console.warn('[deleteUnit] No authenticated user');
      throw new Error('You must be logged in to delete a unit.');
    }

    if (!unitId) {
      console.warn('[deleteUnit] No unit ID provided');
      throw new Error('Invalid unit selected.');
    }

    try {
      // First delete any associated leases
      const { error: leaseError } = await (supabase as any)
        .from('leases')
        .delete()
        .eq('unit_id', unitId)
        .eq('user_id', authUser.id);

      if (leaseError) {
        console.warn('[deleteUnit] Error deleting leases:', leaseError);
        // Continue with unit deletion even if lease deletion fails
      }

      // Then delete the unit
      const { error } = await (supabase as any)
        .from('units')
        .delete()
        .eq('id', unitId)
        .eq('user_id', authUser.id);

      if (error) {
        console.error('[deleteUnit] Error deleting unit:', error);
        throw new Error('Failed to delete unit. Please try again.');
      }

      // Optimistic update
      setUnits(prev => prev.filter(unit => unit.id !== unitId));
      // Persist cache
      setTimeout(persistCache, 0);
    } catch (err: any) {
      console.error('[deleteUnit] Exception:', err);
      throw new Error(err?.message || 'Failed to delete unit. Please try again.');
    }
  };

  // Lead CRUD operations
  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('leads')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        status: updates.status,
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }

    setLeads(prev => 
      prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, ...updates }
          : lead
      )
    );
  };

  const addLead = async (lead: Omit<Lead, 'id'>) => {
    if (!authUser?.id) return;

    const { data, error } = await (supabase as any)
      .from('leads')
      .insert({
        user_id: authUser.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        notes: lead.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding lead:', error);
      throw error;
    }

    const newLead: Lead = {
      id: data.id,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      status: data.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'closed',
      notes: data.notes || undefined,
      inquiryDate: data.created_at,
      createdAt: data.created_at,
    };

    setLeads(prev => [newLead, ...prev]);
  };

  const deleteLead = async (leadId: string) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }

    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };

  // Lease CRUD operations
  const addLease = async (lease: Omit<Lease, 'id'>) => {
    if (!authUser?.id) return;

    const { data, error } = await (supabase as any)
      .from('leases')
      .insert({
        user_id: authUser.id,
        unit_id: lease.unitId,
        unit_number: lease.unitNumber,
        tenant_name: lease.tenantName,
        tenant_email: lease.tenantEmail || null,
        tenant_phone: lease.tenantPhone || null,
        start_date: lease.startDate,
        end_date: lease.endDate,
        rent_amount: lease.rentAmount,
        security_deposit: lease.securityDeposit || 0,
        lease_type: lease.leaseType || 'fixed-term',
        status: lease.status || 'active',
        notes: lease.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('addLease error:', error);
      throw error;
    }

    const newLease: Lease = {
      id: data.id,
      unitId: data.unit_id,
      unitNumber: data.unit_number || '',
      tenantName: data.tenant_name || '',
      tenantEmail: data.tenant_email || undefined,
      tenantPhone: data.tenant_phone || undefined,
      startDate: data.start_date || '',
      endDate: data.end_date || '',
      rentAmount: data.rent_amount || 0,
      securityDeposit: data.security_deposit || 0,
      leaseType: (data.lease_type || 'fixed-term') as LeaseType,
      status: (data.status || 'active') as LeaseStatus,
      notes: data.notes || undefined,
    };

    setLeases(prev => [...prev, newLease]);
  };

  const updateLease = async (leaseId: string, updates: Partial<Lease>) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('leases')
      .update({
        unit_number: updates.unitNumber,
        tenant_name: updates.tenantName,
        tenant_email: updates.tenantEmail,
        tenant_phone: updates.tenantPhone,
        start_date: updates.startDate,
        end_date: updates.endDate,
        rent_amount: updates.rentAmount,
        security_deposit: updates.securityDeposit,
        lease_type: updates.leaseType,
        status: updates.status,
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaseId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('updateLease error:', error);
      throw error;
    }

    setLeases(prev => prev.map(l => l.id === leaseId ? { ...l, ...updates } : l));
  };

  const deleteLease = async (leaseId: string) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('leases')
      .delete()
      .eq('id', leaseId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('deleteLease error:', error);
      throw error;
    }

    setLeases(prev => prev.filter(l => l.id !== leaseId));
  };

  const terminateLease = async (leaseId: string, reason: string) => {
    await updateLease(leaseId, { status: 'terminated', notes: reason });
  };

  const renewLease = async (leaseId: string, extensionMonths: number) => {
    const lease = leases.find(l => l.id === leaseId);
    if (!lease) return;

    const currentEnd = new Date(lease.endDate);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + extensionMonths);

    await updateLease(leaseId, {
      endDate: newEnd.toISOString().split('T')[0],
      status: 'active',
    });
  };

  // Payment CRUD operations
  const addPayment = async (payment: Omit<Payment, 'id'>) => {
    if (!authUser?.id) return;

    const { data, error } = await (supabase as any)
      .from('payments')
      .insert({
        user_id: authUser.id,
        unit_id: payment.unitId,
        amount: payment.amount,
        due_date: payment.dueDate,
        paid_date: payment.paidDate,
        status: payment.status,
        late_fee: payment.lateFee || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding payment:', error);
      throw error;
    }

    const newPayment: Payment = {
      id: data.id,
      unitId: data.unit_id,
      amount: data.amount,
      dueDate: data.due_date,
      paidDate: data.paid_date || undefined,
      status: data.status as 'paid' | 'pending' | 'late' | 'overdue',
      lateFee: data.late_fee,
      createdAt: data.created_at,
    };

    setPayments(prev => [...prev, newPayment]);
  };

  const updatePayment = async (paymentId: string, updates: Partial<Payment>) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('payments')
      .update({
        amount: updates.amount,
        due_date: updates.dueDate,
        paid_date: updates.paidDate,
        status: updates.status,
        late_fee: updates.lateFee,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error updating payment:', error);
      throw error;
    }

    setPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, ...updates }
          : payment
      )
    );
  };

  const deletePayment = async (paymentId: string) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }

    setPayments(prev => prev.filter(payment => payment.id !== paymentId));
  };

  // Maintenance request CRUD operations
  const addMaintenanceRequest = async (request: Omit<MaintenanceRequest, 'id'>) => {
    if (!authUser?.id) return;

    const { data, error } = await (supabase as any)
      .from('maintenance_requests')
      .insert({
        user_id: authUser.id,
        unit_id: request.unitId,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding maintenance request:', error);
      throw error;
    }

    const newRequest: MaintenanceRequest = {
      id: data.id,
      unitId: data.unit_id,
      title: data.title,
      description: data.description,
      status: data.status as 'open' | 'in_progress' | 'completed' | 'cancelled',
      priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setMaintenanceRequests(prev => [newRequest, ...prev]);
  };

  const updateMaintenanceRequest = async (id: string, updates: Partial<MaintenanceRequest>) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('maintenance_requests')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error updating maintenance request:', error);
      throw error;
    }

    setMaintenanceRequests(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    );
  };

  const deleteMaintenanceRequest = async (id: string) => {
    if (!authUser?.id) return;

    const { error } = await (supabase as any)
      .from('maintenance_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id);

    if (error) {
      console.error('Error deleting maintenance request:', error);
      throw error;
    }

    setMaintenanceRequests(prev => prev.filter(r => r.id !== id));
  };

  const getUnitPaymentStatus = useCallback((unitId: string, year: number, month: number) => {
    const unit = units.find(u => u.id === unitId);
    const expectedAmount = unit?.rentAmount || 0;
    
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.dueDate);
      return p.unitId === unitId && 
             pDate.getFullYear() === year && 
             pDate.getMonth() === month - 1 &&
             p.status === 'paid';
    });
    
    const amountPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      isPaid: amountPaid >= expectedAmount,
      amountPaid,
      expectedAmount
    };
  }, [units, payments]);

  // Subscription/storage functions
  const canAddUnit = () => {
    return true; // Unlimited — free app
  };

  const getUnitsRemaining = () => {
    return -1; // Unlimited
  };

  const getStorageUsed = () => {
    return user?.storageUsed || 0;
  };

  const getStorageLimit = () => {
    return user?.storageLimit || 52428800; // 50MB default
  };

  const getStoragePercentage = () => {
    const used = getStorageUsed();
    const limit = getStorageLimit();
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const isStorageFull = () => {
    return getStoragePercentage() >= 100;
  };

  const isStorageNearLimit = () => {
    return getStoragePercentage() >= 85;
  };

  const upgradeToPremium = () => {
    if (user) {
      setUser({ 
        ...user, 
        subscriptionTier: 'concierge',
        subscriptionStatus: 'active',
        storageLimit: -1, // Unlimited
        maxUnits: -1, // Unlimited
      });
    }
  };

  // Late fee automation
  const calculateLateFees = useCallback(() => {
    if (!user || user.subscriptionTier !== 'concierge') {
      return { applied: 0, totalAmount: 0 };
    }

    const config = botConfig?.lateFeeConfig;
    if (!config?.enabled) {
      return { applied: 0, totalAmount: 0 };
    }

    let appliedCount = 0;
    let totalLateFeeAmount = 0;
    const today = new Date();
    const newPayments: Payment[] = [];

    // Check each unit with an active lease
    leases.forEach(lease => {
      if (lease.status !== 'active') return;

      const unit = units.find(u => u.id === lease.unitId);
      if (!unit) return;

      // Check last 3 months for late payments
      for (let i = 0; i < 3; i++) {
        const checkDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = checkDate.getFullYear();
        const month = checkDate.getMonth() + 1;

        // Calculate due date (1st of month + grace period)
        const dueDate = new Date(year, month - 1, 1);
        dueDate.setDate(dueDate.getDate() + (config.gracePeriodDays || 5));

        // Skip if still in grace period
        if (today <= dueDate) continue;

        // Check if already has a late fee for this month
        const hasLateFee = payments.some(p => 
          p.unitId === lease.unitId && 
          p.status === 'late' &&
          new Date(p.dueDate).getMonth() === month - 1 &&
          new Date(p.dueDate).getFullYear() === year &&
          (p.lateFee || 0) > 0
        );

        if (hasLateFee) continue;

        // Get payment status
        const paymentStatus = getUnitPaymentStatus(lease.unitId, year, month);

        // If rent not paid in full, apply late fee
        if (!paymentStatus.isPaid) {
          let lateFeeAmount = 0;

          if (config.flatFee) {
            lateFeeAmount = config.flatFee;
          } else if (config.percentageFee && paymentStatus.expectedAmount > 0) {
            lateFeeAmount = (paymentStatus.expectedAmount * config.percentageFee) / 100;
          }

          if (config.maxLateFee && lateFeeAmount > config.maxLateFee) {
            lateFeeAmount = config.maxLateFee;
          }

          if (lateFeeAmount > 0) {
            const newPayment: Payment = {
              id: `latefee_${Date.now()}_${appliedCount}`,
              unitId: lease.unitId,
              unitNumber: unit.unitNumber,
              tenantName: lease.tenantName,
              amount: lateFeeAmount,
              dueDate: today.toISOString().split('T')[0],
              paymentDate: today.toISOString().split('T')[0],
              status: 'late',
              method: 'online',
              lateFee: lateFeeAmount,
              createdAt: new Date().toISOString(),
            };
            newPayments.push(newPayment);
            appliedCount++;
            totalLateFeeAmount += lateFeeAmount;
          }
        }
      }
    });

    if (newPayments.length > 0) {
      setPayments(prev => [...prev, ...newPayments]);
    }

    return { applied: appliedCount, totalAmount: totalLateFeeAmount };
  }, [user?.subscriptionTier, botConfig?.lateFeeConfig, leases, units, payments, getUnitPaymentStatus]);

  const getLateFeeConfig = () => {
    return botConfig?.lateFeeConfig || null;
  };

  const updateLateFeeConfig = (config: Partial<LateFeeConfig>) => {
    updateBotConfig({
      lateFeeConfig: {
        ...botConfig?.lateFeeConfig,
        enabled: config.enabled ?? botConfig?.lateFeeConfig?.enabled ?? false,
        gracePeriodDays: config.gracePeriodDays ?? botConfig?.lateFeeConfig?.gracePeriodDays ?? 5,
        flatFee: config.flatFee ?? botConfig?.lateFeeConfig?.flatFee,
        percentageFee: config.percentageFee ?? botConfig?.lateFeeConfig?.percentageFee,
        maxLateFee: config.maxLateFee ?? botConfig?.lateFeeConfig?.maxLateFee,
      }
    });
  };

  // Automated Late Fee Calculation (Premium feature) - runs daily
  useEffect(() => {
    if (!botConfig?.lateFeeConfig?.enabled) return;
    if (!authUser?.id) return;
    
    // Run once on mount
    calculateLateFees();
    
    // Then run every 24 hours
    const interval = setInterval(() => {
      calculateLateFees();
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [botConfig?.lateFeeConfig?.enabled, authUser?.id]);

  // Deprecated persistence functions (kept for interface compatibility)
  const resetToDemoData = () => {
    console.log('Demo data reset - using Supabase data now');
  };

  const clearAllData = () => {
    setUser(null);
    setIsAuthenticated(false);
    setMessages([]);
    setBotStatus(null);
    setBotConfig(null);
    setInvoices([]);
    setDailyStats(null);
    setMonthlySummary(null);
    setUnits([]);
    setLeads([]);
    setLeases([]);
    setPayments([]);
    setMaintenanceRequests([]);
  };

  const enablePersistence = () => {
    setPersistenceEnabled(true);
    setShowPersistenceBanner(false);
  };

  const disablePersistence = () => {
    setPersistenceEnabled(false);
  };

  const dismissPersistenceBanner = () => {
    setShowPersistenceBanner(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        messages,
        botStatus,
        botConfig,
        invoices,
        dailyStats,
        monthlySummary,
        units,
        leads,
        leases,
        payments,
        maintenanceRequests,
        login,
        logout,
        updateUser,
        refreshMessages,
        updateBotConfig,
        markMessageResponded,
        subscribe,
        cancelSubscription,
        updateSubscriptionTier,
        updateUnit,
        addUnit,
        deleteUnit,
        updateLead,
        addLead,
        deleteLead,
        addLease,
        updateLease,
        deleteLease,
        terminateLease,
        renewLease,
        addPayment,
        updatePayment,
        deletePayment,
        getUnitPaymentStatus,
        addMaintenanceRequest,
        updateMaintenanceRequest,
        deleteMaintenanceRequest,
        canAddUnit,
        getUnitsRemaining,
        getStorageUsed,
        getStorageLimit,
        getStoragePercentage,
        isStorageFull,
        isStorageNearLimit,
        upgradeToPremium,
        calculateLateFees,
        getLateFeeConfig,
        updateLateFeeConfig,
        resetToDemoData,
        clearAllData,
        enablePersistence,
        disablePersistence,
        persistenceEnabled,
        showPersistenceBanner,
        dismissPersistenceBanner,
        markOnboardingProgress,
        isLoading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
