# Upgrade Flow UX Specification

**Version:** 1.0  
**Date:** March 14, 2026  

---

## 1. Core Principle

> **NO AUTOMATIC UPGRADES.** Users must explicitly opt-in at every step.

---

## 2. Trigger Points

### 2.1 When Upgrade Prompts Appear

| Trigger | Current UX | Upgrade Prompt | Dismissible? |
|---------|-----------|----------------|--------------|
| **Add 4th unit** | "Add Unit" button | Modal: "Free tier limit reached" | Yes (stay on free) |
| **Send 21st AI request** | AI Assistant | Inline banner + modal | Yes (free tier continues) |
| **Access premium feature** | Locked feature | Tooltip + "Upgrade" button | Yes (feature remains locked) |
| **Storage limit (1GB)** | File upload | Toast: "Storage limit reached" | Yes |
| **Manual navigation** | /pricing page | Full pricing page | Always available |

### 2.2 When Upgrade Prompts DON'T Appear

- ✅ User on free tier browsing dashboard
- ✅ User adding 1st, 2nd, or 3rd unit
- ✅ User under 20 AI requests
- ✅ User using free features

---

## 3. Upgrade Modal Flow

### Step 1: Limit Reached (Trigger Modal)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🚧 Free Limit Reached                     │
│                                                             │
│  You've reached your free limit of 3 units.                 │
│                                                             │
│  Upgrade to add more units and unlock powerful features.   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ⭐ RECOMMENDED                                      │   │
│  │                                                     │   │
│  │  LandlordBot Pro                                    │   │
│  │  ─────────────────                                  │   │
│  │  Unlimited units           $29/month              │   │
│  │  100 AI questions/day                               │   │
│  │  50 GB storage                                      │   │
│  │  Priority support                                   │   │
│  │  ─────────────────                                  │   │
│  │                                                     │   │
│  │  [   Upgrade to Pro   ]                             │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Or check out our other plans:                              │
│                                                            │
│  [ Starter - $15/mo ]  [ Enterprise - Contact ]            │
│                                                             │
│                                    [ Maybe Later ]          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ✓ Cancel anytime    ✓ No setup fees    ✓ Secure payment │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Pricing Comparison (User clicks "Upgrade to Pro")

```
┌─────────────────────────────────────────────────────────────┐
│              Choose Your Plan                                │
│                                     [ ✕ Close ]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         Free        Starter         Pro         Enterprise  │
│         ────        ───────         ───         ───────────   │
│                                                             │
│  Units     3          10             ∞            Unlimited   │
│  AI/day    20         50            100           Unlimited   │
│  Storage   1GB        10GB          50GB          500GB       │
│                                                             │
│  Support   —          Email        Priority      Dedicated  │
│  API       —          —             ✓              ✓          │
│  Analytics Basic      Basic         Advanced       Custom     │
│                                                             │
│         ────        ───────         ───         ───────────   │
│                                                             │
│           Free     $15/month     $29/month      Contact Us  │
│                    $144/year     $278/year                    │
│                    Save 20%      Save 20%                     │
│                                                             │
│                   [     ]      [  ✓   ]                       │
│                  Monthly      Yearly                         │
│                                                             │
│                                                             │
│              [         Continue with Pro         ]           │
│              [           $278/year (Save $70)    ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Confirmation (User clicks "Continue")

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Confirm Your Subscription                       │
│                                                             │
│  You're subscribing to:                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  LandlordBot Pro (Yearly)                           │   │
│  │                                                     │   │
│  │  Billing:        Annual                               │   │
│  │  Price:          $278.00/year                         │   │
│  │  Per month:      $23.17 (save $70/year)               │   │
│  │                                                     │   │
│  │  First charge:   Today                                │   │
│  │  Next charge:    March 14, 2027                       │   │
│  │                                                     │   │
│  │  What's included:                                     │   │
│  │  • Unlimited units                                     │   │
│  │  • 100 AI questions/day                                │   │
│  │  • 50 GB storage                                       │   │
│  │  • Priority email support                            │   │
│  │  • Full API access                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [  ← Back to Plans  ]                                      │
│                                                             │
│  By clicking "Start Subscription", you agree to our          │
│  Terms of Service and Privacy Policy. You authorize          │
│  LandlordBot to charge your payment method annually.        │
│                                                             │
│                    [    ⭐ Start Subscription    ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Stripe Checkout

User is redirected to Stripe hosted checkout page.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Pay LandlordBot                                │
│                                                             │
│  Pro (Yearly)                                $278.00        │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [ Card number    ]                                         │
│  [ MM / YY ] [ CVC ]                                        │
│                                                             │
│  [ Country ▼ ]                                              │
│  [ ZIP ]                                                    │
│                                                             │
│  [    ✓  ] Save card for future payments                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Total                                       $278.00        │
│                                                             │
│           [ Cancel ]          [ Subscribe ]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Success

**Redirect URL:** `/dashboard?subscription=success`

```
After redirect from Stripe:

