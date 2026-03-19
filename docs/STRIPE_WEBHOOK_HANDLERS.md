# Stripe Webhook Handlers Design

**Version:** 1.0  
**Date:** March 14, 2026  

---

## Overview

This document outlines the implementation of Stripe webhook handlers for LandlordBot. Webhooks receive real-time events from Stripe and update our database accordingly.

---

## Webhook Endpoint

```
POST /api/webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=...,v1=...
```

---

## Security

### Signature Verification
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }
  
  // Process event...
}
```

---

## Event Handlers

### Event: `checkout.session.completed`
**When:** User successfully completes subscription checkout

```typescript
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Idempotency check
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('metadata->>checkout_session_id', session.id)
    .single();
    
  if (existing) {
    console.log('Checkout already processed:', session.id);
    return { received: true, ignored: 'already_processed' };
  }
  
  // Get line items for plan details
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const priceId = lineItems.data[0].price?.id;
  
  if (!priceId) {
    throw new Error('No price ID in checkout session');
  }
  
  // Get plan from database
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();
    
  if (!plan) {
    throw new Error(`Unknown plan with price: ${priceId}`);
  }
  
  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );
  
  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error('No userId in session metadata');
  }
  
  // Create subscription record
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: plan.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: stripeSubscription.id,
      stripe_price_id: priceId,
      status: stripeSubscription.status,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      trial_start: stripeSubscription.trial_start 
        ? new Date(stripeSubscription.trial_start * 1000).toISOString() 
        : null,
      trial_end: stripeSubscription.trial_end 
        ? new Date(stripeSubscription.trial_end * 1000).toISOString() 
        : null,
      metadata: {
        checkout_session_id: session.id,
      },
    })
    .select()
    .single();
    
  if (subError) throw subError;
  
  // Update user record
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: plan.tier,
      subscription_status: 'active',
      current_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      features_cache: plan.features,
    })
    .eq('id', userId);
    
  if (userError) throw userError;
  
  // Log event
  await supabase.from('subscription_events').insert({
    user_id: userId,
    subscription_id: subscription.id,
    event_type: 'subscription_created',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  // Send welcome email
  await sendEmail(userId, 'subscription_welcome', { 
    planName: plan.name,
    tier: plan.tier,
  });
  
  return { received: true };
}
```

---

### Event: `invoice.payment_succeeded`
**When:** Invoice payment succeeds

```typescript
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();
    
  if (!subscription) {
    console.warn('Subscription not found for invoice:', invoice.id);
    return { received: true, warning: 'subscription_not_found' };
  }
  
  // Create invoice record
  const { error: invoiceError } = await supabase
    .from('invoices')
    .upsert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      stripe_charge_id: invoice.charge as string,
      status: 'paid',
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      invoice_date: new Date(invoice.created * 1000).toISOString(),
      due_date: new Date(invoice.due_date * 1000).toISOString(),
      paid_at: new Date().toISOString(),
      pdf_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      line_items: invoice.lines.data.map(line => ({
        description: line.description,
        amount: line.amount,
        proration: line.proration,
      })),
    }, {
      onConflict: 'stripe_invoice_id',
    });
    
  if (invoiceError) throw invoiceError;
  
  // Update subscription period dates
  const stripeSub = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  
  await supabase
    .from('subscriptions')
    .update({
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      status: stripeSub.status,
    })
    .eq('id', subscription.id);
  
  // Log event
  await supabase.from('subscription_events').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    event_type: 'invoice_paid',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  // Send receipt email
  await sendEmail(subscription.user_id, 'payment_receipt', {
    amount: invoice.amount_paid,
    currency: invoice.currency,
    invoiceUrl: invoice.hosted_invoice_url,
  });
  
  return { received: true };
}
```

---

### Event: `invoice.payment_failed`
**When:** Invoice payment fails

```typescript
async function handleInvoiceFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();
    
  if (!subscription) {
    return { received: true, warning: 'subscription_not_found' };
  }
  
  // Create/update invoice record
  await supabase
    .from('invoices')
    .upsert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      status: 'open',
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      invoice_date: new Date(invoice.created * 1000).toISOString(),
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      attempt_count: invoice.attempt_count,
      next_payment_attempt: invoice.next_payment_attempt 
        ? new Date(invoice.next_payment_attempt * 1000).toISOString() 
        : null,
      line_items: invoice.lines.data.map(line => ({
        description: line.description,
        amount: line.amount,
      })),
    }, {
      onConflict: 'stripe_invoice_id',
    });
  
  // Update subscription status if entering past_due
  if (subscription.status === 'active' && invoice.attempt_count >= 1) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', subscription.id);
      
    await supabase
      .from('users')
      .update({ subscription_status: 'past_due' })
      .eq('id', subscription.user_id);
  }
  
  // Log event
  await supabase.from('subscription_events').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    event_type: 'payment_failed',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  // Send payment failed email
  await sendEmail(subscription.user_id, 'payment_failed', {
    amount: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
    nextAttempt: invoice.next_payment_attempt 
      ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
      : null,
    invoiceUrl: invoice.hosted_invoice_url,
  });
  
  return { received: true };
}
```

---

### Event: `customer.subscription.updated`
**When:** Subscription details change (pause, resume, etc.)

```typescript
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const stripeSub = event.data.object as Stripe.Subscription;
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_subscription_id', stripeSub.id)
    .single();
    
  if (!subscription) {
    return { received: true, warning: 'subscription_not_found' };
  }
  
  // Update subscription record
  const updateData: any = {
    status: stripeSub.status,
    current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: stripeSub.cancel_at_period_end,
    ended_at: stripeSub.ended_at 
      ? new Date(stripeSub.ended_at * 1000).toISOString() 
      : null,
  };
  
  if (stripeSub.canceled_at) {
    updateData.canceled_at = new Date(stripeSub.canceled_at * 1000).toISOString();
  }
  
  await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('id', subscription.id);
  
  // Update user status
  await supabase
    .from('users')
    .update({ subscription_status: stripeSub.status })
    .eq('id', subscription.user_id);
  
  // Log event
  await supabase.from('subscription_events').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    event_type: 'subscription_updated',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  return { received: true };
}
```

---

### Event: `customer.subscription.deleted`
**When:** Subscription is canceled and period ends

```typescript
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripeSub = event.data.object as Stripe.Subscription;
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id')
    .eq('stripe_subscription_id', stripeSub.id)
    .single();
    
  if (!subscription) {
    return { received: true, warning: 'subscription_not_found' };
  }
  
  // Mark subscription as canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      ended_at: stripeSub.ended_at 
        ? new Date(stripeSub.ended_at * 1000).toISOString() 
        : new Date().toISOString(),
    })
    .eq('id', subscription.id);
  
  // Downgrade user to free
  await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'active',
      current_subscription_id: null,
      features_cache: {},
    })
    .eq('id', subscription.user_id);
  
  // Log event
  await supabase.from('subscription_events').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    event_type: 'subscription_canceled',
    stripe_event_id: event.id,
    data: event,
    processed: true,
  });
  
  // Send cancellation email
  await sendEmail(subscription.user_id, 'subscription_canceled', {});
  
  return { received: true };
}
```

---

### Event: `payment_method.attached`
**When:** User adds a payment method

```typescript
async function handlePaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  
  if (paymentMethod.type !== 'card') {
    return { received: true, ignored: 'non_card_payment_method' };
  }
  
  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', paymentMethod.customer as string)
    .single();
    
  if (!user) {
    return { received: true, warning: 'user_not_found' };
  }
  
  // Check if first payment method (make default)
  const { count } = await supabase
    .from('payment_methods')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
    
  const isFirst = count === 0;
  
  // Save payment method
  await supabase
    .from('payment_methods')
    .upsert({
      user_id: user.id,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: paymentMethod.customer as string,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
      is_default: isFirst,
      billing_details: paymentMethod.billing_details,
    }, {
      onConflict: 'stripe_payment_method_id',
    });
  
  return { received: true };
}
```

---

### Event: `payment_method.detached`
**When:** User removes a payment method

```typescript
async function handlePaymentMethodDetached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod;
  
  // Soft delete (mark as invalid)
  await supabase
    .from('payment_methods')
    .update({ is_valid: false, is_default: false })
    .eq('stripe_payment_method_id', paymentMethod.id);
  
  return { received: true };
}
```

---

## Main Router

```typescript
// api/webhooks/stripe/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const handlers: Record<string, (event: Stripe.Event) => Promise<any>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'invoice.payment_succeeded': handleInvoicePaid,
  'invoice.payment_failed': handleInvoiceFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'payment_method.attached': handlePaymentMethodAttached,
  'payment_method.detached': handlePaymentMethodDetached,
};

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  console.log(`Webhook received: ${event.type}`);
  
  const handler = handlers[event.type];
  
  if (!handler) {
    console.log(`No handler for event: ${event.type}`);
    return NextResponse.json({ received: true, ignored: 'no_handler' });
  }
  
  try {
    const result = await handler(event);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`Handler error for ${event.type}:`, err);
    
    // Log failed event
    await supabase.from('subscription_events').insert({
      event_type: event.type,
      stripe_event_id: event.id,
      data: event,
      processed: false,
      error_message: err.message,
    });
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## Retry Logic

