@echo off
echo 🚀 Starting Vision79 SIWM Development Environment...
echo.

REM Check if PowerShell is available
powershell -Command "& {.\start-dev.ps1}" 2>nul
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
    echo 🚀 Starting development server...
    
    REM Start the application
    npm run dev
) else (
    echo ✅ Development environment started successfully!
)

pause 