# LandlordBot Subscription Architecture Design

**Version:** 1.0  
**Date:** March 14, 2026  
**Status:** Design Complete - Ready for Implementation

---

## 1. Overview

This document outlines the complete subscription and payment system for LandlordBot, built with Stripe and Supabase.

### Key Requirements (NON-NEGOTIABLE)

| Requirement | Implementation |
|-------------|----------------|
| **NO automatic upgrades** | User must click "Upgrade" and complete checkout |
| **Clear opt-in flow** | Modal with pricing → Checkout → Success → Features unlocked |
| **Free tier truly free** | Indefinite, no credit card required |
| **Billing only after explicit auth** | Stripe charges only after checkout completion |
| **No trial-to-paid auto-conversion** | No automatic billing - user must opt-in |

---

## 2. Database Schema

### 2.1 Core Tables

#### 2.1.1 subscription_plans (Configuration Table)
```sql
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,      -- Stripe Price ID (e.g., price_123abc)
  stripe_product_id text NOT NULL,           -- Stripe Product ID
  name text NOT NULL,                         -- Display name (e.g., "Pro Plan")
  slug text UNIQUE NOT NULL,                  -- URL-friendly (e.g., "pro")
  description text,
  tier text NOT NULL,                         -- 'free' | 'starter' | 'pro' | 'enterprise'
  billing_interval text NOT NULL,             -- 'month' | 'year'
  price_amount integer NOT NULL,              -- Amount in cents (e.g., 2900 = $29.00)
  currency text DEFAULT 'usd',
  
  -- Feature limits (null = unlimited)
  max_units integer,                          -- null = unlimited
  max_properties integer,
  max_ai_requests_daily integer,              -- override default
  storage_limit_gb integer,
  
  -- Feature flags (JSON for extensibility)
  features jsonb DEFAULT '{}'::jsonb,         -- { "api_access": true, "priority_support": true }
  
  -- Metadata
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable" ON subscription_plans
  FOR SELECT USING (true);

-- Insert default plans
INSERT INTO subscription_plans (
  stripe_price_id, stripe_product_id, name, slug, tier, billing_interval,
  price_amount, max_units, max_ai_requests_daily, storage_limit_gb, features
) VALUES
-- Free tier (no Stripe IDs needed)
('free', 'free_product', 'Free', 'free', 'free', 'month', 0, 3, 20, 1, 
 '{"basic_analytics": true, "email_support": false, "api_access": false}'::jsonb),

-- Paid plans (update with actual Stripe IDs after setup)
('price_starter_monthly', 'prod_starter', 'Starter', 'starter', 'starter', 'month', 1500, 10, 50, 10,
 '{"basic_analytics": true, "email_support": true, "api_access": false}'::jsonb),

('price_starter_yearly', 'prod_starter', 'Starter', 'starter-yearly', 'starter', 'year', 14400, 10, 50, 10,
 '{"basic_analytics": true, "email_support": true, "api_access": false}'::jsonb),

('price_pro_monthly', 'prod_pro', 'Pro', 'pro', 'pro', 'month', 2900, null, 100, 50,
 '{"advanced_analytics": true, "priority_support": true, "api_access": true, "custom_integrations": false}'::jsonb),

('price_pro_yearly', 'prod_pro', 'Pro', 'pro-yearly', 'pro', 'year', 27800, null, 100, 50,
 '{"advanced_analytics": true, "priority_support": true, "api_access": true, "custom_integrations": false}'::jsonb),

('price_enterprise_monthly', 'prod_enterprise', 'Enterprise', 'enterprise', 'enterprise', 'month', 9900, null, null, 500,
 '{"everything_in_pro": true, "dedicated_support": true, "sla": true, "custom_development": true}'::jsonb);
```

#### 2.1.2 subscriptions (User Subscription Records)
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  
  -- Stripe IDs
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text NOT NULL,
  
  -- Subscription State
  status text NOT NULL DEFAULT 'incomplete', -- see state machine below
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,
  
  -- Trial (if we add trials later)
  trial_start timestamptz,
  trial_end timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (false) WITH CHECK (false); -- Only via service role
