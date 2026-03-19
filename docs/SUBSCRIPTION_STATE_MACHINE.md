# Subscription State Machine

**Version:** 1.0  
**Date:** March 14, 2026  

---

## Visual State Diagram

```
                              ┌─────────────────────────────────────────────┐
                              │                                             │
      ┌──────────────┐       │  ┌──────────┐                               │
      │   TRIALING   │◄──────┼──┤  Trial   │                               │
      └──────┬───────┘       │  │  Start   │                               │
             │                │  └────┬─────┘                               │
             │ payment_failed│       │                                     │
             ▼                │       ▼                                     │
┌─────────┐   ┌────────────┐ │  ┌──────────┐     ┌──────────┐              │
│         │  │            │ │  │          │     │          │              │
│ RESUMED │──│  ACTIVE    │◄─┼──│ACTIVE    │────►│ CANCELED │              │
│         │  │            │ │  │          │     │          │              │
└────▲────┘  └─────┬──────┘ │  └────┬─────┘     └──────────┘              │
     │             │        │  _at_  │         ▲                        │
     │             │        │  per.  │         │  Cancel                  │
     │             │        │  end   │         │  at period               │
     │             │        │       │         │  end                     │
     │             │        │  ┌────┴────┐    │                          │
     │         pause│        └──►│ PAUSED  ├────┘                        │
     │             │            └─────────┘                               │
     │             │                ▲                                     │
     │             └────────────────┘                                     │
     │                  Resume                                             │
     │                                                                     │
     │                  payment_failed                                     │
     └────────────────────────────────────────────────────────────────────┐
                                                                          │
                                       ┌──────────┐◄───────────────────────┘
                                       │          │
                                       │ PAST_DUE │◄──────────────────────────┐
                                       │          │                           │
                                       └────┬─────┘                           │
                                            │                                │
                                            │ payment_succeeded              │
                                            │                                │
                                            │                                │
                                            ▼                                │
                                       ┌──────────┐                         │
                                       │          │                         │
                                       │ UNPAID   │─────────────────────────┘
                                       │          │    payment_failed (max
                                       └──────────┘    attempts reached)
                                            │
                                            ▼
                                       ┌──────────┐
                                       │          │
                                       │ CANCELED │─────► Downgrade to Free
                                       │          │
                                       └──────────┘
```

---

## State Definitions

### `incomplete`
- **Entry:** Checkout session created but not completed
- **User Access:** Full free tier access
- **Billing:** None (no charge attempted)
- **Transition:** `completed` → `active` or `trialing`
- **Duration:** 24 hours (expires)

### `trialing`
- **Entry:** Trial period started
- **User Access:** Full paid tier access
- **Billing:** $0 (trial credit)
- **Transition:** 
  - Trial ends with payment → `active`
  - Trial ends without payment → `past_due` → `canceled`
- **Duration:** Configured trial period (14 days typical)

### `active`
- **Entry:** Successfully paid
- **User Access:** Full paid tier access
- **Billing:** Normal recurring payments
- **Transition:**
  - Cancel scheduled → `active` (cancel_at_period_end=true)
  - Cancel immediate → `canceled`
  - Payment fails → `past_due`
  - Pause request → `paused`
  - Plan ends → `ended` → `canceled`
- **Duration:** Indefinite (until canceled)

### `past_due`
- **Entry:** Payment failed, retrying
- **User Access:** Full paid tier access (grace period)
- **Billing:** Retry attempts ongoing
- **Transition:**
  - Payment succeeds → `active`
  - Max retries reached → `canceled`
- **Duration:** Up to 14 days (configurable)

### `canceled`
- **Entry:** Subscription ended
- **User Access:** Free tier only
- **Billing:** None
- **Transition:** None (terminal state)
- **Duration:** Permanent

### `paused`
- **Entry:** User pauses subscription
- **User Access:** Reduced (configurable, typically read-only)
- **Billing:** None while paused
- **Transition:** Resume → `active`
- **Duration:** Indefinite (user must resume)

