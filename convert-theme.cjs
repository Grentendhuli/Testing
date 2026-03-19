const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/DashboardSmart.tsx',
  'src/pages/Units.tsx',
  'src/pages/RentCollection.tsx',
  'src/pages/Leases.tsx',
  'src/pages/Leads.tsx',
  'src/pages/Maintenance.tsx',
  'src/pages/MaintenanceSmart.tsx',
  'src/pages/Messages.tsx',
  'src/pages/Reports.tsx',
  'src/pages/Config.tsx',
  'src/pages/Billing.tsx',
  'src/components/Sidebar.tsx',
  'src/App.tsx'
];

const replacements = [
  // Backgrounds - dark to light
  { from: /bg-slate-950\/80/g, to: 'bg-slate-100/80' },
  { from: /bg-slate-900\/50/g, to: 'bg-white' },
  { from: /bg-slate-800\/50/g, to: 'bg-slate-50' },
  { from: /bg-slate-950/g, to: 'bg-slate-100' },
  { from: /bg-slate-900/g, to: 'bg-white' },
  { from: /bg-slate-800/g, to: 'bg-slate-100' },
  { from: /bg-slate-700/g, to: 'bg-slate-200' },
  { from: /bg-slate-600/g, to: 'bg-slate-300' },
  
  // Text - light to dark  
  { from: /text-slate-100/g, to: 'text-slate-900' },
  { from: /text-slate-200/g, to: 'text-slate-800' },
  { from: /text-slate-300/g, to: 'text-slate-700' },
  { from: /text-slate-400(?![-/])/g, to: 'text-slate-600' }, // avoid matching text-slate-400/20 etc
  
  // Borders
  { from: /border-slate-800/g, to: 'border-slate-200' },
  { from: /border-slate-700/g, to: 'border-slate-300' },
  { from: /border-slate-600/g, to: 'border-slate-400' },
  
  // Emerald dark to light (except buttons)
  { from: /bg-emerald-950/g, to: 'bg-emerald-50' },
  { from: /bg-emerald-900\/30/g, to: 'bg-emerald-100' },
  { from: /bg-emerald-900\/20/g, to: 'bg-emerald-50' },
  { from: /bg-emerald-900/g, to: 'bg-emerald-100' },
  { from: /bg-emerald-800\/40/g, to: 'bg-emerald-50' },
  { from: /bg-emerald-800/g, to: 'bg-emerald-100' },
  { from: /border-emerald-900/g, to: 'border-emerald-200' },
  { from: /border-emerald-800/g, to: 'border-emerald-300' },
  { from: /border-emerald-700/g, to: 'border-emerald-200' },
  { from: /from-emerald-900\/90/g, to: 'from-emerald-100' },
  { from: /to-emerald-900\/80/g, to: 'to-emerald-50' },
  { from: /to-emerald-950/g, to: 'to-emerald-50' },
  { from: /to-emerald-900/g, to: 'to-emerald-100' },
  
  // Amber darks
  { from: /bg-amber-900\/30/g, to: 'bg-amber-50' },
  { from: /bg-amber-900\/20/g, to: 'bg-amber-50' },
  { from: /border-amber-900/g, to: 'border-amber-200' },
  
  // Red darks
  { from: /bg-red-900\/30/g, to: 'bg-red-50' },
  { from: /bg-red-900\/20/g, to: 'bg-red-50' },
  
  // Blue darks  
  { from: /bg-blue-900\/20/g, to: 'bg-blue-50' },
  
  // Purple darks
  { from: /bg-purple-900\/20/g, to: 'bg-purple-50' },
  
  // Form inputs
  { from: /bg-slate-800 border-slate-700/g, to: 'bg-white border-slate-300' },
  
  // Placeholder
  { from: /placeholder-slate-500/g, to: 'placeholder-slate-400' },
  
  // Modal backdrops (keep dark but lighter)
  { from: /bg-black\/50/g, to: 'bg-slate-200/70' },
  
  // Keep text-emerald-400 for accent
  // Keep text-amber-400 for warnings
  
  // Dark text on emerald backgrounds should stay light
  // but we'll handle that with manual review
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Converted ${file}`);
});

console.log('\n🎉 All files converted!');