```

#### 2.1.3 payment_methods
```sql
CREATE TABLE payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Stripe IDs
  stripe_payment_method_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  
  -- Card details (safe to store)
  card_brand text,              -- "visa", "mastercard", etc.
  card_last4 text,              -- "4242"
  card_exp_month integer,
  card_exp_year integer,
  
  -- Status
  is_default boolean DEFAULT false,
  is_valid boolean DEFAULT true,  -- becomes false if payment fails
  
  -- Metadata
  billing_details jsonb,        -- { name, email, phone, address }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_pm_id ON payment_methods(stripe_payment_method_id);

-- Ensure only one default per user
CREATE UNIQUE INDEX idx_payment_methods_one_default_per_user 
  ON payment_methods(user_id) WHERE is_default = true;

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);
```

#### 2.1.4 invoices
```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe IDs
  stripe_invoice_id text UNIQUE NOT NULL,
  stripe_charge_id text,
  
  -- Invoice Details
  status text NOT NULL,         -- 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount_due integer NOT NULL,    -- cents
  amount_paid integer DEFAULT 0,
  currency text DEFAULT 'usd',
  
  -- Line Items (JSON array of Stripe line items)
  line_items jsonb DEFAULT '[]'::jsonb,
  
  -- Dates
  invoice_date timestamptz NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  
  -- URLs
  pdf_url text,
  hosted_invoice_url text,
  
  -- Failure tracking
  attempt_count integer DEFAULT 0,
  next_payment_attempt timestamptz,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);
```

#### 2.1.5 subscription_events (Audit Log)
```sql
CREATE TABLE subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type text NOT NULL,     -- 'subscription_created' | 'payment_succeeded' | etc.
  stripe_event_id text UNIQUE,  -- Stripe event ID for idempotency
  
  -- Payload
  data jsonb NOT NULL,          -- Full event payload
  processed boolean DEFAULT false,
  
  -- Metadata
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created ON subscription_events(created_at DESC);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);

-- RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON subscription_events
  FOR SELECT USING (auth.uid() = user_id);
```

### 2.2 Updated users table
```sql
-- Add/update subscription-related columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  subscription_tier text DEFAULT 'free' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  subscription_status text DEFAULT 'active' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  current_subscription_id uuid REFERENCES subscriptions(id);

-- Stripe customer ID for easy lookup
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  stripe_customer_id text UNIQUE;

-- Feature flags (cached for performance - synced from subscription)
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  features_cache jsonb DEFAULT '{}'::jsonb;

-- Indexes
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

---

## 3. Stripe Integration Design

### 3.1 Stripe Product Configuration

#### Products Setup (in Stripe Dashboard)

```
Product: LandlordBot Pro
├── Price: Pro Monthly ($29/month) → price_pro_monthly
├── Price: Pro Yearly ($278/year - 20% off) → price_pro_yearly
└── Features: Unlimited units, 100 AI requests/day, API access, Priority support

Product: LandlordBot Starter
├── Price: Starter Monthly ($15/month) → price_starter_monthly  
├── Price: Starter Yearly ($144/year - 20% off) → price_starter_yearly
└── Features: 10 units, 50 AI requests/day, Email support

Product: LandlordBot Enterprise
├── Price: Enterprise Monthly ($99/month) → price_enterprise_monthly
└── Features: Everything in Pro + dedicated support, SLA
```

#### Stripe Webhook Endpoints

**Environment URLs:**
- Production: `https://landlord-bot-live.vercel.app/api/webhooks/stripe`
- Staging: `https://landlord-bot-staging.vercel.app/api/webhooks/stripe`
- Local: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`

**Webhook Secret:** Store in `STRIPE_WEBHOOK_SECRET` env variable

### 3.2 Checkout Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Upgrade" on pricing page                   │
│     ↓                                                       │
│  2. Show upgrade confirmation modal                         │
│     - Clear pricing disclosure                              │
│     - "You will be charged $29/month"                       │
│     - "Cancel anytime"                                      │
│     - [Start Subscription] button                           │
│     ↓                                                       │
│  3. POST /api/subscriptions/create                          │
│     Body: { planId: "pro-monthly", returnUrl: "..." }       │
│     ↓                                                       │
│  4. Backend creates Stripe Checkout Session                 │
│     - mode: 'subscription'                                  │
│     - customer_email: user.email                            │
│     - line_items: [{ price: plan.stripe_price_id }]        │
│     - success_url: /subscription/success?session_id={CHECKOUT_SESSION_ID}
│     - cancel_url: /pricing?canceled=true                    │
│     ↓                                                       │
│  5. Return { sessionId, url } to frontend                   │
│     ↓                                                       │
│  6. Frontend redirects to Stripe Checkout                   │
│     ↓                                                       │
│  7. User completes payment on Stripe hosted page            │
│     ↓                                                       │
│  8. Stripe redirects to success_url                         │
│     ↓                                                       │
│  9. Frontend calls POST /api/subscriptions/verify           │
│     Body: { sessionId: "..." }                              │
│     ↓                                                       │
│  10. Backend verifies session, creates subscription record   │
│     ↓                                                       │
│  11. Redirect to /dashboard with success toast              │
│      - "Welcome to Pro! Your features are now unlocked."   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Webhook Handler Design

#### Webhook Endpoint: `/api/webhooks/stripe`

**Security:**
```typescript
// Verify webhook signature
const signature = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

