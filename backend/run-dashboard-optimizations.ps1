# Dashboard Performance Optimizations Script
Write-Host "Starting Dashboard Performance Optimizations..." -ForegroundColor Green
Write-Host ""

# Set database environment variables
$env:DB_USER = "vision79_user"
$env:DB_PASSWORD = "pacalive15$"
$env:DB_NAME = "vision79siwm"
$env:DB_HOST = "localhost"
$env:DB_PORT = "5432"

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  User: $env:DB_USER"
Write-Host "  Database: $env:DB_NAME"
Write-Host "  Host: $env:DB_HOST"
Write-Host "  Port: $env:DB_PORT"
Write-Host ""

try {
    node run-dashboard-optimizations-robust.js
    Write-Host ""
    Write-Host "Optimization completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Error during optimization: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 