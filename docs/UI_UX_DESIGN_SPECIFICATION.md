# LandlordBot UI/UX Design Specification

**Version:** 2.0  
**Date:** March 14, 2026  
**Designer:** UX Design Lead  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Dashboard Redesign](#2-dashboard-redesign)
3. [Navigation Improvements](#3-navigation-improvements)
4. [Form & Input Improvements](#4-form--input-improvements)
5. [Loading & Empty States](#5-loading--empty-states)
6. [Feedback System](#6-feedback-system)
7. [Mobile Experience](#7-mobile-experience)
8. [Animation Specifications](#8-animation-specifications)
9. [Accessibility Guidelines](#9-accessibility-guidelines)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Design System Overview

### 1.1 Color Palette

```css
/* Primary Brand Colors */
--lb-orange: #F59E0B;           /* Primary accent - CTAs, highlights */
--lb-orange-hover: #D97706;     /* Hover state */
--lb-orange-subtle: #FEF3C7;    /* Subtle backgrounds */

/* Semantic Colors */
--lb-green: #22C55E;            /* Success, healthy state */
--lb-green-hover: #16A34A;
--lb-red: #EF4444;              /* Error, urgent state */
--lb-red-hover: #DC2626;
--lb-blue: #3B82F6;             /* Info, links */
--lb-blue-hover: #2563EB;

/* Dark Theme (Default) */
--lb-base: #0F1115;             /* Page background */
--lb-surface: #161A22;          /* Card background */
--lb-elevated: #1E2433;         /* Elevated surfaces */
--lb-border: #252D3D;           /* Borders */
--lb-muted: #2A3441;            /* Subtle backgrounds */

/* Text Colors (Dark Theme) */
--lb-text-primary: #F1F5F9;     /* Headings, primary text */
--lb-text-secondary: #94A3B8;   /* Body text */
--lb-text-muted: #64748B;        /* Captions, hints */
--lb-text-disabled: #475569;    /* Disabled text */

/* Light Theme */
--lb-base-light: #FFFFFF;
--lb-surface-light: #FAFAFA;
--lb-elevated-light: #FFFFFF;
--lb-border-light: #E2E8F0;
--lb-muted-light: #F1F5F9;

/* Text Colors (Light Theme) */
--lb-text-primary-light: #0F172A;
--lb-text-secondary-light: #334155;
--lb-text-muted-light: #64748B;
```

### 1.2 Typography Scale

```css
/* Font Families */
--font-serif: 'Fraunces', Georgia, serif;    /* Headings, brand */
--font-sans: 'Inter', system-ui, sans-serif;  /* Body, UI elements */
--font-mono: 'JetBrains Mono', monospace;   /* Code, data */

/* Type Scale */
--text-xs: 0.75rem;      /* 12px - Captions, badges */
--text-sm: 0.875rem;    /* 14px - Body small, buttons */
--text-base: 1rem;      /* 16px - Body text */
--text-lg: 1.125rem;    /* 18px - Lead text */
--text-xl: 1.25rem;     /* 20px - Small headings */
--text-2xl: 1.5rem;     /* 24px - Section headings */
--text-3xl: 1.875rem;   /* 30px - Page headings */
--text-4xl: 2.25rem;    /* 36px - Hero text */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### 1.3 Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 1.4 Border Radius Scale

```css
--radius-sm: 0.375rem;   /* 6px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - Cards */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.5rem;    /* 24px - Modals */
--radius-full: 9999px;   /* Pills, avatars */
```

### 1.5 Shadow Scale

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-glow: 0 0 20px rgba(245, 158, 11, 0.3);  /* Orange glow for CTAs */
--shadow-glow-green: 0 0 20px rgba(34, 197, 94, 0.3);
--shadow-glow-red: 0 0 20px rgba(239, 68, 68, 0.3);
```

---

## 2. Dashboard Redesign

### 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Fixed, z-50)                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Logo]  [Search Cmd+K]        [Notifications] [Profile] │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  SIDEBAR    │  MAIN CONTENT                                      │
│  (Fixed)    │  ┌─────────────────────────────────────────────┐   │
│             │  │  BREADCRUMBS: Dashboard > Units > Unit 3A   │   │
│  [Nav]      │  └─────────────────────────────────────────────┘   │
│  [Items]    │  ┌─────────────────────────────────────────────┐   │
│             │  │  WELCOME SECTION                            │   │
│  ─────────  │  │  "Good morning, Alex" + Quick actions       │   │
│  [AI        │  └─────────────────────────────────────────────┘   │
│   Features] │  ┌─────────────────────────────────────────────┐   │
│             │  │  METRICS GRID (4 cards)                     │   │
│  ─────────  │  │  [Occupancy] [Revenue] [Maintenance] [Leads]  │   │
│  [User]     │  └─────────────────────────────────────────────┘   │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │  PORTFOLIO HEALTH (Large ring)              │   │
│             │  │  + 3 sub-rings                              │   │
│             │  └─────────────────────────────────────────────┘   │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │  AI INSIGHTS (Dismissible cards)            │   │
│             │  │  [Card 1] [Card 2] [Card 3]                 │   │
│             │  └─────────────────────────────────────────────┘   │
│             │  ┌─────────────────────────────────────────────┐   │
│             │  │  RECENT ACTIVITY (Timeline)                 │   │
│             │  └─────────────────────────────────────────────┘   │
│             │                                                    │
└─────────────┴────────────────────────────────────────────────────┘
```

### 2.2 New Dashboard Components

#### 2.2.1 Welcome Section

```typescript
interface WelcomeSectionProps {
  userName: string;
  propertyCount: number;
  pendingTasks: number;
  greeting: string;  // "Good morning", "Good afternoon", etc.
}

// Visual Design:
// - Full-width card with subtle gradient background
// - Large greeting text with user name
// - Quick action chips (Add Unit, View Maintenance, etc.)
// - Weather/time context (optional)
```

**CSS Specification:**
```css
.welcome-section {
  background: linear-gradient(135deg, var(--lb-surface) 0%, var(--lb-muted) 100%);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

.welcome-greeting {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--lb-text-primary);
}

.welcome-subtitle {
  font-size: var(--text-base);
  color: var(--lb-text-secondary);
  margin-top: var(--space-2);
}

.quick-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
  flex-wrap: wrap;
}

.quick-action-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--lb-muted);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--lb-text-secondary);
  transition: all 200ms ease;
}

.quick-action-chip:hover {
  background: var(--lb-orange)/10;
  border-color: var(--lb-orange)/30;
  color: var(--lb-orange);
}
```

#### 2.2.2 Metric Cards (Redesigned)

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;      // +12, -5, etc.
    period: string;     // "vs last month"
  };
  icon: LucideIcon;
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[]; // Optional mini chart
  onClick?: () => void;
}
```

**CSS Specification:**
```css
.metric-card {
  background: var(--lb-surface);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  transition: all 200ms ease;
  cursor: pointer;
}

.metric-card:hover {
  border-color: var(--lb-orange)/30;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.metric-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.metric-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-icon-wrapper.amber { background: rgba(245, 158, 11, 0.1); color: var(--lb-orange); }
.metric-icon-wrapper.emerald { background: rgba(34, 197, 94, 0.1); color: var(--lb-green); }
.metric-icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: var(--lb-blue); }

.metric-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--lb-text-primary);
  line-height: 1;
}

.metric-change {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.metric-change.positive { color: var(--lb-green); }
.metric-change.negative { color: var(--lb-red); }
```

#### 2.2.3 Empty States

```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'units' | 'maintenance' | 'leads' | 'payments' | 'generic';
}
```

**CSS Specification:**
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  background: var(--lb-surface);
  border: 2px dashed var(--lb-border);
  border-radius: var(--radius-xl);
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  background: var(--lb-muted);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}

.empty-state-icon svg {
  width: 40px;
  height: 40px;
  color: var(--lb-text-muted);
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--lb-text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--lb-text-secondary);
  max-width: 400px;
  margin-bottom: var(--space-6);
}

.empty-state-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
```

### 2.3 Command Palette (Cmd+K)

Enhance existing `AICommandPalette` with:

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  recentCommands: Command[];
  aiSuggestions: boolean;  // Enable AI interpretation
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string;       // "⌘K", "⌘U", etc.
  category: string;
  action: () => void;
  keywords?: string[];     // For fuzzy search
}
```

**Keyboard Shortcuts:**
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Show keyboard shortcuts help |
| `Cmd/Ctrl + U` | Navigate to Units |
| `Cmd/Ctrl + R` | Navigate to Rent |
| `Cmd/Ctrl + M` | Navigate to Maintenance |
| `Cmd/Ctrl + L` | Navigate to Leads |
| `Cmd/Ctrl + B` | Navigate to Billing |
| `Cmd/Ctrl + P` | Navigate to Profile |
| `Cmd/Ctrl + Shift + F` | Global search |
| `Esc` | Close modals/palettes |
| `?` | Show help |

---

## 3. Navigation Improvements

### 3.1 Sidebar Redesign (Notion/Linear Inspired)

```
┌──────────────────────────────────────┐
│  [Logo] LandlordBot         [≡]     │  ← Collapse toggle
├──────────────────────────────────────┤
│  WORKSPACE                           │
│  ├─ Dashboard                        │
│  ├─ Units ▾                          │
│  │   ├─ All Units                    │
│  │   ├─ Unit 3A                      │
│  │   └─ Unit 4B                      │
│  ├─ Rent                             │
│  ├─ Leases                           │
│  ├─ Leads                            │
│  └─ Maintenance                      │
├──────────────────────────────────────┤
│  AI FEATURES                         │
│  ├─ Assistant                        │
│  ├─ Market Insights                  │
│  └─ Recommendations                  │
├──────────────────────────────────────┤
│  SYSTEM                              │
│  ├─ Reports                          │
│  ├─ NYC Compliance                   │
│  ├─ Settings                         │
│  └─ Billing                          │
├──────────────────────────────────────┤
│  [👤 User]                           │  ← User dropdown
│  [⚡ Pro] Upgrade                    │  ← Plan badge
└──────────────────────────────────────┘
```

**CSS Specification:**
```css
.sidebar {
  width: 260px;
  background: var(--lb-surface);
  border-right: 1px solid var(--lb-border);
  display: flex;
  flex-direction: column;
  transition: width 300ms ease;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-section {
  padding: var(--space-2) var(--space-4);
}

.sidebar-section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--lb-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--lb-text-secondary);
  font-size: var(--text-sm);
  transition: all 150ms ease;
  cursor: pointer;
}

.sidebar-item:hover {
  background: var(--lb-muted);
  color: var(--lb-text-primary);
}

.sidebar-item.active {
  background: var(--lb-orange)/10;
  color: var(--lb-orange);
}

.sidebar-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Collapsed state */
.sidebar.collapsed .sidebar-section-title,
.sidebar.collapsed .sidebar-item span {
  display: none;
}

.sidebar.collapsed .sidebar-item {
  justify-content: center;
  padding: var(--space-3);
}
```

### 3.2 Breadcrumb Navigation

```typescript
interface BreadcrumbProps {
  items: {
    label: string;
    href?: string;
    icon?: LucideIcon;
  }[];
}

// Example: Dashboard > Units > Unit 3A > Edit
```

**CSS Specification:**
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--lb-text-secondary);
}

