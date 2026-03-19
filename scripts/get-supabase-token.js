// Get Supabase access token using credentials
import { createClient } from '@supabase/supabase-js';

const SUPABASE_GOTRUE_URL = 'https://api.supabase.com/auth/v1';

async function getAccessToken(email, password) {
  try {
    const response = await fetch(`${SUPABASE_GOTRUE_URL}/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXdreG5kdWN0eWJ6aHJ0eHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2NjI5NjQsImV4cCI6MjA1NDIzODk2NH0.XCLnGvSAnMV_ExQqUnqNfYxL_lXSvzqR5cHGl7aE1tU' // default public anon key for supabase.com
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Try management API approach
async function getManagementToken() {
  console.log('Trying to get projects via Management API...');
  // This requires a personal access token from dashboard
}

getAccessToken('grentendhuli@gmail.com', 'L!VJZ_icZ7hfSQv');
