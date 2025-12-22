@echo off
REM ============================================
REM Build Script for Noran Desktop Application
REM ============================================
REM This script builds the fat JAR and optionally creates an EXE installer

echo ==========================================
echo Building Noran Desktop Application
echo ==========================================

REM Step 1: Build the fat JAR
echo.
echo Step 1: Building fat JAR...
call mvn clean package -DskipTests

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Maven build failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Fat JAR created at target\NoranDesktopApp.jar
echo You can run it with: java -jar target\NoranDesktopApp.jar
echo.

REM Step 2: Ask if user wants to create EXE
set /p CREATE_EXE="Do you want to create a Windows EXE installer? (y/n): "
if /i "%CREATE_EXE%"=="y" goto :create_exe
if /i "%CREATE_EXE%"=="yes" goto :create_exe
goto :end

:create_exe
echo.
echo Step 2: Creating Windows EXE installer...
echo This requires JDK 17+ with jpackage tool

REM Check if jpackage exists
where jpackage >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: jpackage not found! Make sure JDK 17+ is installed and JAVA_HOME is set.
    pause
    exit /b 1
)

REM Create the EXE installer
jpackage ^
    --type exe ^
    --name "NoranDesktopApp" ^
    --app-version 1.0.0 ^
    --vendor "Noran" ^
    --description "Al Noran Desktop Application" ^
    --input target ^
    --main-jar NoranDesktopApp.jar ^
    --main-class noran.desktop.Launcher ^
    --dest target\installer ^
    --win-dir-chooser ^
    --win-menu ^
    --win-shortcut ^
    --icon src\main\resources\noran\desktop\images\logo.ico

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo NOTE: If icon not found, trying without icon...
    jpackage ^
        --type exe ^
        --name "NoranDesktopApp" ^
        --app-version 1.0.0 ^
        --vendor "Noran" ^
        --description "Al Noran Desktop Application" ^
        --input target ^
        --main-jar NoranDesktopApp.jar ^
        --main-class noran.desktop.Launcher ^
        --dest target\installer ^
        --win-dir-chooser ^
        --win-menu ^
        --win-shortcut
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Windows EXE installer created at target\installer\
    echo.
) else (
    echo ERROR: Failed to create EXE installer
)

:end
echo.
echo ==========================================
echo Build Complete!
echo ==========================================
echo.
echo Available outputs:
echo   - Fat JAR: target\NoranDesktopApp.jar
echo   - Run JAR: java -jar target\NoranDesktopApp.jar
echo.
pause
