# LandlordBot - Architecture & Best Practices Implementation Roadmap

**Generated:** March 24, 2026  
**For:** React + Supabase + Vite Stack  
**Current Versions:** React 18.3.1, Vite 6.0.1, Supabase 2.97.0

---

## Executive Summary

This roadmap provides a prioritized action plan to modernize the LandlordBot codebase based on:
- **Current State Analysis:** Legacy patterns, performance issues identified in March 2026 audits
- **Industry Best Practices:** React 19 patterns, TanStack Query v5, modern Supabase patterns
- **Production-Ready Standards:** TypeScript strictness, testing, performance optimization

**Impact Summary:**
| Metric | Current | Target | Benefit |
|--------|---------|--------|---------|
| Bundle Size | 1,386 KB | ~500 KB | 64% reduction |
| Re-render Time | 120ms | 30ms | 75% improvement |
| Memory Leaks | 3 active | 0 | Stability |
| First Paint | 2.5s | 0.9s | 64% faster |

---

## 🔴 MUST-HAVE FIXES (Critical - Do First)

These issues affect stability, performance, and user experience. Address immediately.

### MH-1: Fix Memory Leaks (30 min)
**Priority:** P0 🔥  
**Effort:** 30 minutes  
**Impact:** Prevents crashes during long sessions

**Issues Found:**
| File | Line | Issue |
|------|------|-------|
| `AICommandPalette.tsx` | 158-160 | `setTimeout` without cleanup |
| `AutoCompleteInput.tsx` | 89-96 | Debounce timer potential leak |

**Action:**
```typescript
// BEFORE (LEAK):
useEffect(() => {
  if (isOpen) {
    setTimeout(() => inputRef.current?.focus(), 100);
  }
}, [isOpen]);

// AFTER:
useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  if (isOpen) {
    timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
  }
  return () => clearTimeout(timeoutId);
}, [isOpen]);
```

**Files to Edit:**
- `src/components/AICommandPalette.tsx`
- `src/components/AutoCompleteInput.tsx`

---

### MH-2: Implement Code Splitting with React.lazy (1-2 hours)
**Priority:** P0 🔥  
**Effort:** 1-2 hours  
**Impact:** 60% reduction in initial bundle size

**Current State:** All 20+ pages imported eagerly in App.tsx

**Implementation:**

1. **Create a lazy-loading wrapper:**

```typescript
// src/components/AsyncPage.tsx
import { Suspense, lazy, ComponentType } from 'react';
import { PageLoader } from '@/components/PageLoader';

export function createLazyPage<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);
  return function AsyncPage(props: any) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
```

2. **Update App.tsx imports:**

```typescript
// BEFORE: import { Dashboard } from './pages/Dashboard';
// AFTER:
const Dashboard = createLazyPage(() => import('./pages/Dashboard'));
const Units = createLazyPage(() => import('./pages/Units'));
const RentCollection = createLazyPage(() => import('./pages/RentCollection'));
// ... apply to all 20+ pages
```

3. **Vite config optimization:**

```typescript
// Add to vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Keep existing chunks
        'vendor': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        'supabase': ['@supabase/supabase-js'],
        'ui': ['class-variance-authority', 'clsx', 'tailwind-merge'],
        // Add per-page chunks
        'pages-units': ['./src/pages/Units.tsx'],
        'pages-maintenance': ['./src/pages/MaintenanceSmart.tsx'],
        'pages-reports': ['./src/pages/Reports.tsx'],
      }
    }
  }
}
```

**Files to Edit:**
- `src/App.tsx` - Update imports
- `src/components/PageLoader.tsx` - Create loading component
- `vite.config.ts` - Update manualChunks

---

### MH-3: Add React.memo to Heavy Components (45 min)
**Priority:** P0  
**Effort:** 45 minutes  
**Impact:** Eliminates 40% of unnecessary re-renders

**Components to Memoize:**

| Component | File | Reason |
|-----------|------|--------|
| UnitCard | `features/units/components/UnitCard.tsx` | Rendered in lists |
| AIInsightCard | `components/AIInsightCard.tsx` | Complex calculations |
| SmartMetricCard | `components/SmartMetricCard.tsx` | Already done ✅ |
| SmartSuggestion | `components/SmartSuggestion.tsx` | Already done ✅ |

**Implementation:**
```typescript
// BEFORE:
export function UnitCard({ unit, unitHealth, onSelect }: UnitCardProps) {
  // ...
}

// AFTER:
export const UnitCard = React.memo(function UnitCard({ 
  unit, 
  unitHealth, 
  onSelect 
}: UnitCardProps) {
  // ...
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.unit.id === nextProps.unit.id && 
         prevProps.unitHealth === nextProps.unitHealth;
});
```