.breadcrumb-item a {
  color: var(--lb-text-secondary);
  transition: color 150ms ease;
}

.breadcrumb-item a:hover {
  color: var(--lb-orange);
}

.breadcrumb-item:last-child {
  color: var(--lb-text-primary);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--lb-text-muted);
}
```

### 3.3 Mobile Navigation Drawer

```typescript
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  user: User;
}
```

**CSS Specification:**
```css
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 40;
  opacity: 0;
  transition: opacity 300ms ease;
}

.mobile-nav-overlay.open {
  opacity: 1;
}

.mobile-nav-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 85%;
  max-width: 320px;
  background: var(--lb-surface);
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
}

.mobile-nav-drawer.open {
  transform: translateX(0);
}

/* Bottom sheet for mobile modals */
.mobile-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--lb-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  z-index: 50;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 90vh;
  overflow-y: auto;
}

.mobile-bottom-sheet.open {
  transform: translateY(0);
}

.mobile-bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--lb-border);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto;
}
```

---

## 4. Form & Input Improvements

### 4.1 Inline Editing Pattern

```typescript
interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  validate?: (value: string) => string | null;  // Return error message or null
  type?: 'text' | 'number' | 'select' | 'date';
  options?: { label: string; value: string }[];  // For select
  placeholder?: string;
}
```

**CSS Specification:**
```css
.inline-edit {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all 150ms ease;
  cursor: pointer;
}

