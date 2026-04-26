# Windows Build & Deployment Strategy Script
Write-Host "Starting build process for eLibPro..."

# 1. Clean previous builds
Write-Host "Cleaning previous builds..."
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "src-tauri/target") { Remove-Item -Recurse -Force "src-tauri/target" }

# 2. Install npm dependencies
Write-Host "Installing npm dependencies..."
npm install

# 3. Build frontend
Write-Host "Building frontend..."
npm run build

# 4. Tauri release build
Write-Host "Executing Tauri release build..."
npm run tauri build

Write-Host "Build complete! Check src-tauri/target/release/bundle for output."