**Files to Edit:**
- `src/features/units/components/UnitCard.tsx`
- `src/components/AIInsightCard.tsx`
- Verify `SmartMetricCard`, `SmartSuggestion` already memoized

---

### MH-4: Memoize Event Handlers with useCallback (1 hour)
**Priority:** P0  
**Effort:** 1 hour  
**Impact:** Prevents child re-renders from inline functions

**Critical Files:**
- `DashboardSmart.tsx` - handlers at lines 374, 378
- `RentCollection.tsx` - handlers at lines 230-250
- `Units.tsx` - handlers at lines 82-89
- `Leases.tsx` - handlers at lines 365-400
- `MaintenanceSmart.tsx` - handlers in map render

**Pattern:**
```typescript
// BEFORE:
<button onClick={() => setSelectedUnit(unit)}>

// AFTER:
const handleSelectUnit = useCallback((unit: Unit) => {
  setSelectedUnit(unit);
}, []);

<button onClick={() => handleSelectUnit(unit)}>
  // Or better: <button onClick={handleSelectUnit}> with data attributes
```

**Files to Edit:**
- `src/pages/DashboardSmart.tsx`
- `src/pages/RentCollection.tsx`
- `src/pages/Units.tsx`
- `src/pages/Leases.tsx`
- `src/pages/MaintenanceSmart.tsx`

---

### MH-5: Memoize Expensive Computations with useMemo (45 min)
**Priority:** P0  
**Effort:** 45 minutes  
**Impact:** Prevents recalculation on every render

**Locations:**

| File | Line | Computation |
|------|------|-------------|
| `RentCollection.tsx` | 115-125 | `groupedByMonth` |
| `DashboardSmart.tsx` | 45-100 | `generateAIInsights` |
| `useUnits.ts` | 85-140 | `calculateUnitHealth` |

**Example Fix:**
```typescript
// BEFORE:
const groupedByMonth = filteredRecords.reduce((groups, record) => {
  // ... expensive grouping
}, {});

// AFTER:
const groupedByMonth = useMemo(() => 
  filteredRecords.reduce((groups, record) => {
    // ... grouping logic
  }, {}),
  [filteredRecords]
);
```

**Files to Edit:**
- `src/pages/RentCollection.tsx`
- `src/pages/DashboardSmart.tsx`

---

## 🟡 SHOULD-HAVE IMPROVEMENTS (Recommended - Do Within Sprint)

These significantly improve DX, maintainability, and performance.

### SH-1: Migrate to TanStack Query v5 for Server State (4-6 hours)
**Priority:** P1  
**Effort:** 4-6 hours  
**Impact:** Eliminates manual data fetching, caching, real-time sync complexity

**Why:** Current AppContext manually manages:
- Loading states
- Error handling
- Caching (partial - localStorage only)
- Real-time subscriptions (6 separate channels!)
- Optimistic updates

**TanStack Query Provides:**
- Automatic caching and invalidation
- Built-in stale-while-revalidate
- Optimistic updates
- Retry logic
- DevTools

**Migration Plan:**

1. **Install Dependencies:**
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools @supabase-cache-helpers/postgrest-react-query
```

2. **Set up Query Client:**
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});
```

3. **Create a Units Hook (Example):**
```typescript
// src/features/units/hooks/useUnitsQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const UNITS_KEY = 'units';

export function useUnits(userId: string) {
  return useQuery({
    queryKey: [UNITS_KEY, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unit: Omit<Unit, 'id'>) => {
      const { data, error } = await supabase
        .from('units')
        .insert(unit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables, context) => {
      // Optimistically update cache
      queryClient.setQueryData([UNITS_KEY, data.user_id], (old: any) => {
        return old ? [data, ...old] : [data];
      });
    },
    onError: (error) => {
      // Show toast notification
      console.error('Failed to create unit:', error);
    },
  });
}
```

4. **Replace Supabase Realtime with Query Invalidation:**
```typescript
// In component using units:
useEffect(() => {
  const subscription = supabase
    .channel('units_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'units' },
      () => {
        // Invalidate cache instead of manually updating state
        queryClient.invalidateQueries({ queryKey: [UNITS_KEY, userId] });
      }
    )
    .subscribe();
  
  return () => subscription.unsubscribe();
}, [userId]);
```

