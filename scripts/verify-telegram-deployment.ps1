# Telegram Bot Deployment Verification Script
# Run this script to check deployment status

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Telegram Bot Deployment Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
Write-Host "Step 1: Checking File Structure..." -ForegroundColor Yellow
$files = @(
    "supabase/functions/telegram-bot/index.ts",
    "supabase/migrations/20260311000000_telegram_tables.sql"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

# Check Supabase CLI availability
Write-Host "Step 2: Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Supabase CLI available: $version" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Supabase CLI not available" -ForegroundColor Red
        Write-Host "      Install with: npm install -g supabase" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Supabase CLI not available" -ForegroundColor Red
}

Write-Host ""

# Check environment
Write-Host "Step 3: Checking Environment..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "VITE_SUPABASE_SERVICE_ROLE_KEY") {
        Write-Host "  ✅ Service Role Key found in .env.local" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Service Role Key not found in .env.local" -ForegroundColor Yellow
    }
    
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "  ✅ Supabase URL found in .env.local" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Supabase URL not found in .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ .env.local not found" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

if ($allFilesExist) {
    Write-Host "All configuration files are ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Run SQL migration via Supabase Dashboard" -ForegroundColor White
    Write-Host "  2. Set Edge Function secrets" -ForegroundColor White
    Write-Host "  3. Deploy telegram-bot Edge Function" -ForegroundColor White
    Write-Host "  4. Configure Telegram webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "See TELEGRAM_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Gray
} else {
    Write-Host "Some files are missing. Please run the deployment setup first." -ForegroundColor Red
}

Write-Host ""
