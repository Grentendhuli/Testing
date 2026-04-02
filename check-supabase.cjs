const { createClient } = require('@supabase/supabase-js');

// Use environment variables — NEVER hardcode credentials
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node check-supabase.cjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkConnection() {
  console.log('🔌 Testing connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connected to Supabase!');
    return true;
  } catch (e) {
    console.error('❌ Error:', e.message);
    return false;
  }
}

async function getRowCounts() {
  console.log('\n📊 Getting row counts...\n');
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

async function createExecSqlFunction() {
  console.log('\n🔧 Checking/Creating exec_sql function...\n');
  
  // This would normally create the function, but we can't execute arbitrary SQL
  // without already having an exec_sql function. This is a catch-22.
  console.log('⚠️  Note: Cannot create exec_sql via REST API without existing SQL execution capability.');
  console.log('⚠️  SQL must be executed via Supabase Dashboard SQL Editor or psql.');
}

async function main() {
  const connected = await checkConnection();
  if (!connected) {
    console.log('\n❌ Cannot connect to database. Aborting.');
    process.exit(1);
  }
  
  await getRowCounts();
  
  console.log('\n========================================');
  console.log('SQL EXECUTION REQUIRED');
  console.log('========================================');
  console.log('\n⚠️  SQL Prompt 1 needs to be executed manually:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/sql/new');
  console.log('2. Copy and paste the SQL below:');
  console.log('\n--- SQL START ---');
  console.log(`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, phone_number, property_address, subscription_tier, subscription_status, max_units, storage_used, storage_limit)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), COALESCE(NEW.raw_user_meta_data->>'property_address', ''), 'free', 'active', -1, 0, 1073741824)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
  console.log('--- SQL END ---');
  console.log('\n3. Click "Run" to execute.');
}

main().catch(console.error);
