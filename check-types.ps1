# Simple TypeScript error checker for DashboardSmart.tsx
$errors = & .\node_modules\.bin\tsc --noEmit --skipLibCheck 2>&1 | Select-String -Pattern "error TS"
Write-Host "Found $($errors.Count) TypeScript errors"
if ($errors.Count -gt 0) {
    $errors | Select-Object -First 10
}