.inline-edit:hover {
  background: var(--lb-muted);
  border-color: var(--lb-border);
}

.inline-edit.editing {
  background: var(--lb-surface);
  border-color: var(--lb-orange);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.inline-edit-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  color: var(--lb-text-primary);
  width: 100%;
}

.inline-edit-actions {
  display: flex;
  gap: var(--space-1);
}

.inline-edit-btn {
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all 150ms ease;
}

.inline-edit-btn.save {
  color: var(--lb-green);
}

.inline-edit-btn.save:hover {
  background: rgba(34, 197, 94, 0.1);
}

.inline-edit-btn.cancel {
  color: var(--lb-text-muted);
}

.inline-edit-btn.cancel:hover {
  background: var(--lb-muted);
}
```

### 4.2 Form Field Styling

```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}
```

**CSS Specification:**
```css
.form-field {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--lb-text-primary);
  margin-bottom: var(--space-2);
}

.form-label-required::after {
  content: '*';
  color: var(--lb-red);
  margin-left: var(--space-1);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--lb-surface);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--lb-text-primary);
  transition: all 150ms ease;
}

.form-input:hover {
  border-color: var(--lb-text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--lb-orange);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-input.error {
  border-color: var(--lb-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-input:disabled {
  background: var(--lb-muted);
  color: var(--lb-text-muted);
  cursor: not-allowed;
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--lb-red);
}

.form-hint {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--lb-text-muted);
}
```

### 4.3 Auto-save Indicator

```typescript
interface AutoSaveIndicatorProps {
  status: 'saving' | 'saved' | 'error' | 'idle';
  lastSaved?: Date;
  error?: string;
}
```

**CSS Specification:**
```css
.autosave-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--lb-text-muted);
}

