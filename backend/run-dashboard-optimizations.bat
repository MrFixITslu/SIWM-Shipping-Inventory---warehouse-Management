@echo off
echo Starting Dashboard Performance Optimizations...
echo.

set DB_USER=vision79_user
set DB_PASSWORD=pacalive15$
set DB_NAME=vision79siwm
set DB_HOST=localhost
set DB_PORT=5432

echo Database Configuration:
echo   User: %DB_USER%
echo   Database: %DB_NAME%
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo.

node run-dashboard-optimizations-robust.js

echo.
echo Optimization completed!
pause 