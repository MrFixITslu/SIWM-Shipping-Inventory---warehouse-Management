@echo off
echo ========================================
echo Starting Vision79 Backend API on port 3000
echo ========================================
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ERROR: Backend directory not found!
    echo Please ensure you are running this from the project root directory.
    pause
    exit /b 1
)

REM Check if server-alternative.js exists
if not exist "backend\server-alternative.js" (
    echo ERROR: server-alternative.js not found in backend directory!
    echo Please ensure the backend files are properly installed.
    pause
    exit /b 1
)

REM Check if node_modules exists in backend
if not exist "backend\node_modules" (
    echo WARNING: Backend node_modules not found. Installing dependencies...
    cd backend
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies!
        pause
        exit /b 1
    )
    cd ..
    echo Dependencies installed successfully.
    echo.
)

REM Set environment variables
set ALLOW_PUBLIC_IP=true
set NODE_ENV=production
set PORT=3000

echo Environment variables set:
echo   ALLOW_PUBLIC_IP = %ALLOW_PUBLIC_IP%
echo   NODE_ENV = %NODE_ENV%
echo   PORT = %PORT%

echo.
echo Starting backend server on port 3000...
echo The backend will be accessible at: http://localhost:3000/api/v1
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the alternative server
cd backend
node server-alternative.js

REM If we get here, the server has stopped
echo.
echo Server has stopped. Press any key to exit...
pause >nul 