.autosave-indicator.saving {
  color: var(--lb-orange);
}

.autosave-indicator.saved {
  color: var(--lb-green);
}

.autosave-indicator.error {
  color: var(--lb-red);
}

.autosave-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--lb-border);
  border-top-color: var(--lb-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 5. Loading & Empty States

### 5.1 Skeleton Screens

```typescript
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}
```

**CSS Specification:**
```css
.skeleton {
  background: var(--lb-muted);
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transform: translateX(-100%);
  animation: shimmer 2s infinite;
}

.skeleton.text {
  height: 1em;
  border-radius: var(--radius-sm);
}

.skeleton.circular {
  border-radius: 50%;
}

.skeleton.rounded {
  border-radius: var(--radius-lg);
}

.skeleton.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Skeleton layouts for common patterns */
.skeleton-card {
  padding: var(--space-5);
  background: var(--lb-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--lb-border);
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.skeleton-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
```

### 5.2 Progressive Loading Pattern

```typescript
interface ProgressiveLoaderProps {
  stages: {
    label: string;
    weight: number;  // Percentage of total progress
  }[];
  currentStage: number;
  stageProgress: number;  // 0-100 within current stage
}
```

**CSS Specification:**
```css
.progressive-loader {
  padding: var(--space-6);
  text-align: center;
}

.progressive-loader-stages {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  position: relative;
}

.progressive-loader-stages::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--lb-border);
  transform: translateY(-50%);
  z-index: 0;
}

.progressive-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  z-index: 1;
}

.progressive-stage-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--lb-surface);
  border: 2px solid var(--lb-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms ease;
}

.progressive-stage.completed .progressive-stage-dot {
  background: var(--lb-green);
  border-color: var(--lb-green);
}

.progressive-stage.active .progressive-stage-dot {
  background: var(--lb-orange);
  border-color: var(--lb-orange);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
}

.progressive-stage-label {
  font-size: var(--text-xs);
  color: var(--lb-text-muted);
}

.progressive-stage.active .progressive-stage-label {
  color: var(--lb-orange);
  font-weight: var(--font-medium);
}
```

### 5.3 Error State Designs

```typescript
interface ErrorStateProps {
  title: string;
  message: string;
  code?: string;  // Error code for support
  retry?: () => void;
  alternativeAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: '404' | '500' | 'offline' | 'generic';
}
```

**CSS Specification:**
```css
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  max-width: 480px;
  margin: 0 auto;
}

.error-state-illustration {
  width: 160px;
  height: 160px;
  margin-bottom: var(--space-6);
}

.error-state-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--lb-text-muted);
  margin-bottom: var(--space-2);
}

.error-state-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--lb-text-primary);
  margin-bottom: var(--space-3);
}

.error-state-message {
  font-size: var(--text-base);
  color: var(--lb-text-secondary);
  margin-bottom: var(--space-6);
}

.error-state-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
```

---

## 6. Feedback System

### 6.1 Toast Notification System

```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;  // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

// Toast API
interface ToastAPI {
  success: (title: string, message?: string, options?: ToastOptions) => void;
  error: (title: string, message?: string, options?: ToastOptions) => void;
  warning: (title: string, message?: string, options?: ToastOptions) => void;
  info: (title: string, message?: string, options?: ToastOptions) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
}
```

**CSS Specification:**
```css
.toast-container {
  position: fixed;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
}

.toast-container.top-right {
  top: var(--space-4);
  right: var(--space-4);
}

.toast-container.bottom-right {
  bottom: var(--space-4);
  right: var(--space-4);
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--lb-surface);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 320px;
  max-width: 480px;
  pointer-events: auto;
  animation: slideInRight 300ms ease;
}

.toast.success { border-left: 4px solid var(--lb-green); }
.toast.error { border-left: 4px solid var(--lb-red); }
.toast.warning { border-left: 4px solid var(--lb-orange); }
.toast.info { border-left: 4px solid var(--lb-blue); }

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-icon.success { color: var(--lb-green); }
.toast-icon.error { color: var(--lb-red); }
.toast-icon.warning { color: var(--lb-orange); }
.toast-icon.info { color: var(--lb-blue); }

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: var(--font-semibold);
  color: var(--lb-text-primary);
  margin-bottom: var(--space-1);
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--lb-text-secondary);
}

.toast-action {
  margin-top: var(--space-2);
}

.toast-close {
  padding: var(--space-1);
  color: var(--lb-text-muted);
  border-radius: var(--radius-sm);
  transition: all 150ms ease;
}

.toast-close:hover {
  background: var(--lb-muted);
  color: var(--lb-text-primary);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: toastProgress linear forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
```

### 6.2 Confirmation Dialogs

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
}
```

**CSS Specification:**
```css
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.confirm-dialog {
  background: var(--lb-surface);
  border: 1px solid var(--lb-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  max-width: 420px;
  width: 100%;
  animation: scaleIn 200ms ease;
}

.confirm-dialog-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.confirm-dialog-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--lb-red);
}

