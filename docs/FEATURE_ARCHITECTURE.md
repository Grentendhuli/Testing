# Feature-Based Architecture Guide

## Overview

We've reorganized the codebase from a flat structure to a feature-based architecture. This makes the code more maintainable, easier to navigate, and follows industry best practices.

## Directory Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts   # Barrel export
│   ├── units/         # Units management feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   └── listings/      # AI Listing Generator feature
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
├── components/        # Shared UI components (Button, Card, etc.)
├── pages/           # Page components (thin wrappers)
├── hooks/           # Shared hooks
├── services/        # Shared services
├── types/           # Shared types
└── lib/             # Utilities and configurations
```

## Benefits

1. **Co-location**: Related code lives together
2. **Clear boundaries**: Each feature is self-contained
3. **Easier navigation**: Find all auth code in one place
4. **Better scalability**: Add new features without clutter
5. **Team ownership**: Different teams can own different features

## Import Patterns

### Before (Relative Imports):
```typescript
import { Button } from '../../../components/Button';
import { useAuth } from '../../../context/AuthContext';
import type { User } from '../../../types';
```

### After (Path Aliases):
```typescript
import { Button } from '@/components/Button';
import { useAuth } from '@/features/auth';
import type { User } from '@/features/auth/types/auth.types';
```

## Result Pattern for Error Handling

### Before (Try-Catch):
```typescript
try {
  const data = await apiCall();
  return data;
} catch (error) {
  throw error;
}
```

### After (Result Pattern):
```typescript
import { Result, AsyncResult } from '@/types/result';

async function apiCall(): AsyncResult<Data, AppError> {
  try {
    const data = await fetchData();
    return Result.ok(data);
  } catch (error) {
    return Result.err(createError('FETCH_FAILED', error.message));
  }
}

// Usage:
const result = await apiCall();
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Feature Module Structure

Each feature follows this pattern:

```typescript
// features/auth/index.ts
export { useAuth, AuthProvider } from './hooks/useAuth';
export type { AuthContextType, UserData } from './types/auth.types';
export { LoginForm } from './components/LoginForm';
export { authService } from './services/authService';

// Usage in other files:
import { useAuth, LoginForm } from '@/features/auth';
```

## Migration Status

| Feature | Status | Notes |
|---------|--------|-------|
| Auth | ⏳ In Progress | Moving to features/auth/ |
| Units | ⏳ In Progress | Extracting components |
| Listings | ✅ Complete | Already in features/ structure |
| UI Components | ✅ Complete | In components/ui/ |

## Best Practices

1. **Keep features independent** — Don't import from other features
2. **Use barrel exports** — Import from feature root, not deep paths
3. **Co-locate tests** — Keep test files next to source files
4. **Shared code in common/** — Components used by multiple features
5. **Types in types/** — Each feature has its own types directory

## Next Steps

1. Complete auth feature migration
2. Complete units feature migration
3. Add feature-based linting rules
4. Document each feature's public API
5. Add integration tests per feature
