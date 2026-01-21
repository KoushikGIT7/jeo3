# PowerShell script to push repository to GitHub
# Run this script in PowerShell: .\push-to-github.ps1

Write-Host "🚀 Setting up Git repository for GitHub..." -ForegroundColor Green

# Check if git is available
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Navigate to project directory
Set-Location "D:\Joe 3rd time proj"

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Cyan
    git init
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Add remote if not exists
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔗 Adding remote repository..." -ForegroundColor Cyan
    git remote add origin https://github.com/KoushikGIT7/JOE-Cafeteria-Automation.git
} else {
    Write-Host "✅ Remote already configured: $remoteExists" -ForegroundColor Green
}

# Add all files
Write-Host "📝 Adding files to staging..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Creating commit..." -ForegroundColor Cyan
    git commit -m "Initial commit: JOE Cafeteria Automation System with all features"
    
    # Set main branch
    git branch -M main
    
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
    Write-Host "⚠️  You may be prompted for GitHub credentials" -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed. Check your credentials and try again." -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  No changes to commit. Repository is up to date." -ForegroundColor Yellow
}

Write-Host "`n✨ Done!" -ForegroundColor Green
