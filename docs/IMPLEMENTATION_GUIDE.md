# LandlordBot UI/UX Implementation Guide

**Version:** 1.0  
**Date:** March 14, 2026  
**Status:** Ready for Development

---

## Quick Start

### 1. Install Dependencies

```bash
# Animation library (if not already installed)
npm install framer-motion

# Utility for className merging
npm install clsx tailwind-merge
```

### 2. Create Utility Function

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Import Styles

Add to your main entry file (e.g., `src/main.tsx`):

```typescript
import './styles/design-tokens.css';
import './styles/animations.css';
```

### 4. Wrap App with Providers

```tsx
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <YourApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
```

---

## Component Usage Examples

### Toast Notifications

```tsx
import { useToast } from './components/ui/Toast';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Unit created', 'Unit 3A has been added to your portfolio');
  };

  const handleError = () => {
    toast.error('Failed to save', 'Please check your connection and try again');
  };

  const handleAsync = async () => {
    await toast.promise(
      fetch('/api/units'),
      {
        loading: 'Loading units...',
        success: 'Units loaded successfully',
        error: 'Failed to load units',
      }
    );
  };

  return (
    <button onClick={handleSuccess}>Show Success</button>
  );
}
```

### Metric Cards

```tsx
import { MetricCard, MetricGrid } from './components/ui/MetricCard';
import { Building2, DollarSign, Wrench, Users } from 'lucide-react';

function Dashboard() {
  return (
    <MetricGrid columns={4}>
      <MetricCard
        title="Total Units"
        value={12}
        change={{ value: 20, period: 'vs last month' }}
        icon={Building2}
        color="amber"
        onClick={() => navigate('/units')}
      />
      
      <MetricCard
        title="Monthly Revenue"
        value="$24,500"
        change={{ value: 8.5, period: 'vs last month' }}
        icon={DollarSign}
        color="emerald"
      />
      
      <MetricCard
        title="Pending Maintenance"
        value={3}
        icon={Wrench}
        color="blue"
      />
      
      <MetricCard
        title="New Leads"
        value={8}
        change={{ value: -12, period: 'vs last week' }}
        icon={Users}
        color="purple"
      />
    </MetricGrid>
  );
}
```

### Empty States

```tsx
import { EmptyState, EmptyUnits, EmptyMaintenance } from './components/ui/EmptyState';

function UnitsPage({ units }) {
  if (units.length === 0) {
    return (
      <EmptyUnits
        action={{
          label: 'Add your first unit',
          onClick: () => openAddUnitModal(),
        }}
      />
    );
  }

  return <UnitsList units={units} />;
}
```

### Skeleton Loading

```tsx
import { Skeleton, SkeletonCard, SkeletonDashboard } from './components/ui/Skeleton';

function Dashboard() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return <DashboardContent data={data} />;
}

// Or use individual skeletons
function CustomLoading() {
  return (
    <div className="space-y-4">
      <Skeleton width={200} height={32} />
      <div className="flex gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonList count={5} />
    </div>
  );
}
```

### Cards

```tsx
import { Card } from './components/ui/Card';

function Example() {
  return (
    <Card variant="elevated" padding="lg" hover>
      <Card.Header
        title={<Card.Title>Card Title</Card.Title>}
        description={<Card.Description>Card description text</Card.Description>}
        action={<Button variant="ghost">Edit</Button>}
      />
      
      <Card.Content>
        Content goes here
      </Card.Content>
      
      <Card.Footer>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </Card.Footer>
    </Card>
  );
}
```

---

## CSS Custom Properties Reference

### Colors

```css
/* Brand */
var(--lb-orange)           /* Primary accent */
var(--lb-orange-hover)     /* Hover state */
var(--lb-orange-subtle)    /* Subtle backgrounds */

/* Semantic */
var(--lb-green)            /* Success */
var(--lb-red)              /* Error */
var(--lb-blue)             /* Info */
var(--lb-purple)           /* Accent */

/* Surfaces (Dark) */
var(--lb-base)             /* Page background */
var(--lb-surface)          /* Card background */
var(--lb-elevated)         /* Elevated surfaces */
var(--lb-border)           /* Borders */
var(--lb-muted)            /* Subtle backgrounds */

/* Text (Dark) */
var(--lb-text-primary)     /* Headings */
var(--lb-text-secondary)   /* Body text */
var(--lb-text-muted)       /* Captions */
var(--lb-text-disabled)    /* Disabled */
```

### Typography

```css
var(--font-serif)          /* Fraunces - Headings */
var(--font-sans)           /* Inter - Body */
var(--font-mono)           /* JetBrains Mono - Code */

var(--text-xs)             /* 12px */
var(--text-sm)             /* 14px */
var(--text-base)           /* 16px */
var(--text-lg)             /* 18px */
var(--text-xl)             /* 20px */
var(--text-2xl)            /* 24px */
var(--text-3xl)            /* 30px */
var(--text-4xl)            /* 36px */
```

### Spacing

```css
var(--space-1)             /* 4px */
var(--space-2)             /* 8px */
var(--space-3)             /* 12px */
var(--space-4)             /* 16px */
var(--space-6)             /* 24px */
var(--space-8)             /* 32px */
var(--space-12)            /* 48px */
```

### Border Radius

```css
var(--radius-sm)           /* 6px */
var(--radius-md)           /* 8px */
var(--radius-lg)           /* 12px */
var(--radius-xl)           /* 16px */
var(--radius-2xl)          /* 24px */
var(--radius-full)         /* 9999px */
```