.confirm-dialog-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--lb-orange);
}

.confirm-dialog-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--lb-text-primary);
  margin-bottom: var(--space-2);
}

.confirm-dialog-message {
  font-size: var(--text-base);
  color: var(--lb-text-secondary);
  margin-bottom: var(--space-6);
}

.confirm-dialog-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 6.3 Undo Pattern

```typescript
interface UndoableAction {
  id: string;
  type: 'delete' | 'update' | 'create';
  resource: string;
  previousState: unknown;
  timeout: number;  // ms until action becomes permanent
}

// Usage: show toast with undo button, delay actual API call
```

---

## 7. Mobile Experience

### 7.1 Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small phones */
@media (min-width: 375px) { /* iPhone SE, etc */ }

/* Phones */
@media (min-width: 640px) { /* sm breakpoint */ }

/* Tablets */
@media (min-width: 768px) { /* md breakpoint */ }

/* Small laptops */
@media (min-width: 1024px) { /* lg breakpoint */ }

/* Desktops */
@media (min-width: 1280px) { /* xl breakpoint */ }

/* Large screens */
@media (min-width: 1536px) { /* 2xl breakpoint */ }
```

### 7.2 Touch-Friendly Targets

```css
/* Minimum touch target size: 44x44px */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-3);
}

/* Button sizing for mobile */
.btn-mobile {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);  /* Prevent zoom on iOS */
}

/* Form inputs for mobile */
.input-mobile {
  padding: var(--space-4);
  font-size: 16px;  /* Prevent zoom on iOS Safari */
  min-height: 48px;
}

/* Spacing for touch */
.touch-gap {
  gap: var(--space-3);
}

/* Card padding on mobile */
.card-mobile {
  padding: var(--space-4);
}
```

### 7.3 Bottom Sheet Modals

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];  // Percentage heights [50, 75, 100]
  initialSnap?: number;   // Index of initial snap point
}
```