### `unpaid`
- **Entry:** Max retries reached, collection suspended
- **User Access:** Free tier only
- **Billing:** None (in collection)
- **Transition:** Payment → `active` (rare)
- **Duration:** Until manual resolution or deletion

---

## State Transitions

### Allowed Transitions Table

| From/To → | `incomplete` | `trialing` | `active` | `past_due` | `canceled` | `paused` | `unpaid` |
|-----------|--------------|------------|----------|------------|------------|----------|----------|
| `incomplete` | ═ | ✓ | ✓ | ╳ | ✓ | ╳ | ╳ |
| `trialing` | ╳ | ═ | ✓ | ✓ | ✓ | ╳ | ╳ |
| `active` | ╳ | ╳ | ═ | ✓ | ✓ | ✓ | ✓ |
| `past_due` | ╳ | ╳ | ✓ | ═ | ✓ | ╳ | ✓ |
| `canceled` | ╳ | ╳ | ╳ | ╳ | ═ | ╳ | ╳ |
| `paused` | ╳ | ╳ | ✓ | ╳ | ╳ | ═ | ╳ |
| `unpaid` | ╳ | ╳ | ✓ | ╳ | ✓ | ╳ | ═ |

**Legend:**
- ═ = Same state (no transition)
- ✓ = Valid transition
- ╳ = Invalid transition (prevention required)

---

## Database Implementation

### Status Field Schema
```sql
status text NOT NULL DEFAULT 'incomplete' 
  CHECK (status IN ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'paused', 'unpaid'))
```

### State Change Function
```sql
CREATE OR REPLACE FUNCTION transition_subscription_status(
  subscription_id uuid,
  new_status text,
  reason text DEFAULT null
) RETURNS boolean AS $$
DECLARE
  current_status text;
  valid boolean;
BEGIN
  -- Get current status
  SELECT status INTO current_status 
  FROM subscriptions WHERE id = subscription_id;
  
  -- Check if transition is valid
  valid := CASE current_status
    WHEN 'incomplete' THEN new_status IN ('trialing', 'active', 'canceled')
    WHEN 'trialing' THEN new_status IN ('active', 'past_due', 'canceled')
    WHEN 'active' THEN new_status IN ('past_due', 'canceled', 'paused', 'unpaid')
    WHEN 'past_due' THEN new_status IN ('active', 'canceled', 'unpaid')
    WHEN 'canceled' THEN false  -- Terminal state
    WHEN 'paused' THEN new_status IN ('active')
    WHEN 'unpaid' THEN new_status IN ('active', 'canceled')
    ELSE false
  END;
  
  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', current_status, new_status;
  END IF;
  
  -- Update status
  UPDATE subscriptions
  SET 
    status = new_status,
    updated_at = now(),
    metadata = jsonb_set(
      metadata,
      '{state_transitions}',
      COALESCE(metadata->'state_transitions', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'from', current_status,
        'to', new_status,
        'at', now(),
        'reason', reason
      ))
    )
  WHERE id = subscription_id;
  
  -- Log event
  INSERT INTO subscription_events (
    user_id,
    subscription_id,
    event_type,
    data
  ) 
  SELECT 
    user_id,
    id,
    'status_change',
    jsonb_build_object(
      'from', current_status,
      'to', new_status,
      'reason', reason
    )
  FROM subscriptions WHERE id = subscription_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## State Actions

### Webhook Handler State Updates

```typescript
// When handling events, map to our state machine

const stripeStatusToDbStatus: Record<string, string> = {
  'incomplete': 'incomplete',
  'trialing': 'trialing',
  'active': 'active',
  'past_due': 'past_due',
  'canceled': 'canceled',
  'unpaid': 'unpaid',
  'paused': 'paused',
  // Incomplete with expired: treated as 'incomplete'
  'incomplete_expired': 'incomplete',
};

