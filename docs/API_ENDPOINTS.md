# Subscription API Endpoint Specifications

**Version:** 1.0  
**Date:** March 14, 2026  

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://landlord-bot-live.vercel.app/api` |
| Staging | `https://landlord-bot-staging.vercel.app/api` |
| Local | `http://localhost:5173/api` |

---

## Authentication

All endpoints (except GET /plans) require Bearer token authentication:

```
Authorization: Bearer <supabase-jwt-token>
```

---

## Endpoints

### 1. Plans

#### GET /plans
Get all available subscription plans.

**Auth:** None (public)

**Request:**
```http
GET /plans
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Free",
        "slug": "free",
        "tier": "free",
        "description": "Perfect for getting started",
        "billingInterval": "month",
        "price": {
          "amount": 0,
          "currency": "usd",
          "formatted": "$0"
        },
        "limits": {
          "maxUnits": 3,
          "maxAIRequests": 20,
          "storageGB": 1
        },
        "features": [
          "3 units",
          "20 AI questions/day",
          "1 GB storage",
          "Basic analytics"
        ],
        "highlighted": false
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
        "name": "Starter",
        "slug": "starter",
        "tier": "starter",
        "description": "For growing landlords",
        "priceOptions": {
          "monthly": {
            "amount": 1500,
            "currency": "usd",
            "stripePriceId": "price_starter_monthly",
            "formatted": "$15/month"
          },
          "yearly": {
            "amount": 14400,
            "currency": "usd",
            "stripePriceId": "price_starter_yearly",
            "formatted": "$144/year",
            "savings": "20%"
          }
        },
        "limits": {
          "maxUnits": 10,
          "maxAIRequests": 50,
          "storageGB": 10
        },
        "features": [
          "10 units",
          "50 AI questions/day",
          "10 GB storage",
          "Email support",
          "Basic analytics"
        ],
        "highlighted": false
      },
      {
        "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
        "name": "Pro",
        "slug": "pro",
        "tier": "pro",
        "description": "For serious landlords",
        "priceOptions": {
          "monthly": {
            "amount": 2900,
            "currency": "usd",
            "stripePriceId": "price_pro_monthly",
            "formatted": "$29/month"
          },
          "yearly": {
            "amount": 27800,
            "currency": "usd",
            "stripePriceId": "price_pro_yearly",
            "formatted": "$278/year",
            "savings": "20%"
          }
        },
        "limits": {
          "maxUnits": null,
          "maxAIRequests": 100,
          "storageGB": 50
        },
        "features": [
          "Unlimited units",
          "100 AI questions/day",
          "50 GB storage",
          "Priority support",
          "Advanced analytics",
          "API access"
        ],
        "highlighted": true
      }
    ]
  }
}
```

---

### 2. Subscriptions

#### GET /subscriptions/current
Get the current user's subscription details.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "active",
      "plan": {
        "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
        "name": "Pro",
        "tier": "pro",
        "slug": "pro",
        "description": "For serious landlords"
      },
      "currentPeriodStart": "2026-03-14T12:00:00Z",
      "currentPeriodEnd": "2026-04-14T12:00:00Z",
      "cancelAtPeriodEnd": false,
      "canceledAt": null,
      "endedAt": null,
      "trialStart": null,
      "trialEnd": null,
      "daysUntilRenewal": 30,
      "paymentMethod": {
        "id": "pm_1234567890",
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2027,
        "isDefault": true
      },
      "features": {
        "maxUnits": null,
        "maxAIRequests": 100,
        "storageGB": 50,
        "apiAccess": true,
        "prioritySupport": true
      }
    }
  }
}
```

**Response 404 (No subscription):**
```json
{
  "success": true,
  "data": {
    "subscription": null,
    "tier": "free",
    "features": {
      "maxUnits": 3,
      "maxAIRequests": 20,
      "storageGB": 1
    }
  }
}
```

#### POST /subscriptions
Create a new subscription checkout session.

**Auth:** Required

**Request:**
```json
{
  "planId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "billingInterval": "month",
  "returnUrl": "https://landlord-bot-live.vercel.app/dashboard"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "url": "https://checkout.stripe.com/pay/cs_test_...",
    "expiresAt": "2026-03-14T15:00:00Z"
  }
}
```

**Response 400 (Already subscribed):**
```json
{
  "success": false,
  "error": {
    "code": "SUB-002",
    "message": "You already have an active subscription",
    "existingSubscriptionId": "d4e5f6a7-b8c9-0123-defa-456789012345"
  }
}
```

**Response 400 (Invalid plan):**
```json
{
  "success": false,
  "error": {
    "code": "SUB-001",
    "message": "Invalid plan selected"
  }
}
```

#### POST /subscriptions/verify
Verify checkout session and activate subscription.

**Auth:** Required

**Request:**
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "active",
      "plan": {
        "name": "Pro",
        "tier": "pro"
      },
      "currentPeriodEnd": "2026-04-14T12:00:00Z",
      "features": {
        "maxUnits": null,
        "maxAIRequests": 100,
        "storageGB": 50
      }
    },
    "message": "Welcome to Pro! Your subscription is now active."
  }
}
```

