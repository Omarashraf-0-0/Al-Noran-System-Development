# تشغيل السيرفر في نافذة PowerShell منفصلة
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Al Noran\Al-Noran-System-Development\Web\backend'; Write-Host '🚀 Starting Al-Noran Backend Server...' -ForegroundColor Green; Write-Host 'Server URL: http://localhost:3500' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Yellow; Write-Host '='*50; node src/server.js"
Write-Host "✅ Server started in a new window!" -ForegroundColor Green
Write-Host "Check the new PowerShell window for server status" -ForegroundColor Cyan
