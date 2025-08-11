# Vision79 SIWM Production Startup Script
# This script starts the application in production mode

param(
    [switch]$SkipBuild,
    [string]$FrontendPort = "4173",
    [string]$BackendPort = "4000"
)

Write-Host "🚀 Starting Vision79 SIWM in Production Mode..." -ForegroundColor Green

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Kill processes on required ports if they exist
Write-Host "🔍 Checking for existing processes..." -ForegroundColor Yellow

if (Test-Port $BackendPort) {
    Write-Host "⚠️  Port $BackendPort is in use. Attempting to free it..." -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
    $processes | ForEach-Object { 
        Write-Host "Killing process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force 
    }
    Start-Sleep -Seconds 2
}

if (Test-Port $FrontendPort) {
    Write-Host "⚠️  Port $FrontendPort is in use. Attempting to free it..." -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
    $processes | ForEach-Object { 
        Write-Host "Killing process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force 
    }
    Start-Sleep -Seconds 2
}

# Check for environment file
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ Backend .env file not found!" -ForegroundColor Red
    Write-Host "📋 Please create backend\.env with the following variables:" -ForegroundColor Yellow
    Write-Host "   NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   PORT=$BackendPort" -ForegroundColor Gray
    Write-Host "   DB_HOST=localhost" -ForegroundColor Gray
    Write-Host "   DB_PORT=5432" -ForegroundColor Gray
    Write-Host "   DB_NAME=your_database_name" -ForegroundColor Gray
    Write-Host "   DB_USER=your_database_user" -ForegroundColor Gray
    Write-Host "   DB_PASSWORD=your_database_password" -ForegroundColor Gray
    Write-Host "   JWT_SECRET=your_jwt_secret" -ForegroundColor Gray
    exit 1
}

# Build frontend if not skipped
if (-not $SkipBuild) {
    Write-Host "🔨 Building frontend for production..." -ForegroundColor Blue
    npm run build:production
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Frontend build completed!" -ForegroundColor Green
}

# Start backend in background
Write-Host "🚀 Starting backend server on port $BackendPort..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    param($BackendPort)
    Set-Location $using:PWD
    $env:NODE_ENV = "production"
    $env:PORT = $BackendPort
    Set-Location backend
    npm start
} -ArgumentList $BackendPort

Start-Sleep -Seconds 3

# Start frontend preview server
Write-Host "🌐 Starting frontend preview server on port $FrontendPort..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    param($FrontendPort)
    Set-Location $using:PWD
    $env:NODE_ENV = "production"
    npm run preview -- --port $FrontendPort
} -ArgumentList $FrontendPort

# Wait a bit for servers to start
Start-Sleep -Seconds 5

# Check if servers are running
Write-Host "🔍 Checking server status..." -ForegroundColor Yellow

if (Test-Port $BackendPort) {
    Write-Host "✅ Backend server is running on http://localhost:$BackendPort" -ForegroundColor Green
} else {
    Write-Host "❌ Backend server failed to start!" -ForegroundColor Red
}

if (Test-Port $FrontendPort) {
    Write-Host "✅ Frontend server is running on http://localhost:$FrontendPort" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend server failed to start!" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Vision79 SIWM is now running in production mode!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:$BackendPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers and exit." -ForegroundColor Yellow

# Wait for user interrupt
try {
    Wait-Job $backendJob, $frontendJob
}
finally {
    Write-Host "🛑 Stopping servers..." -ForegroundColor Red
    Stop-Job $backendJob, $frontendJob -PassThru | Remove-Job
}
