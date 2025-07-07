@echo off
echo Opening port 4000 in Windows Firewall for Vision79 Backend API...
echo This script must be run as Administrator

REM Add firewall rule for port 4000
netsh advfirewall firewall add rule name="Vision79 Backend API" dir=in action=allow protocol=TCP localport=4000

if %errorlevel% equ 0 (
    echo Successfully opened port 4000 in Windows Firewall
    echo The backend API should now be accessible from external connections
) else (
    echo Failed to open port 4000. Please run this script as Administrator
)

echo.
echo Press any key to exit...
pause >nul 