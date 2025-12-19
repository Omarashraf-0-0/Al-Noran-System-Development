@echo off
echo Opening Windows Firewall for Port 3500...
echo.
echo Right-click this file and select "Run as Administrator"
echo.
pause

netsh advfirewall firewall delete rule name="Node.js Port 3500" >nul 2>&1
netsh advfirewall firewall add rule name="Node.js Port 3500" dir=in action=allow protocol=TCP localport=3500

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Firewall rule added successfully!
    echo Port 3500 is now open for incoming connections.
    echo.
) else (
    echo.
    echo [ERROR] Failed to add firewall rule.
    echo Please run this file as Administrator.
    echo.
)

pause