**Migration Priority:**
1. `units` - Most complex, highest ROI
2. `leads` - Similar pattern
3. `maintenance_requests` - Real-time updates needed
4. `payments` - Financial data, needs reliability
5. `leases` - Lower frequency

**Files to Create/Edit:**
- `src/lib/queryClient.ts` - New
- `src/features/units/hooks/useUnitsQuery.ts` - New
- `src/features/leads/hooks/useLeadsQuery.ts` - New
- `src/main.tsx` - Wrap with QueryClientProvider

---

### SH-2: Split God Context (AppContext) (3-4 hours)
**Priority:** P1  
**Effort:** 3-4 hours  
**Impact:** ~40% reduction in re-render cascades

**Current State:** `AppContext` holds 15+ state values, causing everything to re-render

**New Architecture:**

```
Before:                    After:
┌──────────────┐          ┌─────────────┐
│  AppContext  │  →       │ AppProvider │ (minimal)
│  (everything)│          │ (orchestrates)│
└──────────────┘          └──────┬──────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────┴─────┐          ┌─────┴─────┐          ┌───┴────┐
    │UnitContext│          │AuthContext│          │UIContext│
    │(units,    │          │(user,     │          │(theme,  │
    │leases)    │          │session)   │          │loading) │
    └───────────┘          └───────────┘          └────────┘
```

**Implementation:**

1. **Create UnitContext:**
```typescript
// src/features/units/context/UnitContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { Unit, Lease, Payment, MaintenanceRequest } from '@/types';

interface UnitContextType {
  units: Unit[];
  leases: Lease[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  // Actions
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<Unit | null>;
  updateUnit: (id: string, updates: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  // ... etc
}

const UnitContext = createContext<UnitContextType | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  // Move only unit-related state here
  const [units, setUnits] = useState<Unit[]>([]);
  // ...
}
```

2. **Create UIContext (for loading states, modals):**
```typescript
// src/context/UIContext.tsx
interface UIContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  // Modal states
  isModalOpen: boolean;
  openModal: (type: string) => void;
  closeModal: () => void;
}
```

3. **Keep AuthContext as-is** (already well-scoped)

**Files to Create/Edit:**
- `src/features/units/context/UnitContext.tsx` - New
- `src/context/UIContext.tsx` - New
- `src/App.tsx` - Update providers

---

### SH-3: Enable TypeScript Strict Mode (2-3 hours)
**Priority:** P1  
**Effort:** 2-3 hours  
**Impact:** Catches bugs at compile time

**Current tsconfig.json:**
```json
{
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "noImplicitReturns": false
}
```

**Target tsconfig.json:**
```json
{
  "noImplicitAny": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}
```

**Quick Fix for `any` usages:**
```bash
# Find all `any` usages
grep -r "as any" src/ --include="*.ts" --include="*.tsx"

# Common replacements:
(supabase as any) → proper typing
(data as any) → data as TableRow<'units'>
```

**Files to Edit:**
- `tsconfig.json` - Enable strict flags
- `src/features/auth/AuthContext.tsx` - Fix `any` usages
- `src/context/AppContext.tsx` - Fix `any` usages
- Search for other `any` usages

---

### SH-4: Add React Testing Library Infrastructure (2 hours)
**Priority:** P1  
**Effort:** 2 hours  
**Impact:** Enables TDD, prevents regressions

**Install Dependencies:**
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Update package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Create Test Setup:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

**Create Sample Test:**
```typescript
// src/features/units/components/UnitCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitCard } from './UnitCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('UnitCard', () => {
  const mockUnit = {
    id: '1',
    address: '123 Main St',
    unitNumber: 'A',
    rentAmount: 2000,
    status: 'occupied' as const,
  };

  it('renders unit information', () => {
    render(<UnitCard unit={mockUnit} unitHealth={null} onSelect={vi.fn()} />, { wrapper: Wrapper });
    
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Unit A')).toBeInTheDocument();
    expect(screen.getByText('$2,000')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<UnitCard unit={mockUnit} unitHealth={null} onSelect={onSelect} />, { wrapper: Wrapper });
    
    fireEvent.click(screen.getByTestId('unit-card'));
    expect(onSelect).toHaveBeenCalledWith(mockUnit);
  });
});
```

