# Vision79 SIWM Simple Development Startup Script

Write-Host "Starting Vision79 SIWM Development Environment..." -ForegroundColor Green

# Check if environment files exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "VITE_API_BASE_URL=http://localhost:4000/api/v1" | Out-File -FilePath ".env" -Encoding UTF8
}

if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item "backend\.env.production.backup" "backend\.env" -ErrorAction SilentlyContinue
}

# Start the development environment
Write-Host "Starting development servers..." -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Blue
Write-Host "Backend: http://localhost:4000" -ForegroundColor Blue
Write-Host "Press Ctrl+C to stop" -ForegroundColor Blue

npm run dev 