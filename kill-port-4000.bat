@echo off
echo Killing process on port 4000...
echo.

REM Find process using port 4000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Found process with PID: %%a
    echo Killing process...
    taskkill /PID %%a /F
    echo Process killed successfully!
    goto :end
)

echo No process found on port 4000.
echo Port is free to use.

:end
echo.
echo Press any key to exit...
pause >nul


