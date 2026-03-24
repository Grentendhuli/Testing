const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials for landlord-bot-testing
const supabaseUrl = 'https://qmnngzevquidtvcopjcu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration(filePath, description) {
  console.log(`\n🔧 Applying: ${description}`);
  console.log('=' .repeat(60));
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Try using exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      if (error.message.includes('Could not find the public.exec_sql')) {
        console.log('⚠️  exec_sql RPC not available. Manual execution required.');
        console.log('\n📋 SQL to execute manually:');
        console.log('─'.repeat(60));
        console.log(sql);
        console.log('─'.repeat(60));
        return false;
      }
      throw error;
    }
    
    console.log('✅ Migration applied successfully!');
    return true;
  } catch (e) {
    console.error('❌ Error:', e.message);
    return false;
  }
}

async function verifyTables() {
  console.log('\n📊 Verifying tables exist...');
  console.log('=' .repeat(60));
  
  const tables = ['users', 'leases', 'messages'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`  ❌ ${table}: TABLE DOES NOT EXIST`);
        } else {
          console.log(`  ❌ ${table}: ERROR - ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${table}: EXISTS (${count} rows)`);
      }
    } catch (e) {
      console.log(`  ❌ ${table}: ERROR - ${e.message}`);
    }
  }
}

async function main() {
  console.log('🚀 DATABASE MIGRATION TOOL');
  console.log('Project: landlord-bot-testing');
  console.log('URL:', supabaseUrl);
  
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  // Apply migrations in order
  const migrations = [
    {
      file: '20260324000100_create_leases_messages_tables.sql',
      desc: 'Create leases and messages tables with RLS'
    },
    {
      file: '20260324000200_fix_users_rls_policies.sql',
      desc: 'Fix users table RLS policies'
    }
  ];
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.file);
    if (fs.existsSync(filePath)) {
      const success = await applyMigration(filePath, migration.desc);
      if (!success) allSuccess = false;
    } else {
      console.log(`❌ Migration file not found: ${migration.file}`);
      allSuccess = false;
    }
  }
  
  await verifyTables();
  
  console.log('\n' + '='.repeat(60));
  if (allSuccess) {
    console.log('✅ ALL MIGRATIONS APPLIED SUCCESSFULLY');
  } else {
    console.log('⚠️  SOME MIGRATIONS FAILED - MANUAL EXECUTION REQUIRED');
    console.log('\n📖 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qmnngzevquidtvcopjcu/sql/new');
    console.log('2. Copy the SQL from the migrations above');
    console.log('3. Click Run to execute each migration');
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