1. Verify subscription (POST /api/subscriptions/verify)
2. Show success toast:

┌─────────────────────────────────────────────────────────────┐
│  🎉 Welcome to Pro!                                         │
│                                                             │
│  Your subscription is now active.                           │
│  You now have unlimited units and 100 AI questions/day.    │
│                                                             │
│                      [ Got it! ]                           │
└─────────────────────────────────────────────────────────────┘

3. If triggered by limit (e.g., 4th unit):
   - The action that triggered the upgrade now completes
   - Unit is created / AI question is answered

4. Update UI immediately:
   - Remove upgrade banners
   - Show Pro badge in header
   - Update unit counter to "Unlimited"
```

---

## 4. Cancellation

### Cancel Flow (User-initiated)

```
┌─────────────────────────────────────────────────────────────┐
│              Settings > Billing > Cancel                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ⚠️ Current Plan: LandlordBot Pro                    │   │
│  │                                                     │   │
│  │  Status: Active                                     │   │
│  │  Current period: Mar 14, 2026 – Apr 14, 2026        │   │
│  │  Next charge: Apr 14, 2026                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ ⚠️ Cancel Subscription ]                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  When you cancel:                                           │
│  • You'll keep Pro access until Apr 14, 2026               │
│  • No charges after that date                               │
│  • Your data will be preserved                            │
│  • You can resubscribe anytime                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Are you sure?                                          │
│                                                             │
│  We'd hate to see you go. Is there something we           │
│  could have done better?                                    │
│                                                             │
│  [ Technical issues ]  [ Too expensive ]  [ Switching ]    │
│  [ Not using it ]    [ Other: ___________ ]                │
│                                                             │
│                                                             │
│  [ Keep Subscription ]        [ Yes, Cancel ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cancel Confirmation

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Subscription Canceled                          │
│                                                             │
│  Your Pro subscription has been canceled.                  │
│                                                             │
│  📅 Important Dates:                                        │
│                                                             │
│  • Cancel date:    March 14, 2026                          │
│  • Access until:   April 14, 2026                          │
│  • After that:     Downgrade to Free                        │
│                                                             │
│  You'll be able to:                                         │
│  ✓ Keep all 5 units (but can't add more)                  │
│  ✓ View all existing data                                   │
│  ✓ Use 20 AI questions/day                                  │
│                                                             │
│  [ Resubscribe ]              [ Back to Dashboard ]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Downgrade Flow

### Downgrade from Pro to Starter

```
In Billing Settings, user clicks "Change Plan":

┌─────────────────────────────────────────────────────────────┐
│              Change Your Plan                                │
│                                                             │
│  Current: Pro ($29/month)                                   │
│                                                             │
│  Select new plan:                                           │
│                                                             │
│  ○ Starter ($15/month)                                     │
│    - 10 units max                                           │
│    - Your current: 5 units ✓                                │
│                                                             │
│  ○ Free ($0)                                                │
│    - 3 units max ⚠️                                         │
│    - Your current: 5 units (will need to delete 2)           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⚠️ Downgrade Policy                                         │
│  • Change takes effect at end of billing period             │
│  • Current period: You keep Pro access                      │
│  • Next period: New plan begins                             │
│                                                             │
│  [ Cancel ]                    [ Confirm Downgrade ]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Error States

### Payment Failed

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ⚠️ Payment Failed                               │
│                                                             │
│  We couldn't process your payment.                        │
│                                                             │
│  Common issues:                                             │
│  • Insufficient funds                                       │
│  • Card expired                                             │
│  • Bank declined                                            │
│                                                             │
│  Your subscription will be retried automatically:           │
│  • Next attempt: March 15, 2026                            │
│  • Attempt 2 of 4                                           │
│                                                             │
│  [ Update Payment Method ]      [ Contact Support ]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Checkout Canceled

```
When user clicks "Cancel" in Stripe:

Redirect to: /pricing?canceled=true

Show toast:
┌─────────────────────────────────────────────────────────────┐
│  ✕ Checkout canceled. No charges were made.                │
│                                                             │
│  [ Back to Pricing ]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Feature Gates in UI

### Locked Features

```
// Premium feature button with lock
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [ 📊 Advanced Analytics ]                                  │
│     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
│                                                             │
│  Upgrade to Pro to access advanced analytics               │
│  including rent trends, ROI calculations, and more.         │
│                                                             │
│  [ Upgrade to Pro ]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Usage Indicators

```
Always visible in sidebar:

┌─────────────┐
│  Units      │
│  3 / 3 ⚠️   │ ── hover: "Upgrade for unlimited"
│             │
│  AI Today   │
│  18 / 20    │ ── bar fills up
│             │
└─────────────┘
```

---

## 8. Email Notifications

| Event | Timing | Content |
|-------|--------|---------|
| **Welcome to Pro** | Immediately after successful subscription | Thank you, features list, getting started |
| **Payment receipt** | Within 24h of payment | Invoice link, amount charged, next charge date |
| **Payment failed** | Immediately after failure | Retry date, update payment method link |
| **Past due warning** | 7 days past due | Urgent, account will downgrade |
| **Subscription ending** | 7 days before period end | Reminder, renewal options |
| **Downgrade complete** | After period ends | You're now on Free tier, limits applied |
| **Cancellation** | Immediately after cancellation | Confirmation, access until date |

---

## 9. Analytics Events

Track these events for funnels:

```javascript
track('upgrade_modal_shown', { trigger: 'unit_limit' });
track('pricing_page_viewed', { from: 'upgrade_modal' });
track('plan_selected', { plan: 'pro', interval: 'yearly' });
track('checkout_started', { sessionId: 'cs_xxx' });
track('checkout_completed', { sessionId: 'cs_xxx', plan: 'pro' });
track('checkout_canceled', { sessionId: 'cs_xxx', step: 'stripe_page' });
track('subscription_verified', { subscriptionId: 'sub_xxx' });
track('subscription_cancel_scheduled', { subscriptionId: 'sub_xxx' });
track('subscription_canceled', { subscriptionId: 'sub_xxx' });
```

---

## 10. Mobile Adaptations

On mobile (<640px), modals become full-screen sheets:

```
┌─────────────────────────────┐
│  ✕                          │
│                             │
│  🚧 Free Limit Reached      │
│                             │
│  You've reached your limit   │
│  of 3 units.                 │
│                             │
│  ┌─────────────────────┐   │
│  │ LandlordBot Pro     │   │
│  │ $29/month           │   │
│  │                     │   │
│  │ • Unlimited units   │   │
│  │ • 100 AI/day        │   │
│  │ • 50GB storage      │   │
│  │                     │   │
│  │ [Upgrade Now →]     │   │
│  └─────────────────────┘   │
│                             │
│  [See all plans]            │
│  [Maybe later]              │
│                             │
└─────────────────────────────┘
```

---

## 11. Accessibility

- All modals trap focus
- ESC key closes modals
- High contrast for prices
- Screen reader announcements for status changes
- Focus visible on all interactive elements
- ARIA labels for pricing tiers

---

## 12. Testing Scenarios

| Scenario | Expected Result |
|----------|----------------|
| User closes modal at limit | Free tier continues, limit enforced |
| User cancels in Stripe | Returns to pricing, no charge |
| Payment fails | Retry flow, downgrade if persistent |
| Server error during verify | Retry button, error message |
| Add 4th unit → upgrade → cancel | Unit created, subscription active, then cancels |
| 2 upgrades within hour | Second upgrade updates existing sub |
| Downgrade while past_due | Must resolve billing first |

---

## Summary

**Key Principles:**
1. ✅ Explicit opt-in at every step
2. ✅ Clear pricing disclosure
3. ✅ No surprises at checkout
4. ✅ Confirmation before charging
5. ✅ Easy cancellation with grace period
6. ✅ Transparent about what happens when limits hit