**Response 400 (Session expired):**
```json
{
  "success": false,
  "error": {
    "code": "SUB-003",
    "message": "Checkout session expired. Please try again."
  }
}
```

#### PATCH /subscriptions
Update subscription (upgrade/downgrade).

**Auth:** Required

**Request:**
```json
{
  "planId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "billingInterval": "year"
}
```

**Response 200 (Upgrade with proration):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "active",
      "plan": {
        "name": "Pro",
        "tier": "pro"
      },
      "currentPeriodStart": "2026-03-14T12:00:00Z",
      "currentPeriodEnd": "2026-04-14T12:00:00Z"
    },
    "proration": {
      "amount": -500,
      "currency": "usd",
      "description": "Credit applied for unused time",
      "nextInvoiceAmount": 2400
    },
    "effectiveDate": "2026-03-14T12:00:00Z"
  }
}
```

**Response 200 (Downgrade - cancel at period end):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "active",
      "plan": {
        "name": "Starter",
        "tier": "starter"
      },
      "cancelAtPeriodEnd": true,
      "currentPeriodEnd": "2026-04-14T12:00:00Z"
    },
    "message": "Your plan will change to Starter on April 14, 2026",
    "effectiveDate": "2026-04-14T12:00:00Z"
  }
}
```

#### DELETE /subscriptions
Cancel subscription.

**Auth:** Required

**Query Parameters:**
- `?immediate=true` - Cancel immediately (not at period end)

**Response 200 (Cancel at period end - default):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "active",
      "cancelAtPeriodEnd": true,
      "cancelAt": "2026-04-14T12:00:00Z"
    },
    "message": "Your subscription will be canceled on April 14, 2026. You'll continue to have access until then.",
    "action": "scheduled_cancellation"
  }
}
```

**Response 200 (Immediate cancellation with refund):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "d4e5f6a7-b8c9-0123-defa-456789012345",
      "status": "canceled",
      "endedAt": "2026-03-14T14:30:00Z"
    },
    "refundAmount": 2900,
    "refundCurrency": "usd",
    "message": "Your subscription has been canceled. A refund of $29.00 will be processed within 5-10 business days.",
    "action": "immediate_cancellation_with_refund"
  }
}
```

---

### 3. Invoices

#### GET /invoices
Get billing history.

**Auth:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Filter by status: `paid`, `open`, `failed`

**Request:**
```http
GET /invoices?page=1&limit=20&status=paid
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "f6a7b8c9-d0e1-2345-fabc-678901234567",
        "stripeInvoiceId": "in_1AaBbCcDdEeFfGgHhIiJjKk",
        "status": "paid",
        "amountDue": 2900,
        "amountPaid": 2900,
        "currency": "usd",
        "amountFormatted": "$29.00",
        "invoiceDate": "2026-03-14T12:00:00Z",
        "dueDate": "2026-03-14T12:00:00Z",
        "paidAt": "2026-03-14T12:05:00Z",
        "pdfUrl": "https://pay.stripe.com/invoice/acct_xxx/.../pdf",
        "hostedInvoiceUrl": "https://invoice.stripe.com/i/acct_xxx/...",
        "lineItems": [
          {
            "description": "LandlordBot Pro (Monthly)",
            "amount": 2900,
            "amountFormatted": "$29.00",
            "quantity": 1,
            "period": {
              "start": "2026-03-14T12:00:00Z",
              "end": "2026-04-14T12:00:00Z"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /invoices/upcoming
Get upcoming invoice preview.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "upcomingInvoice": {
      "amountDue": 2900,
      "amountFormatted": "$29.00",
      "currency": "usd",
      "invoiceDate": "2026-04-14T12:00:00Z",
      "lineItems": [
        {
          "description": "LandlordBot Pro (Monthly)",
          "amount": 2900,
          "amountFormatted": "$29.00",
          "proration": false
        }
      ]
    }
  }
}
```

