# useAutosave Hook - Usage Examples

## Basic Usage in a Form Component

```typescript
import { useState, useCallback } from 'react';
import { useAutosave } from '@/hooks';
import { useToast } from '@/components/ui/Toast';

interface UnitFormData {
  address: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
}

export function useUnitForm(unitId?: string) {
  const initialData: UnitFormData = {
    address: '',
    unitNumber: '',
    bedrooms: 0,
    bathrooms: 0,
    monthlyRent: 0,
  };

  const [formData, setFormData] = useState<UnitFormData>(initialData);
  const { showSuccess } = useToast();

  // Setup autosave with a unique key per unit
  const { clearAutosave, saveNow } = useAutosave<UnitFormData>({
    key: unitId ? `unit-${unitId}` : 'unit-new',
    data: formData,
    onRestore: (restoredData) => {
      setFormData(restoredData);
    },
    enabled: true,
    debounceMs: 2000, // Save 2 seconds after typing stops
  });

  // Handle field changes
  const handleChange = useCallback((field: keyof UnitFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      // Submit to API...
      await api.saveUnit(formData);
      
      // Clear autosave on successful submit
      clearAutosave();
      showSuccess('Unit saved successfully');
    } catch (error) {
      // Error handling...
    }
  }, [formData, clearAutosave, showSuccess]);

  return {
    formData,
    handleChange,
    handleSubmit,
    saveNow, // Manual save trigger
  };
}
```

## With Lease Form

```typescript
import { useAutosave } from '@/hooks';

interface LeaseFormData {
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
}

export function LeaseForm({ leaseId }: { leaseId?: string }) {
  const [formData, setFormData] = useState<LeaseFormData>({
    tenantName: '',
    startDate: '',
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
  });

  // Autosave hook - will restore data if page refreshes/navigates away
  const { clearAutosave } = useAutosave<LeaseFormData>({
    key: leaseId ? `lease-${leaseId}` : 'lease-new',
    data: formData,
    onRestore: (data) => {
      setFormData(data);
    },
  });

  const handleSubmit = async () => {
    await saveLease(formData);
    clearAutosave(); // Clear after successful save
  };

  // Rest of component...
}
```

## With Lead Form

```typescript
import { useAutosave } from '@/hooks';

interface LeadFormData {
  prospectName: string;
  phone: string;
  email: string;
  notes: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

export function LeadForm({ leadId }: { leadId?: string }) {
  const [formData, setFormData] = useState<LeadFormData>({
    prospectName: '',
    phone: '',
    email: '',
    notes: '',
    status: 'new',
  });

  // Autosave hook
  const { clearAutosave, hasAutosave } = useAutosave<LeadFormData>({
    key: leadId ? `lead-${leadId}` : 'lead-new',
    data: formData,
    onRestore: setFormData,
    debounceMs: 3000, // 3 second debounce
  });

  // Show restore notification if there's autosaved data
  const restoreNotice = hasAutosave() ? 'Previous draft restored' : null;

  const handleSubmit = async () => {
    await saveLead(formData);
    clearAutosave();
  };

  // Rest of component...
}
```

## Important Notes

1. **Unique Keys**: Always use unique keys per form instance. Include IDs for edit mode:
   - New item: `'unit-new'`, `'lease-new'`
   - Edit item: `'unit-${unitId}'`, `'lease-${leaseId}'`

2. **Clear After Save**: Always call `clearAutosave()` after successful form submission

3. **Versioning**: Data is versioned. If the version changes, old drafts are auto-cleared

4. **Session Storage**: Data persists per tab only. Closing the tab clears the draft

5. **24 Hour Limit**: Drafts older than 24 hours are automatically cleared on restore

6. **Logout Cleanup**: All autosaved data is cleared when user logs out

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | required | Unique identifier for this form |
| `data` | `T` | required | Current form data to autosave |
| `onRestore` | `(data: T) => void` | undefined | Called when restored data is found |
| `enabled` | `boolean` | true | Enable/disable autosave |
| `debounceMs` | `number` | 1000 | Milliseconds to wait before saving |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `clearAutosave` | `(showNotification?: boolean) => void` | Clear saved data |
| `hasAutosave` | `() => boolean` | Check if data exists |
| `getAutosaveInfo` | `() => { timestamp, age } | null` | Get metadata |
| `saveNow` | `() => void` | Trigger immediate save |
| `restored` | `boolean` | Whether data was restored |

## Utility Function

```typescript
import { clearAllAutosaves } from '@/hooks';

// Clear all autosaved data (e.g., on logout)
clearAllAutosaves();

// Clear only unit-related autosaves
clearAllAutosaves('unit-');
```