### Shadows

```css
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
var(--shadow-glow)         /* Orange glow */
var(--shadow-glow-green)
var(--shadow-glow-red)
```

---

## Animation Classes

### Preset Animations

```html
<!-- Fade in from bottom -->
<div class="animate-fade-in-up">Content</div>

<!-- Scale in with spring -->
<div class="animate-scale-in">Modal</div>

<!-- Slide in from right -->
<div class="animate-slide-in-right">Toast</div>

<!-- Pulse for loading -->
<div class="animate-pulse">Loading...</div>

<!-- Bounce for attention -->
<div class="animate-bounce">Notification</div>

<!-- Shake for errors -->
<div class="animate-shake">Error</div>
```

### Stagger Animations

```html
<!-- Children animate in sequence -->
<ul class="stagger-children">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Hover Effects

```html
<!-- Lift on hover -->
<div class="hover-lift">Card</div>

<!-- Scale on hover -->
<div class="hover-scale">Button</div>

<!-- Glow on hover -->
<div class="hover-glow">CTA</div>
```

---

## Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Usage Examples

```tsx
<!-- Responsive grid -->
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

<!-- Responsive padding -->
<div className="p-4 md:p-6 lg:p-8">Content</div>

<!-- Responsive text -->
<h1 className="text-xl md:text-2xl lg:text-3xl">Title</h1>

<!-- Hide on mobile -->
<div className="hidden md:block">Desktop only</div>

<!-- Show only on mobile -->
<div className="md:hidden">Mobile only</div>
```

---

## Accessibility Guidelines

### Focus Management

```tsx
<!-- Visible focus ring -->
<button className="focus:outline-none focus:ring-2 focus:ring-lb-orange focus:ring-offset-2">
  Click me
</button>

<!-- Skip link for keyboard users -->
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### ARIA Labels

```tsx
<!-- Icon-only buttons -->
<button aria-label="Close dialog">
  <XIcon />
</button>

<!-- Live regions for updates -->
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>

<!-- Expanded state -->
<button aria-expanded={isOpen}>
  Toggle
</button>
```

### Reduced Motion

```tsx
import { motion } from 'framer-motion';

function AnimatedComponent() {
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

---

## Mobile-Specific Patterns

### Touch Targets

```css
<!-- Minimum 44x44px touch target -->
<button className="min-w-[44px] min-h-[44px] p-3">
  <Icon />
</button>

<!-- Prevent zoom on iOS -->
<input className="text-base" />
```

### Bottom Sheet

```tsx
import { BottomSheet } from './components/ui/BottomSheet';

function MobileModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Option"
      >
        <div className="p-4 space-y-2">
          <button className="w-full p-4 text-left rounded-lg hover:bg-lb-muted">
            Option 1
          </button>
          <button className="w-full p-4 text-left rounded-lg hover:bg-lb-muted">
            Option 2
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
```

### Swipeable List Items

```tsx
import { useSwipe } from './hooks/useSwipe';

function SwipeableItem({ item, onDelete, onEdit }) {
  const { handlers, offset } = useSwipe({
    onSwipeLeft: onDelete,
    onSwipeRight: onEdit,
  });

  return (
    <div className="relative overflow-hidden">
      <!-- Background actions -->
      <div className="absolute inset-0 flex justify-between items-center px-4">
        <button className="text-lb-blue">Edit</button>
        <button className="text-lb-red">Delete</button>
      </div>
      
      <!-- Foreground content -->
      <div
        {...handlers}
        style={{ transform: `translateX(${offset}px)` }}
        className="relative bg-lb-surface p-4 transition-transform"
      >
        {item.name}
      </div>
    </div>
  );
}
```

---

## Keyboard Shortcuts

### Global Shortcuts

```tsx
import { useEffect } from 'react';

function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      
      // Cmd/Ctrl + / - Keyboard shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        showShortcutsHelp();
      }
      
      // Navigation shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
        e.preventDefault();
        navigate('/units');
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        navigate('/rent');
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        navigate('/maintenance');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

---

## Testing Checklist

### Visual

- [ ] Components render correctly in dark mode
- [ ] Components render correctly in light mode
- [ ] Animations work smoothly
- [ ] No layout shifts during loading
- [ ] Empty states display correctly

### Responsive

- [ ] Layout adapts to mobile (320px+)
- [ ] Layout adapts to tablet (768px+)
- [ ] Layout adapts to desktop (1024px+)
- [ ] Touch targets are minimum 44px
- [ ] Text is readable at all sizes

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] Screen reader announces correctly
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Reduced motion is respected

### Performance

- [ ] No unnecessary re-renders
- [ ] Images are optimized
- [ ] Animations use GPU acceleration
- [ ] Bundle size is reasonable

---

## Migration Guide

### From Old Components

1. **Buttons**
   ```diff
   - <button className="btn-primary">
   + <Button variant="primary">
   ```

2. **Cards**
   ```diff
   - <div className="card">
   + <Card variant="default">
   ```

3. **Loading States**
   ```diff
   - <div className="loading-spinner">
   + <Skeleton variant="text" />
   ```

4. **Notifications**
   ```diff
   - alert('Success!')
   + toast.success('Success!')
   ```

---

## Resources

- [Design Spec](./UI_UX_DESIGN_SPECIFICATION.md)
- [Tailwind Config](../tailwind.config.js)
- [Component Examples](./examples/)

---

**Questions?** Refer to the full design specification or contact the UX team.
