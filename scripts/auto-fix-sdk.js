const fs = require('fs');
const path = require('path');

// Paths
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const localPropsFile = path.join(androidDir, 'local.properties');
const variablesFile = path.join(androidDir, 'variables.gradle');
const appBuildGradleFile = path.join(androidDir, 'app', 'build.gradle');

// 1. Find Android SDK Path
function getSdkPath() {
    let sdkPath = null;
    
    // Try local.properties
    if (fs.existsSync(localPropsFile)) {
        const content = fs.readFileSync(localPropsFile, 'utf8');
        const match = content.match(/sdk\.dir=(.*)/);
        if (match && match[1]) {
            sdkPath = match[1].trim().replace(/\\\\/g, '\\').replace(/:/g, ':'); // simple unescape
            // Fix for potential file:// prefix or other gradle oddities, though usually it's a path
        }
    }

    // Try Environment Variable
    if (!sdkPath && process.env.ANDROID_HOME) {
        sdkPath = process.env.ANDROID_HOME;
    }

    // Try Default Windows Path
    if (!sdkPath && process.env.LOCALAPPDATA) {
        sdkPath = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');
    }

    return sdkPath;
}

const sdkPath = getSdkPath();
if (!sdkPath || !fs.existsSync(sdkPath)) {
    console.log('[AutoFix] Android SDK not found. Skipping auto-repair.');
    process.exit(0);
}

console.log(`[AutoFix] Found Android SDK at: ${sdkPath}`);

// 2. Find Best Platform
const platformsDir = path.join(sdkPath, 'platforms');
let maxApiLevel = 0;

if (fs.existsSync(platformsDir)) {
    const platforms = fs.readdirSync(platformsDir);
    platforms.forEach(p => {
        if (p.startsWith('android-')) {
            const level = parseInt(p.replace('android-', ''), 10);
            if (!isNaN(level) && level > maxApiLevel) {
                maxApiLevel = level;
            }
        }
    });
}

if (maxApiLevel > 0) {
    console.log(`[AutoFix] Found highest installed Platform API: ${maxApiLevel}`);
    
    // Update variables.gradle
    if (fs.existsSync(variablesFile)) {
        let content = fs.readFileSync(variablesFile, 'utf8');
        let changed = false;
        
        // Replace compileSdkVersion
        const compileMatch = content.match(/compileSdkVersion\s*=\s*(\d+)/);
        if (compileMatch && parseInt(compileMatch[1]) !== maxApiLevel) {
            console.log(`[AutoFix] Updating compileSdkVersion from ${compileMatch[1]} to ${maxApiLevel}`);
            content = content.replace(/compileSdkVersion\s*=\s*\d+/, `compileSdkVersion = ${maxApiLevel}`);
            changed = true;
        }

        // Replace targetSdkVersion (usually we want to match compileSdk, but be careful not to break strict logic. 
        // For this "fix it" request, matching is safest for building).
        const targetMatch = content.match(/targetSdkVersion\s*=\s*(\d+)/);
        if (targetMatch && parseInt(targetMatch[1]) !== maxApiLevel) {
            console.log(`[AutoFix] Updating targetSdkVersion from ${targetMatch[1]} to ${maxApiLevel}`);
            content = content.replace(/targetSdkVersion\s*=\s*\d+/, `targetSdkVersion = ${maxApiLevel}`);
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(variablesFile, content, 'utf8');
            console.log('[AutoFix] Updated variables.gradle');
        }
    }
} else {
    console.log('[AutoFix] No platforms found in platforms directory!');
}

// 3. Find Best Build Tools
const buildToolsDir = path.join(sdkPath, 'build-tools');
let bestBuildTool = null;

if (fs.existsSync(buildToolsDir)) {
    const tools = fs.readdirSync(buildToolsDir).filter(f => fs.statSync(path.join(buildToolsDir, f)).isDirectory());
    // Simple sort semantic versioning
    tools.sort((a, b) => {
        const partsA = a.split('.').map(Number);
        const partsB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const valA = partsA[i] || 0;
            const valB = partsB[i] || 0;
            if (valA !== valB) return valB - valA; // Descending
        }
        return 0;
    });
    if (tools.length > 0) {
        bestBuildTool = tools[0];
    }
}

if (bestBuildTool) {
    console.log(`[AutoFix] Found highest Build Tools: ${bestBuildTool}`);
    
    // Update app/build.gradle
    if (fs.existsSync(appBuildGradleFile)) {
        let content = fs.readFileSync(appBuildGradleFile, 'utf8');
        
        // Check if buildToolsVersion exists
        const buildToolsMatch = content.match(/buildToolsVersion\s*"([^"]+)"/);
        if (buildToolsMatch) {
            if (buildToolsMatch[1] !== bestBuildTool) {
                console.log(`[AutoFix] Updating buildToolsVersion from "${buildToolsMatch[1]}" to "${bestBuildTool}"`);
                content = content.replace(/buildToolsVersion\s*"[^"]+"/, `buildToolsVersion "${bestBuildTool}"`);
                fs.writeFileSync(appBuildGradleFile, content, 'utf8');
            }
        } else {
            // If not present, insert it inside android { ... }
            // This is a bit harder with regex, but we can try to inject it after compileSdk
            console.log(`[AutoFix] Adding buildToolsVersion "${bestBuildTool}"`);
            content = content.replace(/(compileSdk.*)/, `$1\n    buildToolsVersion "${bestBuildTool}"`);
            fs.writeFileSync(appBuildGradleFile, content, 'utf8');
        }
    }
} else {
    console.log('[AutoFix] No build-tools found!');
}
