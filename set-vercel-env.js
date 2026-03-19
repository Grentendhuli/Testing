// Set Vercel environment variables via REST API
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'vcp_5nInMDEfubHwJwjLJY13VebqTloGGaGd7CREEKam9RrlIe0ruT2kSNsz';

// Project configs
const projects = [
  {
    name: 'landlord-bot-live',
    projectId: 'prj_landlord-bot-live', // Will discover from API
    envVars: [
      { key: 'VITE_SUPABASE_URL', value: 'https://qmnngzevquidtvcopjcu.supabase.co', target: ['production', 'preview'], type: 'plain' },
      { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY0MDgsImV4cCI6MjA4NzY0MjQwOH0.tVOtTl1C-FxddhspvFUQqO9_lDLCUuv6zs-1VwapoX0', target: ['production', 'preview'], type: 'plain' }
    ]
  },
  {
    name: 'landlord-saas-dashboard',
    projectId: 'prj_landlord-saas-dashboard', // Will discover from API
    envVars: [
      { key: 'VITE_SUPABASE_URL', value: 'https://ylunzjrpunudqngvgcba.supabase.co', target: ['production', 'preview'], type: 'plain' },
      { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW56anJwdW51ZHFuZ3ZnY2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjI3MDUsImV4cCI6MjA4ODMzODcwNX0.ZoPRV6ZvnHRZWb36iyUNpaJz2cNkPWzoKUU2weRFZoU', target: ['production', 'preview'], type: 'plain' },
      { key: 'VITE_DEMO_EMAIL', value: 'demo@landlordbot.app', target: ['production', 'preview'], type: 'plain' },
      { key: 'VITE_DEMO_PASSWORD', value: 'DemoPassword123!', target: ['production', 'preview'], type: 'plain' }
    ]
  }
];

async function getProjects() {
  console.log('Fetching Vercel projects...\n');
  const res = await fetch('https://api.vercel.com/v9/projects', {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${await res.text()}`);
  }
  
  const data = await res.json();
  return data.projects;
}

async function setEnvVar(projectId, envVar) {
  const url = `https://api.vercel.com/v10/projects/${projectId}/env`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(envVar)
  });
  
  if (!res.ok) {
    const error = await res.text();
    // If it already exists, that's fine
    if (error.includes('already exists')) {
      console.log(`  ⚠️  ${envVar.key} already exists (skipping)`);
      return true;
    }
    throw new Error(`Failed to set ${envVar.key}: ${error}`);
  }
  
  console.log(`  ✅ ${envVar.key}`);
  return true;
}

async function main() {
  try {
    const projects = await getProjects();
    
    // Find our specific projects
    const liveProject = projects.find(p => p.name === 'landlord-bot-live');
    const demoProject = projects.find(p => p.name === 'LandlordBot');
    
    if (!liveProject) console.log('⚠️ landlord-bot-live project not found');
    if (!demoProject) console.log('⚠️ LandlordBot project not found');
    
    // Set env vars for live project
    if (liveProject) {
      console.log(`\n🚀 Setting env vars for ${liveProject.name}:`);
      for (const envVar of [
        { key: 'VITE_SUPABASE_URL', value: 'https://qmnngzevquidtvcopjcu.supabase.co', target: ['production', 'preview'], type: 'plain' },
        { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbm5nemV2cXVpZHR2Y29wamN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjY0MDgsImV4cCI6MjA4NzY0MjQwOH0.tVOtTl1C-FxddhspvFUQqO9_lDLCUuv6zs-1VwapoX0', target: ['production', 'preview'], type: 'plain' }
      ]) {
        await setEnvVar(liveProject.id, envVar);
      }
    }
    
    // Set env vars for demo project
    if (demoProject) {
      console.log(`\n🎮 Setting env vars for ${demoProject.name}:`);
      for (const envVar of [
        { key: 'VITE_SUPABASE_URL', value: 'https://ylunzjrpunudqngvgcba.supabase.co', target: ['production', 'preview'], type: 'plain' },
        { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW56anJwdW51ZHFuZ3ZnY2JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjI3MDUsImV4cCI6MjA4ODMzODcwNX0.ZoPRV6ZvnHRZWb36iyUNpaJz2cNkPWzoKUU2weRFZoU', target: ['production', 'preview'], type: 'plain' },
        { key: 'VITE_DEMO_EMAIL', value: 'demo@landlordbot.app', target: ['production', 'preview'], type: 'plain' },
        { key: 'VITE_DEMO_PASSWORD', value: 'DemoPassword123!', target: ['production', 'preview'], type: 'plain' }
      ]) {
        await setEnvVar(demoProject.id, envVar);
      }
    }
    
    console.log('\n✅ Environment variables set successfully!');
    console.log('\nVercel will redeploy automatically. Monitor deployments at:');
    if (liveProject) console.log(`  • https://vercel.com/${liveProject.accountId}/${liveProject.name}`);
    if (demoProject) console.log(`  • https://vercel.com/${demoProject.accountId}/${demoProject.name}`);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();