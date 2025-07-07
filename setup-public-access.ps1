# Vision79 SIWM - Public IP Access Setup Script
# Run this script as Administrator for full functionality

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vision79 SIWM - Public IP Access Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Finding your network information..." -ForegroundColor Yellow
Write-Host ""

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"} | Select-Object -First 1).IPAddress

# Get public IP address
try {
    $publicIP = (Invoke-RestMethod -Uri "https://ifconfig.me" -TimeoutSec 10)
} catch {
    Write-Host "[WARNING] Could not retrieve public IP address" -ForegroundColor Yellow
    $publicIP = "unknown"
}

Write-Host "Local IP Address: $localIP" -ForegroundColor Green
Write-Host "Public IP Address: $publicIP" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking if backend is running..." -ForegroundColor Yellow
$backendRunning = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "[SUCCESS] Backend is running on port 4000" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Backend is not running on port 4000" -ForegroundColor Yellow
    Write-Host "Please start the backend server first" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating environment configuration..." -ForegroundColor Yellow
Write-Host ""

# Create backend .env if it doesn't exist
$envPath = "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Vision79 SIWM Backend Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Public IP Access Configuration
ALLOW_PUBLIC_IP=true

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# Database Configuration
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vision79_siwm

# Email Service Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# AI Services Configuration (optional)
GEMINI_API_KEY=your_gemini_api_key_here
"@

    Set-Content -Path $envPath -Value $envContent
    Write-Host "[SUCCESS] Created backend\.env file" -ForegroundColor Green
} else {
    Write-Host "[INFO] backend\.env already exists" -ForegroundColor Blue
}

Write-Host ""
Write-Host "Step 4: Testing connectivity..." -ForegroundColor Yellow
Write-Host ""

# Test local access
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/v1" -TimeoutSec 5
    Write-Host "[SUCCESS] Local access working" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Local access failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 5: Firewall Configuration" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($isAdmin) {
    Write-Host "Adding firewall rule for port 4000..." -ForegroundColor Yellow
    try {
        New-NetFirewallRule -DisplayName "Vision79 SIWM Backend" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -ErrorAction SilentlyContinue
        Write-Host "[SUCCESS] Firewall rule added" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] Firewall rule may already exist" -ForegroundColor Blue
    }
} else {
    Write-Host "[WARNING] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Please run this script as Administrator to configure firewall" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 6: Configuration Summary" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Backend URL: http://$localIP`:4000" -ForegroundColor Green
Write-Host "Public URL: http://$publicIP`:4000" -ForegroundColor Green
Write-Host ""

Write-Host "To allow external access:" -ForegroundColor Cyan
Write-Host "1. Configure your router's port forwarding" -ForegroundColor White
Write-Host "2. Ensure ALLOW_PUBLIC_IP=true in backend\.env" -ForegroundColor White
Write-Host "3. Restart the backend server" -ForegroundColor White
Write-Host ""

Write-Host "Test external access with:" -ForegroundColor Cyan
Write-Host "curl http://$publicIP`:4000/api/v1" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Read-Host "Press Enter to exit"

# Setup script for public access to Vision79 SIWM application
Write-Host "Setting up Vision79 SIWM for public access..." -ForegroundColor Green

# Set environment variables for public access
$env:ALLOW_PUBLIC_IP = "true"
$env:NODE_ENV = "development"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "  ALLOW_PUBLIC_IP = $env:ALLOW_PUBLIC_IP" -ForegroundColor Cyan
Write-Host "  NODE_ENV = $env:NODE_ENV" -ForegroundColor Cyan

Write-Host "`nStarting backend server..." -ForegroundColor Green
Write-Host "The backend will be accessible on all network interfaces (0.0.0.0:4000)" -ForegroundColor Yellow

# Start the backend server
cd backend
node server.js 