**Files to Create:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/test-utils.tsx` - Custom render with providers

---

### SH-5: Optimize Supabase Queries with Indexing (1-2 hours)
**Priority:** P1  
**Effort:** 1-2 hours  
**Impact:** Faster queries, reduced latency

**Current Queries (No Indexing Strategy):**
- Multiple `.eq('user_id', user_id)` filters
- No composite indexes
- Real-time subscriptions on multiple tables

**Recommended Indexes:**
```sql
-- Primary queries
CREATE INDEX idx_units_user_id ON units(user_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_maintenance_user_id ON maintenance_requests(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_leases_user_id ON leases(user_id);

-- Composite indexes for common filters
CREATE INDEX idx_units_user_status ON units(user_id, status);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_maintenance_user_status ON maintenance_requests(user_id, status);

-- Sorting indexes  
CREATE INDEX idx_units_created_at ON units(user_id, created_at DESC);
CREATE INDEX idx_leads_created_at ON leads(user_id, created_at DESC);
```

**Add Migration File:**
```sql
-- supabase/migrations/20260324000001_add_performance_indexes.sql
-- Run: supabase db push

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
-- ... etc
```

**Files to Create:**
- `supabase/migrations/20260324000001_add_performance_indexes.sql`
- Update documentation on running migrations

---

### SH-6: Implement Bundle Analysis & Monitoring (1 hour)
**Priority:** P1  
**Effort:** 1 hour  
**Impact:** Visibility into bundle size regressions

**Install Dependencies:**
```bash
npm install -D vite-bundle-visualizer
```

**Add Script:**
```json
{
  "scripts": {
    "analyze": "vite-bundle-visualizer -o dist/stats.html"
  }
}
```

**Add Bundle Size Check to CI (if using CI/CD):**
```typescript
// scripts/check-bundle-size.js
const fs = require('fs');
const path = require('path');

const DIST_DIR = './dist';
const MAX_SIZE_MB = 2;

function getDirectorySize(dir) {
  const files = fs.readdirSync(dir);
  let size = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stats.size;
    }
  }
  
  return size;
}

const sizeMB = getDirectorySize(DIST_DIR) / 1024 / 1024;

if (sizeMB > MAX_SIZE_MB) {
  console.error(`Bundle size ${sizeMB.toFixed(2)}MB exceeds limit of ${MAX_SIZE_MB}MB`);
  process.exit(1);
}

console.log(`Bundle size: ${sizeMB.toFixed(2)}MB ✓`);
```

---

## 🟢 NICE-TO-HAVES (If Time Permits)

### NT-1: Upgrade to React 19 (2-3 hours)
**Priority:** P2  
**Effort:** 2-3 hours  
**Impact:** New features, automatic memoization

**React 19 Features:**
- Actions and useActionState
- useOptimistic hook
- Automatic memoization (React Compiler)
- Document metadata support
- Asset loading APIs

**Upgrade Steps:**
```bash
npm install react@^19.0.0 react-dom@^19.0.0
npm install -D @types/react@^19.0.0 @types/react-dom@^19.0.0
```

**Potential Breaking Changes:**
- `createRoot` is still valid
- Some third-party libraries may need updates
- Review: https://react.dev/blog/2024/12/05/react-19

---

### NT-2: Add Service Worker with Workbox (3-4 hours)
**Priority:** P2  
**Effort:** 3-4 hours  
**Impact:** Offline functionality, better caching

**Current State:** Basic service worker in main.tsx, no advanced caching

**Implementation:**
```bash
npm install -D workbox-precaching workbox-routing workbox-strategies
```

**Create Service Worker:**
```typescript
// src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Precache assets from build
precacheAndRoute(self.__WB_MANIFEST);

// Cache Supabase API responses
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Custom cache key logic
          return request.url;
        },
      },
    ],
  })
);

// Cache images with CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      {
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    ],
  })
);
```

---

### NT-3: Implement Feature Flags (2 hours)
**Priority:** P2  
**Effort:** 2 hours  
**Impact:** Safe feature rollouts, A/B testing capability

**Simple Implementation:**
```typescript
// src/lib/featureFlags.ts
const features = {
  aiCommandPalette: import.meta.env.VITE_FEATURE_AI_PALETTE === 'true',
  smartDashboard: import.meta.env.VITE_FEATURE_SMART_DASHBOARD === 'true',
  maintenanceSmart: import.meta.env.VITE_FEATURE_MAINTENANCE_SMART === 'true',
};

export function isEnabled(feature: keyof typeof features): boolean {
  return features[feature] ?? false;
}

// Usage:
import { isEnabled } from '@/lib/featureFlags';

{isEnabled('aiCommandPalette') && <AICommandPalette />}
```

---

### NT-4: Add Error Logging with Sentry Enhancements (1-2 hours)
**Priority:** P2  
**Effort:** 1-2 hours  
**Impact:** Better error visibility

**Current State:** Basic Sentry integration exists

**Enhancements:**
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Don't send PII
    if (event.exception) {
      event.exception.values?.forEach((value) => {
        if (value.stacktrace) {
          // Sanitize stacktrace
        }
      });
    }
    return event;
  },
});
```

