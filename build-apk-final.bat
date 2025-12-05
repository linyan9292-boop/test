@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo      TRAE One-Click APK Builder
echo ==========================================

:: 1. Check Java - AGP 8.x requires JDK 17
set "JAVA_17_CANDIDATES=C:\PROGRA~1\Java\jdk-17;C:\Program Files\Java\jdk-17;C:\PROGRA~1\Java\jdk-17.0.2;C:\Program Files\Java\jdk-17.0.2;C:\Program Files\Microsoft\jdk-17"
for %%J in (!JAVA_17_CANDIDATES!) do (
    if exist "%%~J" (
        set "JAVA_HOME=%%~J"
        goto :java_found
    )
)
:java_warning
echo [Warn] Could not automatically find JDK 17. Using system default Java.
goto :java_done
:java_found
echo [Info] Using JAVA_HOME=!JAVA_HOME!
set "PATH=!JAVA_HOME!\bin;!PATH!"
:java_done

:: 2. Build Vue App
echo.
echo [1/3] Building Web App...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Build failed.
    pause
    exit /b 1
)

:: 3. Sync Capacitor
echo.
echo [2/3] Syncing to Android...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Sync failed.
    pause
    exit /b 1
)

:: 3.5 Patch regenerated Cordova Android plugins build.gradle to keep AGP 8 compatible settings
echo.
echo [Info] Patching Cordova Android plugins build.gradle...
echo ext { > android\capacitor-cordova-android-plugins\build.gradle
echo     androidxAppCompatVersion = project.hasProperty('androidxAppCompatVersion') ? rootProject.ext.androidxAppCompatVersion : '1.4.1' >> android\capacitor-cordova-android-plugins\build.gradle
echo     cordovaAndroidVersion = project.hasProperty('cordovaAndroidVersion') ? rootProject.ext.cordovaAndroidVersion : '10.1.1' >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo buildscript { >> android\capacitor-cordova-android-plugins\build.gradle
echo     repositories { >> android\capacitor-cordova-android-plugins\build.gradle
echo         google() >> android\capacitor-cordova-android-plugins\build.gradle
echo         mavenCentral() >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo     dependencies { >> android\capacitor-cordova-android-plugins\build.gradle
echo         classpath 'com.android.tools.build:gradle:8.1.1' >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo apply plugin: 'com.android.library' >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo android { >> android\capacitor-cordova-android-plugins\build.gradle
echo     namespace 'capacitor.android.plugins' >> android\capacitor-cordova-android-plugins\build.gradle
echo     compileSdkVersion project.hasProperty('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 32 >> android\capacitor-cordova-android-plugins\build.gradle
echo     defaultConfig { >> android\capacitor-cordova-android-plugins\build.gradle
echo         minSdkVersion project.hasProperty('minSdkVersion') ? rootProject.ext.minSdkVersion : 22 >> android\capacitor-cordova-android-plugins\build.gradle
echo         targetSdkVersion project.hasProperty('targetSdkVersion') ? rootProject.ext.targetSdkVersion : 32 >> android\capacitor-cordova-android-plugins\build.gradle
echo         versionCode 1 >> android\capacitor-cordova-android-plugins\build.gradle
echo         versionName '1.0' >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo     lintOptions { >> android\capacitor-cordova-android-plugins\build.gradle
echo         abortOnError false >> android\capacitor-cordova-android-plugins\build.gradle
echo         disable 'DeprecatedManifestPackage' >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo     compileOptions { >> android\capacitor-cordova-android-plugins\build.gradle
echo         sourceCompatibility JavaVersion.VERSION_17 >> android\capacitor-cordova-android-plugins\build.gradle
echo         targetCompatibility JavaVersion.VERSION_17 >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo repositories { >> android\capacitor-cordova-android-plugins\build.gradle
echo     google() >> android\capacitor-cordova-android-plugins\build.gradle
echo     mavenCentral() >> android\capacitor-cordova-android-plugins\build.gradle
echo     flatDir{ >> android\capacitor-cordova-android-plugins\build.gradle
echo         dirs 'src/main/libs', 'libs' >> android\capacitor-cordova-android-plugins\build.gradle
echo     } >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo dependencies { >> android\capacitor-cordova-android-plugins\build.gradle
echo     implementation fileTree(dir: 'src/main/libs', include: ['*.jar']) >> android\capacitor-cordova-android-plugins\build.gradle
echo     implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion" >> android\capacitor-cordova-android-plugins\build.gradle
echo     implementation "org.apache.cordova:framework:$cordovaAndroidVersion" >> android\capacitor-cordova-android-plugins\build.gradle
echo     // SUB-PROJECT DEPENDENCIES START >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo     // SUB-PROJECT DEPENDENCIES END >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo // PLUGIN GRADLE EXTENSIONS START >> android\capacitor-cordova-android-plugins\build.gradle
echo apply from: 'cordova.variables.gradle' >> android\capacitor-cordova-android-plugins\build.gradle
echo // PLUGIN GRADLE EXTENSIONS END >> android\capacitor-cordova-android-plugins\build.gradle
echo. >> android\capacitor-cordova-android-plugins\build.gradle
echo for (def func : cdvPluginPostBuildExtras) { >> android\capacitor-cordova-android-plugins\build.gradle
echo     func() >> android\capacitor-cordova-android-plugins\build.gradle
echo } >> android\capacitor-cordova-android-plugins\build.gradle
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Failed to patch Cordova build.gradle.
    pause
    exit /b 1
)

:: 4. Build APK
echo.
echo [3/3] Building APK...
cd android

:: Auto-fix SDK path if missing
if not exist "local.properties" (
    if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
         echo sdk.dir=%USERPROFILE:\=\\%\\AppData\\Local\\Android\\Sdk> local.properties
    )
)

:: Use local Gradle 8.0 cache if available, otherwise fetch once or fall back to wrapper
set "LOCAL_GRADLE_ROOT=..\gradle-local"
set "LOCAL_GRADLE_HOME=%LOCAL_GRADLE_ROOT%\gradle-8.0"
set "LOCAL_GRADLE_BIN=%LOCAL_GRADLE_HOME%\bin\gradle.bat"
set "LOCAL_GRADLE_ZIP=..\gradle-8.0-all.zip"
set "GRADLE_DIST_URL=https://services.gradle.org/distributions/gradle-8.0-all.zip"

if exist "%LOCAL_GRADLE_BIN%" (
    echo [Info] Using cached Gradle 8.0 from %LOCAL_GRADLE_HOME%...
    set "GRADLE_CMD=%LOCAL_GRADLE_BIN%"
) else (
    if not exist "%LOCAL_GRADLE_ROOT%" (
        mkdir "%LOCAL_GRADLE_ROOT%"
    )

    if not exist "%LOCAL_GRADLE_ZIP%" (
        echo [Info] gradle-8.0-all.zip not found, attempting download...
        powershell -Command "Invoke-WebRequest -Uri '%GRADLE_DIST_URL%' -OutFile '%LOCAL_GRADLE_ZIP%'" || (
            echo [Warn] Download failed, falling back to Gradle Wrapper.
            set "GRADLE_CMD=gradlew.bat"
            goto :continue_build
        )
    )

    echo [Info] Extracting Gradle 8.0 into %LOCAL_GRADLE_ROOT% (first-time only)...
    powershell -Command "Expand-Archive -Path '%LOCAL_GRADLE_ZIP%' -DestinationPath '%LOCAL_GRADLE_ROOT%' -Force"

    if exist "%LOCAL_GRADLE_BIN%" (
        echo [Info] Using cached Gradle 8.0 from %LOCAL_GRADLE_HOME%...
        set "GRADLE_CMD=%LOCAL_GRADLE_BIN%"
    ) else (
        echo [Warn] Local Gradle unpack failed, falling back to Gradle Wrapper.
        set "GRADLE_CMD=gradlew.bat"
    )
)

:continue_build

call %GRADLE_CMD% assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Error] APK Build failed.
    echo Note: Android SDK 36 requires Java 17 to build.
    echo If you see a Java version error, please install JDK 17.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo      Build Success!
echo ==========================================
echo APK Location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Opening folder...
explorer "android\app\build\outputs\apk\debug"
pause
