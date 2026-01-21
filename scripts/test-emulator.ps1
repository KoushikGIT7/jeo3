# Firestore Rules Emulator Testing Script
# Tests security rules before production deployment

Write-Host "🧪 Firestore Rules Emulator Testing" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseVersion = firebase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Firebase CLI: $firebaseVersion" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Test Scenarios:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Student cannot approve cash" -ForegroundColor White
Write-Host "2. Cashier cannot serve orders" -ForegroundColor White
Write-Host "3. Server cannot approve cash" -ForegroundColor White
Write-Host "4. Admin-only settings enforced" -ForegroundColor White
Write-Host "5. Logs are immutable" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting Firestore Emulator..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Once emulator starts:" -ForegroundColor Yellow
Write-Host "  - Open http://localhost:4000" -ForegroundColor White
Write-Host "  - Test rules manually in UI" -ForegroundColor White
Write-Host "  - Or use Firebase SDK to test programmatically" -ForegroundColor White
Write-Host ""

# Start emulator
firebase emulators:start --only firestore