---

### NT-5: Add Keyboard Shortcuts & Accessibility (2 hours)
**Priority:** P2  
**Effort:** 2 hours  
**Impact:** Power user features, better accessibility

**Implementation:**
```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    
    // CMD+K for command palette
    if ((e.metaKey || e.ctrlKey) && key === 'k') {
      e.preventDefault();
      shortcuts['cmd+k']?.();
    }
    
    // ESC to close modals
    if (key === 'escape') {
      shortcuts['esc']?.();
    }
    
    // Navigation shortcuts
    if (e.altKey) {
      switch (key) {
        case 'u': shortcuts['alt+u']?.(); break; // Units
        case 'r': shortcuts['alt+r']?.(); break; // Rent
        case 'm': shortcuts['alt+m']?.(); break; // Maintenance
        case 'd': shortcuts['alt+d']?.(); break; // Dashboard
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

---

## 📊 Implementation Timeline

### Week 1: Critical Fixes
| Day | Task | Effort |
|-----|------|--------|
| 1 | MH-1: Fix Memory Leaks | 30 min |
| 1 | MH-2: Code Splitting | 2 hours |
| 2 | MH-3: React.memo | 45 min |
| 2 | MH-4: useCallback | 1 hour |
| 3 | MH-5: useMemo | 45 min |
| 3 | Testing & Validation | 2 hours |

### Week 2: Modern Architecture
| Day | Task | Effort |
|-----|------|--------|
| 4-5 | SH-1: TanStack Query | 4-6 hours |
| 6 | SH-2: Split Context | 3-4 hours |
| 7 | SH-3: TypeScript Strict | 2-3 hours |

### Week 3: Testing & Quality
| Day | Task | Effort |
|-----|------|--------|
| 8 | SH-4: Testing Library | 2 hours |
| 9-10 | SH-5: Supabase Indexes | 1-2 hours |
| 11 | SH-6: Bundle Analysis | 1 hour |
| 12 | Testing & Documentation | 4 hours |

### Week 4+: Nice-to-Haves
| Task | Effort |
|------|--------|
| NT-1: React 19 Upgrade | 2-3 hours |
| NT-2: Workbox SW | 3-4 hours |
| NT-3: Feature Flags | 2 hours |
| NT-4: Sentry Enhancements | 1-2 hours |
| NT-5: Keyboard Shortcuts | 2 hours |

---

## ✅ Success Metrics

**Performance:**
- [ ] Initial bundle size < 500 KB (from 1,386 KB)
- [ ] First paint < 1s (from 2.5s)
- [ ] No memory leaks in React DevTools Profiler
- [ ] Lighthouse Performance score > 90

**Code Quality:**
- [ ] 80%+ test coverage for critical paths
- [ ] Zero TypeScript `any` usages
- [ ] No ESLint warnings
- [ ] All components have proper TypeScript interfaces

**User Experience:**
- [ ] Page transitions < 100ms perceived delay
- [ ] Real-time updates without full page refresh
- [ ] Offline functionality for viewing data
- [ ] Error recovery without data loss

---

## 🛠️ Tools & Resources

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Error Lens (shows errors inline)
- Vitest (for test runner UI)

### Essential Documentation
- [TanStack Query v5](https://tanstack.com/query/latest/docs/framework/react/overview)
- [React Patterns](https://reactpatterns.com/)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/overview)
- [Vite Features](https://vitejs.dev/guide/features.html)

### Performance Analysis
```bash
# View bundle analysis
npm run analyze

# Run Lighthouse audit (if using Chrome)
npx lighthouse https://your-app.vercel.app --view

# Check bundle size
npm run build && du -sh dist/
```

---

## 🔄 Maintenance Checklist (Ongoing)

**Weekly:**
- [ ] Review Sentry for new errors
- [ ] Check bundle size hasn't regressed
- [ ] Run tests to catch regressions

**Monthly:**
- [ ] Review and update dependencies
- [ ] Analyze build output for new warnings
- [ ] Review accessibility (axe DevTools)

**Quarterly:**
- [ ] Performance audit (Lighthouse)
- [ ] Security audit (dependency check)
- [ ] User feedback review

---

*This roadmap prioritizes practical, high-impact improvements. Focus on MUST-HAVE fixes first for immediate stability and performance gains.*
