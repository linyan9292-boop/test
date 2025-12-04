@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo      TRAE Offline Environment Setup
echo ==========================================
echo.
echo This script will:
echo 1. Auto-configure your Android SDK settings.
echo 2. Connect to the internet to DOWNLOAD all necessary dependencies.
echo 3. Cache them locally so you never need internet again for building.
echo.
echo [IMPORTANT] Please ensure you are connected to the internet now.
echo.
pause

:: Configure Java
set "JAVA_HOME=C:\PROGRA~1\Java\jdk-11"
if exist "!JAVA_HOME!" (
    set "PATH=!JAVA_HOME!\bin;!PATH!"
)

:: 1. Fix SDK Configuration
echo.
echo [1/3] Configuring Android SDK versions...
:: Use -NoProfile to avoid conflicts with user's PowerShell profiles (e.g. Anaconda)
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\FixSDK.ps1"

:: 2. Sync Capacitor
echo.
echo [2/3] Syncing Capacitor Project...
call npx cap sync android

:: 3. Download Dependencies via Gradle
echo.
echo [3/3] Downloading Android Dependencies (This may take a while)...
cd android

:: Configure Local Gradle
set "LOCAL_GRADLE_BIN=C:\Users\Leo\Desktop\dev\TRAE\TRAE2\test\gradle-7.5.1\bin\gradle.bat"

if not exist "!LOCAL_GRADLE_BIN!" (
    echo [Warning] Local Gradle not found at !LOCAL_GRADLE_BIN!
    echo Falling back to wrapper - may trigger gradle download...
    set "LOCAL_GRADLE_BIN=gradlew.bat"
)

echo Running Build to fetch dependencies...
call "!LOCAL_GRADLE_BIN!" assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Error] Setup failed. Please check your internet connection.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo      Setup Complete!
echo ==========================================
echo All dependencies have been downloaded to your local cache.
echo.
echo You can now run 'build-apk-final.bat' at any time WITHOUT internet.
echo.
pause
