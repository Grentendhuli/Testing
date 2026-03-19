const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qmnngzevquidtvcopjcu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSQLPrompt1() {
  console.log('🔧 Executing SQL Prompt 1: Fix handle_new_user trigger\n');
  
  // SQL to execute
  const sql = `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, phone_number, property_address, subscription_tier, subscription_status, max_units, storage_used, storage_limit)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), COALESCE(NEW.raw_user_meta_data->>'property_address', ''), 'free', 'active', -1, 0, 1073741824)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  console.log('SQL Statement:');
  console.log('==============');
  console.log(sql);
  console.log('\nAttempting execution via REST API...\n');
  
  // Try to call exec_sql RPC if it exists
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ RPC Error:', error.message);
      if (error.message.includes('Could not find the public.exec_sql')) {
        console.log('\n⚠️  exec_sql function does not exist.');
        console.log('   SQL must be executed via Supabase Dashboard SQL Editor.');
      }
      return false;
    }
    
    console.log('✅ SQL executed successfully!');
    console.log('Result:', data);
    return true;
  } catch (e) {
    console.error('❌ Exception:', e.message);
    return false;
  }
}

async function verifyRowCounts() {
  console.log('\n📊 Verifying row counts...\n');
  const tables = ['users', 'units', 'leases', 'messages', 'payments', 'maintenance_requests'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`  ${table}: ${count} rows`);
      }
    } catch (e) {
      console.log(`  ${table}: ERROR - ${e.message}`);
    }
  }
}

async function main() {
  const success = await executeSQLPrompt1();
  await verifyRowCounts();
  
  if (!success) {
    console.log('\n========================================');
    console.log('MANUAL EXECUTION REQUIRED');
    console.log('========================================');
    console.log('\nPlease execute the SQL manually:');
    console.log('1. Visit: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/sql/new');
    console.log('2. Paste the SQL from above');
    console.log('3. Click Run');
  }
}

main().catch(console.error);
