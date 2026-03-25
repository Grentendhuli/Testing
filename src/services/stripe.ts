import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Create checkout session
export const createCheckoutSession = async (priceId, userId) => {
  try {
    const stripe = await getStripe();
    
    // Call your backend to create the session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Checkout error:', err);
    throw err;
  }
};

// Get or create Stripe customer
export const getOrCreateCustomer = async (userId, email, name) => {
  try {
    const response = await fetch('/api/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name }),
    });

    if (!response.ok) {
      throw new Error('Failed to create customer');
    }

    const { customerId } = await response.json();
    return customerId;
  } catch (err) {
    console.error('Customer creation error:', err);
    throw err;
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    return await response.json();
  } catch (err) {
    console.error('Cancel subscription error:', err);
    throw err;
  }
};

// Update subscription
export const updateSubscription = async (subscriptionId, newPriceId) => {
  try {
    const response = await fetch('/api/update-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, newPriceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }

    return await response.json();
  } catch (err) {
    console.error('Update subscription error:', err);
    throw err;
  }
};

// Get subscription status
export const getSubscriptionStatus = async (userId) => {
  try {
    const response = await fetch(`/api/subscription-status?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get subscription status');
    }

    return await response.json();
  } catch (err) {
    console.error('Get subscription status error:', err);
    throw err;
  }
};

// Get invoices
export const getInvoices = async (customerId) => {
  try {
    const response = await fetch(`/api/invoices?customerId=${customerId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get invoices');
    }

    return await response.json();
  } catch (err) {
    console.error('Get invoices error:', err);
    throw err;
  }
};