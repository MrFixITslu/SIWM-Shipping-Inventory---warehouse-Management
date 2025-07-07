# PowerShell script to set up network access for the Vision79 SIWM application

Write-Host "🌐 Vision79 SIWM - Network Access Setup" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Get network interfaces
$interfaces = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -notlike "*Loopback*" }

if ($interfaces.Count -eq 0) {
    Write-Host "❌ No active network interfaces found." -ForegroundColor Red
    Write-Host "Make sure your computer is connected to a network." -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Active Network Interfaces:" -ForegroundColor Green
$interfaces | ForEach-Object {
    $ip = Get-NetIPAddress -InterfaceIndex $_.InterfaceIndex -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "169.254.*" }
    if ($ip) {
        Write-Host "   Interface: $($_.Name)" -ForegroundColor White
        Write-Host "   IP Address: $($ip.IPAddress)" -ForegroundColor Yellow
        Write-Host "   Status: $($_.Status)" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "🚀 Access URLs for Other Devices:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$interfaces | ForEach-Object {
    $ip = Get-NetIPAddress -InterfaceIndex $_.InterfaceIndex -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "169.254.*" }
    if ($ip) {
        Write-Host ""
        Write-Host "📱 From Device ($($_.Name)):" -ForegroundColor Green
        Write-Host "   Frontend: http://$($ip.IPAddress):5176" -ForegroundColor Yellow
        Write-Host "   Backend API: http://$($ip.IPAddress):4000/api/v1" -ForegroundColor Yellow
        Write-Host "   HTTPS Frontend: https://$($ip.IPAddress):5176" -ForegroundColor Yellow
        Write-Host "   HTTPS Backend: https://$($ip.IPAddress):4000/api/v1" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Configuration Notes:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "• The servers are now configured to listen on all network interfaces (0.0.0.0)" -ForegroundColor White
Write-Host "• CORS is configured to allow access from network devices" -ForegroundColor White
Write-Host "• Make sure Windows Firewall allows connections on ports 4000 and 5176" -ForegroundColor White
Write-Host "• For production, consider using a reverse proxy like nginx" -ForegroundColor White

Write-Host ""
Write-Host "🛡️  Security Considerations:" -ForegroundColor Red
Write-Host "===========================" -ForegroundColor Red
Write-Host "• This configuration allows access from any device on your network" -ForegroundColor Yellow
Write-Host "• For production deployment, use proper security measures" -ForegroundColor Yellow
Write-Host "• Consider using HTTPS certificates for secure access" -ForegroundColor Yellow
Write-Host "• Implement proper authentication and authorization" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. Start the application with: npm run dev" -ForegroundColor White
Write-Host "2. Test access from another device using the URLs above" -ForegroundColor White
Write-Host "3. If you have firewall issues, run: netsh advfirewall firewall add rule name='Vision79 Backend' dir=in action=allow protocol=TCP localport=4000" -ForegroundColor White
Write-Host "4. For frontend: netsh advfirewall firewall add rule name='Vision79 Frontend' dir=in action=allow protocol=TCP localport=5176" -ForegroundColor White

Write-Host ""
Write-Host "✅ Network access setup complete!" -ForegroundColor Green 