#### Event Handlers

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Create subscription record, update user tier |
| `invoice.payment_succeeded` | `handleInvoicePaid` | Create invoice record, update subscription dates |
| `invoice.payment_failed` | `handleInvoiceFailed` | Update subscription to past_due, notify user |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Sync status, dates, cancel_at_period_end |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Mark as canceled, downgrade to free |
| `payment_method.attached` | `handlePaymentMethodAttached` | Save card details |
| `payment_method.detached` | `handlePaymentMethodDetached` | Remove from database |

#### Handler Pseudocode

```typescript
// checkout.session.completed
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Idempotency check
  const existing = await db.subscriptions.findByStripeSession(session.id);
  if (existing) return { received: true, ignored: 'already processed' };
  
  // Get subscription details from Stripe
  const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
  const customer = await stripe.customers.retrieve(session.customer as string);
  
  // Get plan from our database
  const plan = await db.plans.findByStripePriceId(session.line_items.data[0].price.id);
  
  // Create subscription record
  const subscription = await db.subscriptions.create({
    user_id: session.metadata.userId,
    plan_id: plan.id,
    stripe_customer_id: customer.id,
    stripe_subscription_id: stripeSub.id,
    stripe_price_id: plan.stripe_price_id,
    status: 'active',
    current_period_start: new Date(stripeSub.current_period_start * 1000),
    current_period_end: new Date(stripeSub.current_period_end * 1000),
  });
  
  // Update user
  await db.users.update(session.metadata.userId, {
    subscription_tier: plan.tier,
    subscription_status: 'active',
    current_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
  });
  
  // Log event
  await db.subscription_events.create({
    user_id: session.metadata.userId,
    subscription_id: subscription.id,
    event_type: 'subscription_created',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  // Send welcome email
  await sendEmail(session.metadata.userId, 'subscription_welcome', { plan: plan.name });
}

// invoice.payment_failed
async function handleInvoiceFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const subscription = await db.subscriptions.findByStripeSubscriptionId(
    invoice.subscription as string
  );
  
  // Update subscription status
  await db.subscriptions.update(subscription.id, {
    status: 'past_due',
  });
  
  // Create invoice record
  await db.invoices.create({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    status: 'open',
    amount_due: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt 
      ? new Date(invoice.next_payment_attempt * 1000) 
      : null,
  });
  
  // Notify user
  await sendEmail(subscription.user_id, 'payment_failed', {
    amount: invoice.amount_due,
    retryDate: invoice.next_payment_attempt,
  });
}

// customer.subscription.deleted
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripeSub = event.data.object as Stripe.Subscription;
  
  const subscription = await db.subscriptions.findByStripeSubscriptionId(stripeSub.id);
  
  // Mark as canceled
  await db.subscriptions.update(subscription.id, {
    status: 'canceled',
    canceled_at: new Date(),
    ended_at: new Date(stripeSub.ended_at * 1000),
  });
  
  // Downgrade user to free
  await db.users.update(subscription.user_id, {
    subscription_tier: 'free',
    subscription_status: 'active',
    current_subscription_id: null,
    features_cache: {},
  });
  
  // Send cancellation email
  await sendEmail(subscription.user_id, 'subscription_canceled');
}
```

### 3.4 Customer Portal Integration

**Stripe Customer Portal:** Pre-built UI for subscription management

