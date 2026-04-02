// API endpoint: Get subscription status
// GET /api/subscription-status

import { createClient } from '@supabase/supabase-js';

// Fail-fast validation at startup
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('[subscription-status] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    res.status(200).json({ subscription: data || null });
  } catch (err) {
    console.error('Error fetching subscription status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}