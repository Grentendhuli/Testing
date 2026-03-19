# Theme Conversion Script for LandlordBot
# Converts dark mode (slate-900/800) to light theme (white/slate-100)

param([string]$File)

$content = Get-Content -Raw $File

# Background replacements
$content = $content -replace 'bg-slate-950/80', 'bg-slate-100/80'  # Modal backdrop
$content = $content -replace 'bg-slate-900/50', 'bg-white'           # Cards/panels
$content = $content -replace 'bg-slate-800/50', 'bg-slate-50'          # Subtle backgrounds
$content = $content -replace 'bg-slate-800', 'bg-slate-100'            # Primary dark bg
$content = $content -replace 'bg-slate-900', 'bg-white'              # Pure dark
$content = $content -replace 'bg-slate-950', 'bg-slate-100'          # Darkest

# Text replacements (preserve white text over emerald/emerald elements)
$content = $content -replace 'text-slate-100', 'text-slate-900'
$content = $content -replace 'text-slate-200', 'text-slate-800'
$content = $content -replace 'text-slate-300', 'text-slate-700'
$content = $content -replace 'text-slate-400', 'text-slate-600'

# Border replacements
$content = $content -replace 'border-slate-800', 'border-slate-200'
$content = $content -replace 'border-slate-700', 'border-slate-300'
$content = $content -replace 'border-slate-600', 'border-slate-400'

# Emerald dark to light
$content = $content -replace 'bg-emerald-950', 'bg-emerald-50'
$content = $content -replace 'bg-emerald-900/30', 'bg-emerald-100'
$content = $content -replace 'bg-emerald-900/20', 'bg-emerald-50'
$content = $content -replace 'bg-emerald-900', 'bg-emerald-100'
$content = $content -replace 'bg-emerald-800', 'bg-emerald-100'
$content = $content -replace 'bg-emerald-800/40', 'bg-emerald-50'
$content = $content -replace 'border-emerald-900', 'border-emerald-200'
$content = $content -replace 'from-emerald-900/90', 'from-emerald-100'
$content = $content -replace 'to-emerald-900/80', 'to-emerald-50'
$content = $content -replace 'to-emerald-950', 'to-emerald-50'
$content = $content -replace 'to-emerald-900', 'to-emerald-100'
$content = $content -replace 'shadow-emerald-900/30', 'shadow-emerald-200'

# Amber dark to light
$content = $content -replace 'bg-amber-900/30', 'bg-amber-50'
$content = $content -replace 'bg-amber-900/20', 'bg-amber-50'
$content = $content -replace 'border-amber-900', 'border-amber-200'

# Form inputs
$content = $content -replace 'bg-slate-800 border-slate-700', 'bg-white border-slate-300'

# Placeholder and other dark colors
$content = $content -replace 'placeholder-slate-500', 'placeholder-slate-400'
$content = $content -replace 'bg-slate-700', 'bg-slate-200'
$content = $content -replace 'bg-slate-600', 'bg-slate-300'
$content = $content -replace 'bg-black/50', 'bg-slate-200/50'

$content | Set-Content $File -NoNewline
Write-Host "Converted $File"
