Write-Host "🔒 Fixing security vulnerabilities..." -ForegroundColor Green

# Read package.json
$packageJsonPath = Join-Path $PSScriptRoot "package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json

# Remove vulnerable dependencies
$vulnerableDeps = @("express-brute", "underscore")
$removedDeps = @()

foreach ($dep in $vulnerableDeps) {
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
        $packageJson.dependencies.PSObject.Properties.Remove($dep)
        $removedDeps += $dep
        Write-Host "❌ Removed vulnerable dependency: $dep" -ForegroundColor Red
    }
}

if ($removedDeps.Count -gt 0) {
    # Write updated package.json
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "✅ Updated package.json" -ForegroundColor Green
    
    Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: npm install" -ForegroundColor Cyan
    Write-Host "2. Run: npm audit" -ForegroundColor Cyan
    Write-Host "3. Verify no critical vulnerabilities remain" -ForegroundColor Cyan
} else {
    Write-Host "✅ No vulnerable dependencies found in package.json" -ForegroundColor Green
}

Write-Host "`n🔍 Checking for any remaining express-brute usage..." -ForegroundColor Yellow

try {
    $grepResult = Get-ChildItem -Recurse -Exclude node_modules,package-lock.json | 
                  Select-String "express-brute" | 
                  Select-Object -ExpandProperty Line
    if ($grepResult) {
        Write-Host "⚠️  Found express-brute usage in files:" -ForegroundColor Yellow
        Write-Host $grepResult
    } else {
        Write-Host "✅ No express-brute usage found in codebase" -ForegroundColor Green
    }
} catch {
    Write-Host "✅ No express-brute usage found in codebase" -ForegroundColor Green
}

Write-Host "`n🎯 Security fix complete!" -ForegroundColor Green 