**Response 404 (No upcoming invoice):**
```json
{
  "success": true,
  "data": {
    "upcomingInvoice": null,
    "message": "No upcoming invoice. Your subscription may be ending soon."
  }
}
```

#### POST /invoices/:id/retry
Retry failed payment.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Payment retry initiated",
    "nextAttempt": "2026-03-15T12:00:00Z",
    "attemptCount": 2
  }
}
```

**Response 400 (Not failed):**
```json
{
  "success": false,
  "error": {
    "code": "INV-002",
    "message": "Invoice is not in failed state"
  }
}
```

---

### 4. Billing Portal

#### GET /billing/portal
Get Stripe customer portal URL.

**Auth:** Required

**Query Parameters:**
- `?returnUrl=/settings/billing` - Return URL after portal session

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/{session_id}",
    "expiresAt": "2026-03-14T14:00:00Z"
  }
}
```

**Response 400 (No Stripe customer):**
```json
{
  "success": false,
  "error": {
    "code": "BILL-001",
    "message": "No billing account found. Please contact support."
  }
}
```

---

### 5. Payment Methods

#### GET /payment-methods
Get user's saved payment methods.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      {
        "id": "g8h9i0j1-k2l3-m4n5-o6p7-q8r9s0t1u2v3",
        "stripePaymentMethodId": "pm_1234567890abcdef",
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2027,
        "isDefault": true,
        "isValid": true,
        "billingDetails": {
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "defaultPaymentMethod": "g8h9i0j1-k2l3-m4n5-o6p7-q8r9s0t1u2v3"
  }
}
```

#### POST /payment-methods
Add new payment method (returns Stripe SetupIntent).

**Auth:** Required

**Request:**
```json
{
  "returnUrl": "https://landlord-bot-live.vercel.app/settings/billing"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "seti_1AaBbCcDdEeFfGgHhIiJjKk_secret_LmMnOpQrStUvWxYz",
    "setupIntentId": "seti_1AaBbCcDdEeFfGgHhIiJjKk",
    "status": "requires_payment_method"
  }
}
```

#### PATCH /payment-methods/:id/default
Set default payment method.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentMethod": {
      "id": "g8h9i0j1-k2l3-m4n5-o6p7-q8r9s0t1u2v3",
      "brand": "mastercard",
      "last4": "9999",
      "isDefault": true
    }
  }
}
```

#### DELETE /payment-methods/:id
Remove payment method.

**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Payment method removed successfully"
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR-001",
    "message": "Human-readable error message",
    "details": {
      // Additional context
    }
  },
  "requestId": "req_abc123def456"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g., already subscribed) |
| 422 | Unprocessable (e.g., invalid state transition) |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /plans | 100/minute |
| GET /subscriptions/* | 60/minute |
| POST /subscriptions | 10/minute |
| PATCH /subscriptions | 10/minute |
| GET /invoices/* | 60/minute |
| POST /invoices/*/retry | 5/minute |

---

## TypeScript Interface Definitions

```typescript
// Types for API responses

interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  description: string;
  price?: {
    amount: number;
    currency: string;
    formatted: string;
  };
  priceOptions?: {
    monthly: {
      amount: number;
      currency: string;
      stripePriceId: string;
      formatted: string;
    };
    yearly: {
      amount: number;
      currency: string;
      stripePriceId: string;
      formatted: string;
      savings: string;
    };
  };
  limits: {
    maxUnits: number | null;
    maxAIRequests: number;
    storageGB: number;
  };
  features: string[];
  highlighted: boolean;
}

interface Subscription {
  id: string;
  status: 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  plan: {
    id: string;
    name: string;
    tier: string;
    slug: string;
    description: string;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  endedAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  daysUntilRenewal: number;
  paymentMethod?: {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    isDefault: boolean;
  };
  features: {
    maxUnits: number | null;
    maxAIRequests: number;
    storageGB: number;
    [key: string]: any;
  };
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amountDue: number;
  amountPaid: number;
  currency: string;
  amountFormatted: string;
  invoiceDate: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string;
  hostedInvoiceUrl: string;
  lineItems: {
    description: string;
    amount: number;
    amountFormatted: string;
    quantity: number;
    period: {
      start: string;
      end: string;
    };
  }[];
}

interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  isValid: boolean;
  billingDetails: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}
```