```typescript
// Generate portal session
async function createPortalSession(userId: string) {
  const user = await db.users.findById(userId);
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.APP_URL}/settings/billing`,
  });
  
  return { url: portalSession.url };
}
```

**Portal Configuration (Stripe Dashboard):**
- Allow customers to: Update payment methods, view invoices, cancel subscriptions
- Do NOT allow: Switch plans (we handle this in-app for better UX)

---

## 4. API Endpoints Design

### 4.1 Base URL
- Production: `https://landlord-bot-live.vercel.app/api`
- Local: `http://localhost:5173/api`

### 4.2 Authentication
All endpoints require Bearer token: `Authorization: Bearer <supabase-jwt>`

### 4.3 Endpoints

#### GET /api/plans
**Description:** Get available subscription plans

**Auth:** None (public)

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Starter",
      "slug": "starter",
      "tier": "starter",
      "description": "Perfect for small landlords",
      "price": {
        "monthly": { "amount": 1500, "currency": "usd", "stripePriceId": "price_xxx" },
        "yearly": { "amount": 14400, "currency": "usd", "stripePriceId": "price_yyy", "savings": "20%" }
      },
      "features": {
        "maxUnits": 10,
        "maxAIRequests": 50,
        "storageGB": 10,
        "includes": ["Email support", "Basic analytics"]
      },
      "highlighted": false
    }
  ]
}
```

---

#### POST /api/subscriptions
**Description:** Create a new subscription checkout session

**Auth:** Required

**Request:**
```json
{
  "planId": "uuid",
  "billingInterval": "month" | "year",
  "returnUrl": "https://landlord-bot-live.vercel.app/dashboard"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxx",
  "expiresAt": "2026-03-14T15:00:00Z"
}
```

**Errors:**
- `400` - Invalid plan or already subscribed
- `409` - Active subscription exists (must update instead)

---

#### POST /api/subscriptions/verify
**Description:** Verify checkout session and activate subscription

**Auth:** Required

**Request:**
```json
{
  "sessionId": "cs_test_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": { "name": "Pro", "tier": "pro" },
    "currentPeriodEnd": "2026-04-14T12:00:00Z"
  }
}
```

---

#### GET /api/subscriptions/current
**Description:** Get current user's subscription

**Auth:** Required

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": { "name": "Pro", "tier": "pro" },
    "currentPeriodStart": "2026-03-14T12:00:00Z",
    "currentPeriodEnd": "2026-04-14T12:00:00Z",
    "cancelAtPeriodEnd": false,
    "paymentMethod": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2027
    },
    "features": {
      "maxUnits": null,
      "maxAIRequests": 100,
      "storageGB": 50
    }
  }
}
```

---

#### PATCH /api/subscriptions
**Description:** Update subscription (upgrade/downgrade)

**Auth:** Required

**Request:**
```json
{
  "planId": "uuid",
  "billingInterval": "month" | "year"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan": { "name": "Starter", "tier": "starter" },
    "proration": {
      "amount": -1450,
      "currency": "usd",
      "description": "Credit applied for unused time"
    },
    "nextInvoice": "2026-04-14T12:00:00Z"
  }
}
```

---

#### DELETE /api/subscriptions
**Description:** Cancel subscription (sets cancel_at_period_end)

**Auth:** Required

**Request:**
```json
{
  "immediate": false  // if true, cancel immediately with refund
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your subscription will cancel on April 14, 2026",
  "cancelAt": "2026-04-14T12:00:00Z"
}
```

---

#### GET /api/invoices
**Description:** Get billing history

**Auth:** Required

**Query:**
- `?page=1&limit=20`
- `?status=paid` | `open` | `failed`

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "stripeInvoiceId": "in_xxx",
      "status": "paid",
      "amountDue": 2900,
      "amountPaid": 2900,
      "currency": "usd",
      "invoiceDate": "2026-03-14T12:00:00Z",
      "dueDate": "2026-03-14T12:00:00Z",
      "paidAt": "2026-03-14T12:05:00Z",
      "pdfUrl": "https://pay.stripe.com/invoice/.../pdf",
      "hostedInvoiceUrl": "https://invoice.stripe.com/...",
      "lineItems": [
        { "description": "LandlordBot Pro (Monthly)", "amount": 2900 }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5 }
}
```

---

#### GET /api/invoices/upcoming
**Description:** Get upcoming invoice preview

**Auth:** Required

**Response:**
```json
{
  "upcomingInvoice": {
    "amountDue": 2900,
    "currency": "usd",
    "invoiceDate": "2026-04-14T12:00:00Z",
    "lineItems": [
      { "description": "LandlordBot Pro (Monthly)", "amount": 2900, "proration": false }
    ]
  }
}
```

---

#### POST /api/invoices/:id/retry
**Description:** Retry failed payment

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "Payment retry initiated",
  "nextAttempt": "2026-03-15T12:00:00Z"
}
```

