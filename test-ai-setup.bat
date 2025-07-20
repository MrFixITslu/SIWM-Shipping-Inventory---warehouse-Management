@echo off
echo Testing AI Setup and Rate Limiting
echo ===================================
echo.

echo 1. Testing rate limiting middleware...
cd backend
node test-ai-rate-limiting.js
echo.

echo 2. Testing rate limiting integration...
node test-rate-limit-integration.js
echo.

echo 3. To disable rate limiting for debugging, set environment variable:
echo    set DISABLE_AI_RATE_LIMIT=true
echo.

echo 4. Current rate limit settings:
echo    - Development: 30 requests per minute
echo    - Production: 10 requests per minute
echo    - AI endpoints: 15 requests per minute (custom)
echo.

echo 5. To test with rate limiting disabled:
echo    set DISABLE_AI_RATE_LIMIT=true && npm start
echo.

pause 