async function updateSubscriptionStatus(
  subscriptionId: string,
  stripeStatus: string
) {
  const dbStatus = stripeStatusToDbStatus[stripeStatus];
  
  if (!dbStatus) {
    throw new Error(`Unknown Stripe status: ${stripeStatus}`);
  }
  
  // Call the transition function via RPC
  const { data, error } = await supabase.rpc('transition_subscription_status', {
    subscription_id: subscriptionId,
    new_status: dbStatus,
    reason: `Stripe webhook: ${stripeStatus}`,
  });
  
  if (error) throw error;
  return data;
}
```

---

## Feature Access by State

| State | Can Access Premium? | Grace Period? | Can Edit Data? | Billing Active? |
|-------|----------------------|---------------|----------------|-----------------|
| `incomplete` | No | N/A | Yes (free) | No |
| `trialing` | Yes | No | Yes | No (trial credit) |
| `active` | Yes | No | Yes | Yes |
| `past_due` | Yes | 14 days | Yes | Retry attempts |
| `canceled` | No | N/A | Read-only | No |
| `paused` | Partial | N/A | Read-only | No |
| `unpaid` | No | N/A | Read-only | Collection |

---

## Cron Jobs for State Management

### Daily State Check
```typescript
// Run daily to handle edge cases

async function dailySubscriptionCheck() {
  // 1. Expire incomplete checkouts older than 24h
  await supabase.rpc('expire_incomplete_subscriptions');
  
  // 2. Alert users in past_due > 7 days
  const pastDueAlerts = await supabase
    .from('subscriptions')
    .select('*, users(email)')
    .eq('status', 'past_due')
    .filter('updated_at', 'lt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
  for (const sub of pastDueAlerts.data || []) {
    await sendEmail(sub.user_id, 'payment_final_notice');
  }
  
  // 3. Notify about upcoming cancellations
  const upcomingCancellations = await supabase
    .from('subscriptions')
    .select('*, users(email)')
    .eq('cancel_at_period_end', true)
    .filter('current_period_end', 'gte', new Date())
    .filter('current_period_end', 'lt', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    
  for (const sub of upcomingCancellations.data || []) {
    await sendEmail(sub.user_id, 'upcoming_cancellation', {
      cancelDate: sub.current_period_end,
    });
  }
}
```

---

## Edge Cases

### 1. Race Condition: Payment during past_due
**Scenario:** User pays manually while in `past_due`
**Handling:** Webhook arrives after status already changed to `active`
**Solution:** Idempotency check in handlers

### 2. Multiple Subscriptions
**Scenario:** User accidentally creates two subscriptions
**Handling:** Only one active subscription allowed per user
**Solution:** Webhook handler checks for existing

### 3. Proration timing
**Scenario:** User upgrades then immediately cancels
**Handling:** Stripe handles proration, our state reflects period end
**Solution:** Always sync from Stripe events

### 4. Failed webhook
**Scenario:** Webhook 500s, Stripe retries
**Handling:** Idempotent handlers + webhook event log
**Solution:** Check `stripe_event_id` before processing

### 5. Clock skew
**Scenario:** Our `current_period_end` differs from Stripe by seconds
**Handling:** Use Stripe values as source of truth
**Solution:** Update from webhooks, not local calculation

---

## Monitoring

### State Distribution Dashboard
```sql
-- Quick state overview
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (current_period_end - now())) / 86400) as avg_days_remaining
FROM subscriptions
WHERE status IN ('active', 'trialing', 'past_due')
GROUP BY status;
```

### Failed Transitions Alert
```sql
-- Log failed state transitions
SELECT 
  s.stripe_subscription_id,
  s.status as current_status,
  se.data->>'attempted_status' as attempted_status,
  se.error_message,
  se.created_at
FROM subscription_events se
JOIN subscriptions s ON s.id = se.subscription_id
WHERE se.event_type = 'state_transition_failed'
ORDER BY se.created_at DESC
LIMIT 10;
```

---

## Summary

**Key Principles:**
1. Stripe is the source of truth - all state comes from webhooks
2. Invalid transitions are prevented at database level
3. Terminal states (`canceled`) cannot transition further
4. `past_due` has a grace period for user retention
5. State history is logged for audit purposes
6. Webhooks are idempotent - safe to retry
