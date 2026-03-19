const https = require('https');

async function executeSQL() {
  const sql = `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, phone_number, property_address, subscription_tier, subscription_status, max_units, storage_used, storage_limit)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone_number', ''), COALESCE(NEW.raw_user_meta_data->>'property_address', ''), 'free', 'active', -1, 0, 1073741824)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  const postData = JSON.stringify({ query: sql });
  
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: '/v1/projects/qmnngzevquidtvcopjcu/database/query',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA2NjQwOCwiZXhwIjoyMDg3NjQyNDA4fQ.BY06MT7eqDsIdyuLLWtFQGVvcL5bUFN2BHa2pDcJP94',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

executeSQL().then(() => console.log('Done')).catch(e => { console.error(e); process.exit(1); });