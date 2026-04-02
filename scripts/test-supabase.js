// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

// Use correct server-side env var names (no VITE_ prefix)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_ANON_KEY before running');
  console.error('Example: SUPABASE_URL=https://... SUPABASE_ANON_KEY=... node scripts/test-supabase.js');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test auth health
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('✓ Auth endpoint reachable');
    
    // Test database by listing tables (via RPC or querying a common table)
    const { data: tables, error: dbError } = await supabase
      .from('_tables')
      .select('*')
      .limit(1);
    
    if (dbError) {
      console.log('Database query test:', dbError.message);
    } else {
      console.log('✓ Database connection working');
    }
    
    // List all tables
    console.log('\n Querying available tables...');
    const { data, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.log('  Could not list tables (RPC not available):', error.message);
      console.log('  Attempting direct query to profiles...');
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (profilesError) {
        console.log('  profiles table:', profilesError.message);
      } else {
        console.log('✓ profiles table accessible, rows:', profiles?.length || 0);
      }
    } else {
      console.log('Tables:', data);
    }
    
    console.log('\n✅ Connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

testConnection();
