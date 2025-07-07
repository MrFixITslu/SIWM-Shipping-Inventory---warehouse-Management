@echo off
echo ========================================
echo Vision79 SIWM - Public IP Access Setup
echo ========================================
echo.

echo Step 1: Finding your network information...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

REM Get public IP address
for /f %%a in ('curl -s ifconfig.me') do set PUBLIC_IP=%%a

echo Local IP Address: %LOCAL_IP%
echo Public IP Address: %PUBLIC_IP%
echo.

echo Step 2: Checking if backend is running...
netstat -an | findstr :4000 >nul
if %errorlevel% equ 0 (
    echo [INFO] Backend is running on port 4000
) else (
    echo [WARNING] Backend is not running on port 4000
    echo Please start the backend server first
    pause
    exit /b 1
)

echo.
echo Step 3: Creating environment configuration...
echo.

REM Create backend .env if it doesn't exist
if not exist "backend\.env" (
    echo Creating backend .env file...
    (
        echo # Vision79 SIWM Backend Configuration
        echo NODE_ENV=development
        echo PORT=4000
        echo HOST=0.0.0.0
        echo.
        echo # Public IP Access Configuration
        echo ALLOW_PUBLIC_IP=true
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
        echo.
        echo # Database Configuration
        echo DB_USER=your_db_user
        echo DB_PASSWORD=your_db_password
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=vision79_siwm
        echo.
        echo # Email Service Configuration ^(optional^)
        echo EMAIL_HOST=smtp.gmail.com
        echo EMAIL_PORT=587
        echo EMAIL_USER=your_email@gmail.com
        echo EMAIL_PASS=your_email_app_password
        echo.
        echo # AI Services Configuration ^(optional^)
        echo GEMINI_API_KEY=your_gemini_api_key_here
    ) > backend\.env
    echo [SUCCESS] Created backend\.env file
) else (
    echo [INFO] backend\.env already exists
)

echo.
echo Step 4: Testing connectivity...
echo.

echo Testing local access...
curl -s http://localhost:4000/api/v1 >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Local access working
) else (
    echo [ERROR] Local access failed
)

echo.
echo Step 5: Configuration Summary
echo =============================
echo.
echo Backend URL: http://%LOCAL_IP%:4000
echo Public URL: http://%PUBLIC_IP%:4000
echo.
echo To allow external access:
echo 1. Configure your router's port forwarding
echo 2. Open Windows Firewall for port 4000
echo 3. Ensure ALLOW_PUBLIC_IP=true in backend\.env
echo.
echo Test external access with:
echo curl http://%PUBLIC_IP%:4000/api/v1
echo.
echo ========================================
echo Setup complete! Press any key to exit...
pause >nul

echo Setting up Vision79 SIWM for public access...

REM Set environment variables for public access
set ALLOW_PUBLIC_IP=true
set NODE_ENV=development

echo Environment variables set:
echo   ALLOW_PUBLIC_IP = %ALLOW_PUBLIC_IP%
echo   NODE_ENV = %NODE_ENV%

echo.
echo Starting backend server...
echo The backend will be accessible on all network interfaces (0.0.0.0:4000)

REM Start the backend server
cd backend
node server.js 