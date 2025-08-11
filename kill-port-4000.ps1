# PowerShell script to kill process on port 4000
Write-Host "Checking for processes on port 4000..." -ForegroundColor Yellow

try {
    # Find process using port 4000
    $processes = netstat -ano | Select-String ":4000" | ForEach-Object {
        $parts = $_.ToString().Split() | Where-Object { $_ -ne "" }
        if ($parts.Count -ge 5) {
            [PSCustomObject]@{
                Protocol = $parts[0]
                LocalAddress = $parts[1]
                ForeignAddress = $parts[2]
                State = $parts[3]
                PID = $parts[4]
            }
        }
    }

    if ($processes) {
        foreach ($proc in $processes) {
            Write-Host "Found process on port 4000:" -ForegroundColor Red
            Write-Host "  PID: $($proc.PID)" -ForegroundColor Cyan
            Write-Host "  State: $($proc.State)" -ForegroundColor Cyan
            
            try {
                $processName = (Get-Process -Id $proc.PID -ErrorAction Stop).ProcessName
                Write-Host "  Process: $processName" -ForegroundColor Cyan
                
                Write-Host "Killing process..." -ForegroundColor Yellow
                Stop-Process -Id $proc.PID -Force -ErrorAction Stop
                Write-Host "Process killed successfully!" -ForegroundColor Green
            }
            catch {
                Write-Host "Error killing process: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No process found on port 4000. Port is free to use." -ForegroundColor Green
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


