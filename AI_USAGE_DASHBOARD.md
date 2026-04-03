# AI Usage Dashboard

## Overview

The AI Usage Dashboard is an admin-only feature that monitors AI requests, costs, and user tier distribution across the LandlordBot platform.

## Components

### AdminAIUsage.tsx
Located in `src/pages/AdminAIUsage.tsx`

**Features:**
- **Overview Cards**: Total requests, tier breakdown, estimated costs, peak usage hour
- **Usage Alerts**: Visual indicators for users approaching limits (red/yellow/green)
- **Charts**: Line chart (30-day history), bar chart (by tier), pie chart (distribution)
- **User Activity Table**: Top 10 users by request count with tier filtering

### Access Control

**Admin Route Protection:**
Routes under `/admin/*` are protected by the `AdminRoute` component in `App.tsx`:

```typescript
const isAdmin = userData?.role === 'admin' || userData?.email?.endsWith('@landlordbot.com');
```

**Sidebar Navigation:**
The "AI Usage" menu item only appears for admin users, checked in `Sidebar.tsx`:
- Desktop: Admin section appears after "Advanced" section
- Mobile: Admin section appears after "Advanced" section in the drawer

## Data Sources

### Supabase Tables (Future Implementation)

**Table: `ai_usage`**
- `user_id` - User identifier
- `date` - Date of usage
- `requests_used` - Number of requests made
- `tier` - User's subscription tier (free/pro/concierge)
- `peak_hour` - Hour with highest activity

**Table: `ai_usage_daily`**
- `date` - Date
- `total_requests` - Total requests across all users
- `free_requests` - Free tier requests
- `pro_requests` - Pro tier requests
- `concierge_requests` - Concierge tier requests

### Mock Data (Current)
The dashboard falls back to mock data if the database tables don't exist:
- 1247 total requests
- Tier distribution: 892 Free, 340 Pro, 15 Concierge
- 30 days of randomized historical data
- 10 sample users with varying usage levels

## Pricing

**Gemini Model:**
- Input: $0.000125 per 1,000 tokens
- Average request estimate: ~2,000 tokens
- Cost per request: ~$0.00025

## Tier Limits

| Tier | Daily Limit |
|------|-------------|
| Free | 50 requests |
| Pro | 500 requests |
| Concierge | 1,000 requests |

## Alert Thresholds

- **Red/Critical**: Users at 90%+ of their tier limit
- **Yellow/Warning**: Users at 80-89% of their tier limit
- **Green/Normal**: Users below 80% of their tier limit

## Usage

1. Admins access the dashboard via the "AI Usage" link in the sidebar
2. The date picker allows viewing historical data
3. Tier filter allows focusing on specific user segments
4. Charts update dynamically based on selected date range

## Setup Instructions

1. Navigate to `/admin/ai-usage` as an admin user
2. By default, the dashboard shows mock data
3. To enable real-time data:
   - Create `ai_usage` table in Supabase
   - Create `ai_usage_daily` table for historical data
   - The component will automatically query these tables

## Mobile Responsive

The dashboard is fully responsive:
- Cards stack vertically on mobile
- Tables are horizontally scrollable
- Charts maintain aspect ratio
- Filters collapse appropriately

## Dependencies

- `recharts` - For charts and visualizations
- `lucide-react` - For icons
- `framer-motion` - For animations
- `@supabase/supabase-js` - For data fetching
