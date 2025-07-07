@echo off
echo Starting Vision79 Backend API on port 5176...
echo This will allow the backend to be accessible from your public IP

REM Set environment variables
set ALLOW_PUBLIC_IP=true
set NODE_ENV=development

echo Environment variables set:
echo   ALLOW_PUBLIC_IP = %ALLOW_PUBLIC_IP%
echo   NODE_ENV = %NODE_ENV%

echo.
echo Starting backend server on port 5176...
echo The backend will be accessible at: http://199.223.249.8:5176/api/v1

REM Start the alternative server
cd backend
node server-alternative.js 