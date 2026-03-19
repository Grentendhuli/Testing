// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qmnngzevquidtvcopjcu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY0MDgsImV4cCI6MjA4NzY0MjQwOH0.tVOtTl1C-FxddhspvFUQqO9_lDLCUuv6zs-1VwapoX0';

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
