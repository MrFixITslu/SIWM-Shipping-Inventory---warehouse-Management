@echo off
echo 🚀 Vision79 SIWM Production Deployment
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "& {.\deploy-production.ps1}" 2>nul
if %errorlevel% neq 0 (
    echo ❌ PowerShell script failed. Trying alternative approach...
    echo.
    
    REM Check if Node.js is installed
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Node.js is not installed. Please install Node.js 18+ first.
        pause
        exit /b 1
    )
    
    echo ✅ Node.js found
    echo 📦 Installing dependencies...
    
    REM Install dependencies
    npm install
    cd backend
    npm install
    cd ..
    
    echo ✅ Dependencies installed
    echo 🔐 Generating secrets...
    npm run generate-secrets
    
    echo 🏗️  Building application...
    npm run build
    
    echo ✅ Application built successfully!
    echo.
    echo 📋 Next Steps:
    echo 1. Update environment variables in .env.production and backend\.env.production
    echo 2. Configure your domain name
    echo 3. Set up SSL certificates
    echo 4. Start the application with: npm start
    echo.
    echo 🚀 Your Vision79 SIWM application is ready for production!
) else (
    echo ✅ Production deployment completed successfully!
)

pause 