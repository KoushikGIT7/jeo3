# Firestore Index Deployment Script (Fixed for PowerShell Execution Policy)
# This script fixes execution policy and deploys Firestore indexes

Write-Host "🚀 Firestore Index Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Fix PowerShell execution policy for current session
Write-Host "Step 1: Fixing PowerShell execution policy..." -ForegroundColor Yellow
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
Write-Host "✅ Execution policy set for current session" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Firebase CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Firebase CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Authenticating with Firebase..." -ForegroundColor Yellow
Write-Host "A browser window will open for authentication." -ForegroundColor Cyan
Write-Host "Please complete the authentication in your browser..." -ForegroundColor Cyan
firebase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Authentication failed" -ForegroundColor Red
    Write-Host "Please run 'firebase login' manually and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 4: Setting Firebase project..." -ForegroundColor Yellow
firebase use joecafe-a7fff

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Project not set. Adding project..." -ForegroundColor Yellow
    firebase use joecafe-a7fff --add
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to set project" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 5: Deploying Firestore indexes..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Indexes deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Index build status:" -ForegroundColor Cyan
    Write-Host "   - Check Firebase Console: https://console.firebase.google.com/project/joecafe-a7fff/firestore/indexes" -ForegroundColor White
    Write-Host "   - Build time: 5-15 minutes (typically)" -ForegroundColor White
    Write-Host "   - Indexes will be available automatically once built" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}
