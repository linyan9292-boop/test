# FixSDK.ps1
$ErrorActionPreference = "Stop"

function Get-AndroidSdkPath {
    if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
    if ($env:LOCALAPPDATA) {
        $path = Join-Path $env:LOCALAPPDATA "Android\Sdk"
        if (Test-Path $path) { return $path }
    }
    return $null
}

$sdkPath = Get-AndroidSdkPath
if (-not $sdkPath) {
    Write-Host "[Error] Android SDK not found."
    exit 1
}

Write-Host "[Info] SDK Path: $sdkPath"

# Find highest installed platform
$platformsDir = Join-Path $sdkPath "platforms"
if (-not (Test-Path $platformsDir)) {
    Write-Host "[Error] platforms directory not found at $platformsDir"
    exit 1
}

$latestPlatform = Get-ChildItem -Path $platformsDir -Filter "android-*" | 
    Where-Object { $_.PSIsContainer } | 
    ForEach-Object { 
        [int]($_.Name -replace "android-", "") 
    } | 
    Sort-Object -Descending | 
    Select-Object -First 1

if (-not $latestPlatform) {
    Write-Host "[Error] No android platforms found."
    exit 1
}

Write-Host "[Info] Found highest platform: android-$latestPlatform"

# Find highest build tools
$buildToolsDir = Join-Path $sdkPath "build-tools"
$latestBuildTool = $null
if (Test-Path $buildToolsDir) {
    $latestBuildTool = Get-ChildItem -Path $buildToolsDir | 
        Where-Object { $_.PSIsContainer } | 
        Sort-Object Name -Descending | 
        Select-Object -First 1 -ExpandProperty Name
}

if ($latestBuildTool) {
    Write-Host "[Info] Found highest build-tools: $latestBuildTool"
}

# Update variables.gradle
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$variablesFile = Join-Path $projectRoot "android\variables.gradle"

if (Test-Path $variablesFile) {
    $content = Get-Content $variablesFile -Raw
    
    # Replace compileSdkVersion
    $content = $content -replace "compileSdkVersion\s*=\s*\d+", "compileSdkVersion = $latestPlatform"
    # Replace targetSdkVersion
    $content = $content -replace "targetSdkVersion\s*=\s*\d+", "targetSdkVersion = $latestPlatform"
    
    Set-Content $variablesFile $content -NoNewline
    Write-Host "[Success] Updated variables.gradle to SDK $latestPlatform"
} else {
    Write-Host "[Error] variables.gradle not found!"
}

# Update app/build.gradle
$appBuildFile = Join-Path $projectRoot "android\app\build.gradle"
if ($latestBuildTool -and (Test-Path $appBuildFile)) {
    $content = Get-Content $appBuildFile -Raw
    
    if ($content -match "buildToolsVersion") {
        $content = $content -replace 'buildToolsVersion\s*"[^"]+"', "buildToolsVersion ""$latestBuildTool"""
    } else {
        # Inject after compileSdk if missing
        $content = $content -replace "(compileSdk.*)", "`$1`n    buildToolsVersion ""$latestBuildTool"""
    }
    
    Set-Content $appBuildFile $content -NoNewline
    Write-Host "[Success] Updated app/build.gradle to Build Tools $latestBuildTool"
}