**CSS Specification:**
```css
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  opacity: 0;
  transition: opacity 300ms ease;
}

.bottom-sheet-overlay.open {
  opacity: 1;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--lb-surface);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  z-index: 51;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--lb-border);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto;
  flex-shrink: 0;
}

.bottom-sheet-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--lb-border);
  flex-shrink: 0;
}

.bottom-sheet-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--lb-text-primary);
}

.bottom-sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  -webkit-overflow-scrolling: touch;
}

/* Safe area for notched devices */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-sheet {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

### 7.4 Swipe Gestures

```typescript
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;  // px to trigger swipe, default 50
}

// Common patterns:
// - Swipe left on list item: reveal actions (delete, edit)
// - Swipe right on list item: mark as complete/read
// - Swipe down on modal: close
// - Swipe up on bottom sheet: expand
```

**CSS Specification:**
```css
.swipeable {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;  /* Allow vertical scroll, handle horizontal in JS */
}

.swipeable-content {
  transition: transform 200ms ease;
}

.swipeable-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}

.swipeable-actions.left {
  left: 0;
}

.swipeable-actions.right {
  right: 0;
}

.swipeable-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 100%;
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

.swipeable-action.edit {
  background: var(--lb-blue);
}

.swipeable-action.delete {
  background: var(--lb-red);
}

.swipeable-action.more {
  background: var(--lb-text-muted);
}
```

### 7.5 Mobile-Specific Patterns

```css
/* Pull to refresh indicator */
.pull-to-refresh {
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease;
}

.pull-to-refresh.visible {
  transform: translateY(60px);
}

.pull-to-refresh-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--lb-border);
  border-top-color: var(--lb-orange);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Floating action button for mobile */
.fab {
  position: fixed;
  bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  right: var(--space-4);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--lb-orange);
  color: var(--lb-base);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  z-index: 40;
  transition: all 200ms ease;
}

.fab:active {
  transform: scale(0.95);
}

/* Sticky section headers */
.sticky-header {
  position: sticky;
  top: 0;
  background: var(--lb-base);
  z-index: 10;
  padding: var(--space-3) 0;
}

/* Horizontal scroll for tabs */
.horizontal-scroll {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: var(--space-2);
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}
```

---

## 8. Animation Specifications

### 8.1 Timing Functions

```css
/* Standard easing */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Spring easing for playful elements */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Bounce easing for attention */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 8.2 Duration Scale

```css
--duration-instant: 0ms;
--duration-fast: 100ms;      /* Micro-interactions */
--duration-normal: 200ms;    /* Standard transitions */
--duration-slow: 300ms;      /* Page transitions, modals */
--duration-slower: 500ms;    /* Complex animations */
```

### 8.3 Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide in from right */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Slide in from bottom */
@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Shake (for errors) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Spin */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Ring fill animation */
@keyframes ringFill {
  from { stroke-dashoffset: 283; }
  to { stroke-dashoffset: var(--ring-offset); }
}
```

### 8.4 Stagger Animation Pattern

```css
/* For lists, cards, etc. */
.stagger-children > * {
  opacity: 0;
  animation: fadeInUp 300ms ease forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
/* Continue pattern... */
```

### 8.5 Page Transitions

```css
.page-transition-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-transition-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

.page-transition-exit {
  opacity: 1;
}

.page-transition-exit-active {
  opacity: 0;
  transition: opacity 200ms ease;
}
```

---

## 9. Accessibility Guidelines

### 9.1 Color Contrast

- **Normal text (14px+):** Minimum 4.5:1 contrast ratio
- **Large text (18px+ bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

### 9.2 Focus Indicators

```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--lb-orange);
  outline-offset: 2px;
}

/* For custom components */
.focus-ring {
  transition: box-shadow 150ms ease;
}

.focus-ring:focus-visible {
  box-shadow: 0 0 0 2px var(--lb-base), 0 0 0 4px var(--lb-orange);
}

/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--lb-orange);
  color: var(--lb-base);
  padding: var(--space-2) var(--space-4);
  z-index: 100;
  transition: top 150ms ease;
}

.skip-link:focus {
  top: 0;
}
```

### 9.3 Screen Reader Support

```typescript
// ARIA labels and roles
interface AccessibleProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  role?: string;
}

// Common patterns:
// - Use aria-label for icon-only buttons
// - Use aria-expanded for dropdowns/accordions
// - Use aria-live for dynamic content updates
// - Use aria-describedby for form field hints
// - Use role="alert" for error messages
```

### 9.4 Keyboard Navigation

```css
/* Ensure all interactive elements are keyboard accessible */
button:not(:disabled):focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:not([tabindex="-1"]):focus-visible {
  outline: 2px solid var(--lb-orange);
  outline-offset: 2px;
}