---

#### GET /api/billing/portal
**Description:** Get Stripe customer portal URL

**Auth:** Required

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

---

## 5. Subscription State Management

### 5.1 State Machine

```
                              ┌─────────────────────────────────────────────┐
                              │                                             │
      ┌──────────────┐       │  ┌──────────┐                               │
      │   TRIALING   │◄──────┼──┤  Start   │                               │
      └──────┬───────┘       │  │ Checkout │                               │
             │                │  └────┬─────┘                               │
             │ payment_failed│       │                                     │
             ▼                │       ▼                                     │
      ┌──────────────┐       │  ┌──────────┐     ┌──────────┐              │
      │   PAST_DUE   │───────┼─►│  ACTIVE  │────►│ CANCELED │              │
      └──────────────┘       │  └────┬───┘     └──────────┘              │
             ▲                │       │         ▲                        │
             │                │       │         │  Cancel                │
             │                │       │         │  at period               │
             │                │  ┌────┴────┐    │  end                     │
             └────────────────┼─►│ PAUSED  ├────┘                        │
                              │  └─────────┘                               │
                              │       ▲                                     │
                              │       │  User                               │
                              └───────┴──Action─────────────────────────────┘
```

### 5.2 State Definitions

| State | Description | User Can Access? | Next States |
|-------|-------------|------------------|-------------|
| **incomplete** | Checkout started but not completed | No (free tier only) | active (payment succeeds) | 
| **trialing** | Trial period active | Yes | active, past_due, canceled |
| **active** | Subscription in good standing | Yes | past_due, canceled, paused |
| **past_due** | Payment failed, retrying | Yes (grace period) | active, canceled |
| **canceled** | Subscription ended | No (downgraded to free) | - |
| **paused** | Temporarily suspended | No (grace period?) | active, canceled |

### 5.3 Grace Periods (Configurable)

```typescript
const GRACE_PERIODS = {
  past_due: 14 * 24 * 60 * 60 * 1000,  // 14 days before downgrade
  incomplete: 24 * 60 * 60 * 1000,      // 24 hours to complete checkout
};
```

### 5.4 Feature Gate Logic

```typescript
// Client-side feature checking
function hasFeature(user: User, feature: string): boolean {
  // Free tier defaults
  const freeFeatures = ['basic_dashboard', '3_units', '20_ai_daily'];
  
  if (user.subscription_tier === 'free') {
    return freeFeatures.includes(feature);
  }
  
  // Check cached features
  return user.features_cache?.[feature] === true;
}

// Server-side enforcement (RLS policies)
// Units table RLS:
create policy "Enforce unit limit" on units
  for insert with check (
    auth.get_units_count() < auth.get_max_units()
  );
```

---

## 6. Upgrade Flow UX Specification

### 6.1 Trigger Points

| Trigger | UI Element | Behavior |
|---------|------------|----------|
| Try to add 4th unit | Toast + Upgrade Modal | "You've reached the free limit" |
| 20th AI request | Usage bar turns red + Modal | "You've used your 20 free requests" |
| Click premium feature | Tooltip + Modal | "This feature requires Pro" |
| Manual navigation | Billing page | Show current + available plans |

### 6.2 Upgrade Modal Flow

