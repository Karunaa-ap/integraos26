@echo off
setlocal EnableDelayedExpansion

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo   ERROR: Administrator privileges required!
    echo ═══════════════════════════════════════════════════════
    echo.
    echo Please RIGHT-CLICK this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

cls
echo.
echo ═══════════════════════════════════════════════════════
echo   Integra OS - HTTPS Certificate Installation
echo ═══════════════════════════════════════════════════════
echo.
echo This will install the HTTPS certificate to make the
echo kiosk connection secure and remove browser warnings.
echo.
echo This only needs to be done ONCE per kiosk.
echo.
pause

:: Find the certificate file
set CERT_FILE=%~dp0certs\server-cert.pem

if not exist "!CERT_FILE!" (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo   ERROR: Certificate file not found!
    echo ═══════════════════════════════════════════════════════
    echo.
    echo Expected location: !CERT_FILE!
    echo.
    echo Please run Server.exe first to generate the certificate.
    echo.
    pause
    exit /b 1
)

echo.
echo Found certificate: !CERT_FILE!
echo.
echo Installing certificate to Trusted Root Certification Authorities...
echo.

:: Install the certificate
certutil -addstore -f "Root" "!CERT_FILE!"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo   SUCCESS! Certificate installed successfully.
    echo ═══════════════════════════════════════════════════════
    echo.
    echo The kiosk will now show a secure HTTPS connection.
    echo Browser security warnings will no longer appear.
    echo.
    echo You can now close this window and start using IntegraOS.
    echo.
) else (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo   ERROR: Failed to install certificate.
    echo ═══════════════════════════════════════════════════════
    echo.
    echo Please ensure you ran this script as Administrator.
    echo.
)

echo.
echo Press any key to close...
pause >nul