### Webhook Retry Strategy

| Scenario | Stripe Behavior | Our Handling |
|----------|----------------|--------------|
| 200 OK | Mark as delivered | Process normally |
| 500 Error | Retry 3 times over 3 days | Log error, monitor |
| Timeout (>20s) | Retry | Return quickly |
| Duplicate event | Retry | Check `stripe_event_id` |

### Idempotency
```typescript
// Check if event already processed
const { data: existing } = await supabase
  .from('subscription_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existing) {
  return { received: true, ignored: 'already_processed' };
}
```

---

## Error Monitoring

### Sentry Integration
```typescript
import * as Sentry from '@sentry/node';

async function handler(event: Stripe.Event) {
  try {
    // ... handle event
  } catch (err) {
    Sentry.captureException(err, {
      extra: {
        eventType: event.type,
        eventId: event.id,
      },
    });
    throw err;
  }
}
```

### Failed Event Dashboard
```sql
-- Query to find failed events
SELECT 
  event_type,
  COUNT(*) as failed_count,
  MAX(created_at) as last_failure
FROM subscription_events
WHERE processed = false
GROUP BY event_type
ORDER BY last_failure DESC;
```

---

## Testing Webhooks Locally

### Using Stripe CLI
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Webhook Secret for Local Testing
Copy the webhook signing secret from `stripe listen` output:
```
> Ready! Your webhook signing secret is whsec_xxx (^C to quit)
```

Add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Production Checklist

- [ ] Webhook endpoint URL configured in Stripe Dashboard
- [ ] Webhook secret stored as `STRIPE_WEBHOOK_SECRET`
- [ ] All relevant events enabled in Stripe webhook settings
- [ ] Idempotency checks implemented for all handlers
- [ ] Error logging to Sentry/error tracking
- [ ] Database RLS policies configured
- [ ] Retry logic tested
- [ ] Webhooks tested in staging environment

---

## Useful Stripe Resources

- [Webhook event types](https://docs.stripe.com/api/events/types)
- [Webhook best practices](https://docs.stripe.com/webhooks/quickstart)
- [Testing webhooks](https://docs.stripe.com/webhooks/test)
- [Idempotency](https://docs.stripe.com/idempotency)