/* Tab order indicators */
[tabindex="0"] {
  cursor: pointer;
}

/* Disable focus outline for mouse users (keep for keyboard) */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 9.5 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Alternative: Respect user preference in JS */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### 9.6 ARIA Patterns

```typescript
// Modal dialog
interface ModalAriaProps {
  role: 'dialog';
  'aria-modal': true;
  'aria-labelledby': string;  // ID of title element
  'aria-describedby'?: string; // ID of description element
}

// Toast notifications
interface ToastAriaProps {
  role: 'status' | 'alert';
  'aria-live': 'polite' | 'assertive';
  'aria-atomic': true;
}

// Tabs
interface TabsAriaProps {
  role: 'tablist';
  'aria-orientation': 'horizontal';
}

interface TabAriaProps {
  role: 'tab';
  'aria-selected': boolean;
  'aria-controls': string;  // ID of tabpanel
}

// Accordion
interface AccordionAriaProps {
  role: 'region';
  'aria-expanded': boolean;
  'aria-controls': string;
}
```

---

## 10. Implementation Checklist

### 10.1 Phase 1: Foundation (Week 1)

- [ ] Update Tailwind config with new design tokens
- [ ] Create CSS custom properties file
- [ ] Implement new Button component with all variants
- [ ] Create Icon wrapper component with consistent sizing
- [ ] Set up animation utilities

### 10.2 Phase 2: Layout (Week 2)

- [ ] Redesign Sidebar with collapsible sections
- [ ] Implement Breadcrumb navigation
- [ ] Create new Header with search/command palette
- [ ] Build responsive grid system
- [ ] Implement page transition animations

### 10.3 Phase 3: Components (Week 3)

- [ ] Build MetricCard component with sparklines
- [ ] Create EmptyState component with illustrations
- [ ] Implement Skeleton screens
- [ ] Build Toast notification system
- [ ] Create Confirmation dialogs
- [ ] Implement InlineEdit component

### 10.4 Phase 4: Forms (Week 4)

- [ ] Redesign FormField wrapper
- [ ] Implement validation states
- [ ] Create AutoSaveIndicator
- [ ] Build form error handling
- [ ] Add form progress indicators

### 10.5 Phase 5: Mobile (Week 5)

- [ ] Implement BottomSheet component
- [ ] Create Swipeable list items
- [ ] Add pull-to-refresh
- [ ] Optimize touch targets
- [ ] Test on actual devices

### 10.6 Phase 6: Polish (Week 6)

- [ ] Add keyboard shortcuts
- [ ] Implement focus management
- [ ] Test screen reader compatibility
- [ ] Verify color contrast
- [ ] Add reduced motion support
- [ ] Performance optimization

---

## Appendix A: Component Status Legend

| Status | Meaning |
|--------|---------|
| 🟢 Ready | Fully designed, ready to implement |
| 🟡 Draft | Design complete, needs review |
| 🔴 Blocked | Waiting on dependencies |
| ⚪ Planned | Not yet designed |

## Appendix B: File Structure

```
src/
├── components/
│   ├── ui/                    # Primitive components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   ├── Dialog.tsx
│   │   ├── BottomSheet.tsx
│   │   └── index.ts
│   ├── layout/                # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── index.ts
│   ├── feedback/              # Feedback components
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   └── index.ts
│   ├── forms/                 # Form components
│   │   ├── FormField.tsx
│   │   ├── InlineEdit.tsx
│   │   ├── AutoSaveIndicator.tsx
│   │   └── index.ts
│   └── dashboard/             # Dashboard-specific
│       ├── MetricCard.tsx
│       ├── WelcomeSection.tsx
│       ├── AIInsightCard.tsx
│       └── index.ts
├── hooks/
│   ├── useToast.ts
│   ├── useCommandPalette.ts
│   ├── useSwipe.ts
│   └── useMediaQuery.ts
├── styles/
│   ├── design-tokens.css
│   ├── animations.css
│   └── utilities.css
└── utils/
    ├── animations.ts
    └── accessibility.ts
```

---

**Document History:**
- v1.0 - Initial design specification
- v2.0 - Added mobile experience, swipe gestures, bottom sheets

**Related Documents:**
- UPGRADE_FLOW_UX.md
- RESEARCH_REPORT.md (Auth patterns)
