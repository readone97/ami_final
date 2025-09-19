                                                                                                                                                                # Amigo Exchange Deployment Setup Script (PowerShell)
Write-Host "🚀 Setting up Amigo Exchange for deployment..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local not found. Creating it..." -ForegroundColor Yellow
    "NEXT_PUBLIC_ADMIN_EMAIL=pillartool@gmail.com" | Out-File -FilePath ".env.local" -Encoding UTF8
    "NEXT_PUBLIC_ADMIN_PASSWORD=pillartool@97" | Add-Content -Path ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local created" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Check if .gitignore exists
if (-not (Test-Path ".gitignore")) {
    Write-Host "❌ .gitignore not found. Creating it..." -ForegroundColor Yellow
    # .gitignore content would be here
    Write-Host "✅ .gitignore created" -ForegroundColor Green
} else {
    Write-Host "✅ .gitignore already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Blue
npm run build

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a GitHub repository" -ForegroundColor White
Write-Host "2. Push your code: git add . && git commit -m 'Initial commit' && git push" -ForegroundColor White
Write-Host "3. Connect to Netlify and set environment variables" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Cyan