```
┌─────────────────────────────────────────────────────────────┐
│  LANDLORDBOT                                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  🚀 Upgrade to Pro                                  │   │
│  │                                                     │   │
│  │  You've reached your free limit of 3 units.        │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │                STARTER          │    PRO      │  │   │
│  │  │                                 │             │  │   │
│  │  │  Units              10         │  Unlimited │  │   │
│  │  │  AI Requests        50/day     │  100/day   │  │   │
│  │  │  Storage            10 GB      │  50 GB     │  │   │
│  │  │  Support            Email      │  Priority  │  │   │
│  │  │                                 │             │  │   │
│  │  │  $15/month        $29/month     │             │  │   │
│  │  │  ─────────────   ────────────   │             │  │   │
│  │  │                                  │             │  │   │
│  │  │  [Select Starter] [Select Pro]  |             │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ✓ Cancel anytime                                   │   │
│  │  ✓ No long-term contracts                           │   │
│  │                                                     │   │
│  │                                               [X]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Checkout Confirmation Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Confirm Your Subscription                                  │
│                                                             │
│  You're subscribing to LandlordBot Pro (Monthly)            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Plan:           Pro                                │   │
│  │  Billing:        Monthly                            │   │
│  │  Price:          $29.00/month                       │   │
│  │  First charge:   Today                              │   │
│  │  Next charge:    April 14, 2026                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  By clicking "Start Subscription", you agree to our       │
│  Terms of Service and authorize LandlordBot to charge      │
│  your payment method.                                       │
│                                                             │
│  [← Back]                              [Start Subscription] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Success State

```
After Stripe redirect:

1. Verify subscription (POST /api/subscriptions/verify)
2. Show success toast: "Welcome to Pro! 🎉"
3. Confetti animation (optional)
4. Redirect to: /dashboard?subscription=success
5. Feature limits immediately updated

The unit that triggered the limit is now created
```

### 6.5 Error Handling

| Error | UX Action |
|-------|-----------|
| Checkout canceled | Return to pricing with `?canceled=true` |
| Payment declined | Show "Card declined" with retry button |
| Session expired | "Session expired - please try again" |
| Already subscribed | "You're already subscribed" with portal link |

---

## 7. Implementation Checklist

### Phase 1: Database (Day 1)
- [ ] Create `subscription_plans` table
- [ ] Create `subscriptions` table
- [ ] Create `payment_methods` table
- [ ] Create `invoices` table
- [ ] Create `subscription_events` table
- [ ] Update `users` table with subscription columns
- [ ] Seed plans data
- [ ] Configure RLS policies

### Phase 2: Stripe Setup (Day 1-2)
- [ ] Create Products in Stripe Dashboard
- [ ] Create Prices (monthly + yearly for each tier)
- [ ] Configure webhook endpoint
- [ ] Set up webhook signing secret
- [ ] Configure customer portal
- [ ] Test in Stripe Test Mode

### Phase 3: Backend API (Day 2-3)
- [ ] Implement webhook handlers
- [ ] Implement subscription CRUD endpoints
- [ ] Implement invoice endpoints
- [ ] Add feature gate middleware
- [ ] Add subscription guard middleware

### Phase 4: Frontend (Day 3-4)
- [ ] Build pricing page
- [ ] Build upgrade modals
- [ ] Build subscription management page
- [ ] Build billing history page
- [ ] Add feature gates to UI components
- [ ] Add subscription-aware navigation

### Phase 5: Testing (Day 4-5)
- [ ] Test complete signup flow
- [ ] Test upgrade flow
- [ ] Test downgrade flow
- [ ] Test cancellation flow
- [ ] Test payment failure handling
- [ ] Test webhook resilience

---

## 8. Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...

# Optional (for specific features)
STRIPE_TRIAL_DAYS=14  # if offering trials
```

---

## 9. Security Considerations

- ✅ Webhook signatures verified
- ✅ All user IDs validated against JWT
- ✅ Stripe IDs never exposed directly
- ✅ RLS policies on all tables
- ✅ Service role only for webhooks
- ✅ No price amounts calculated client-side
- ✅ All billing data from Stripe webhooks

---

## 10. Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `SUB-001` | Invalid plan ID | User: "Invalid plan selected" |
| `SUB-002` | Active subscription exists | User: "You already have a subscription" |
| `SUB-003` | Payment failed | User: "Payment failed. Please try again." |
| `SUB-004` | Subscription not found | User: "Subscription not found" |
| `SUB-005` | Downgrade not allowed | User: "Contact support to downgrade" |
| `INV-001` | Invoice not found | User: "Invoice not found" |
| `PM-001` | No default payment method | User: "Please add a payment method" |

---

**Document Version:** 1.0  
**Last Updated:** March 14, 2026  
**Next Review:** After implementation phase 1
