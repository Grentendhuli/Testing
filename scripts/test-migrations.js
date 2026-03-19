// Test Supabase connection with migrations
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qmnngzevquidtvcopjcu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY0MDgsImV4cCI6MjA4NzY0MjQwOH0.tVOtTl1C-FxddhspvFUQqO9_lDLCUuv6zs-1VwapoX0';

async function testConnection() {
  console.log('🔄 Testing Supabase connection with migrations...\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tables = ['users', 'units', 'maintenance_requests', 'leads', 'payments'];
  let allGood = true;
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows (table exists but empty)
      console.log(`❌ ${table}: ${error.message}`);
      allGood = false;
    } else {
      console.log(`✅ ${table}: accessible`);
    }
  }
  
  console.log('\n' + (allGood ? '🎉 All tables migrated successfully!' : '⚠️ Some tables missing'));
  
  // Test auth
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.log('Auth error:', authError.message);
  } else {
    console.log('\n🔐 Auth system: OK');
  }
  
  return allGood;
}

testConnection().then(ok => process.exit(ok ? 0 : 1));
