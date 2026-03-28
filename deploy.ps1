# Azure Container Apps Deployment Script for TaskDock
# Make sure you are logged in to Azure CLI (`az login`) before running this.

$ResourceGroup = "TaskDockRG_SouthCentralUS"
$Location = "southcentralus" # Probed successfully. Allowed by Student Subscription.
$AcrName = "taskdockacr" + (Get-Random -Minimum 1000 -Maximum 9999) # Auto-generated unique name
$AppEnvName = "taskdock-env"
$AppName = "taskdock-app"

Write-Host "🚀 Starting TaskDock Deployment to Azure Container Apps..." -ForegroundColor Cyan

# 1. Create Resource Group if it doesn't exist
Write-Host "Checking Resource Group: $ResourceGroup..."
az group create --name $ResourceGroup --location $Location --output none

# 2. Create ACR if it doesn't exist
Write-Host "Checking Azure Container Registry: $AcrName..."
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true --output none

# 3. Build & Push Docker image using ACR Build (No local Docker required!)
Write-Host "Building Docker image in the cloud via ACR Build..." -ForegroundColor Yellow
az acr build --registry $AcrName --image $AppName`:latest .

# 4. Create Container Apps Environment if it doesn't exist
Write-Host "Setting up Container App Environment..."
az containerapp env create --name $AppEnvName --resource-group $ResourceGroup --location $Location --output none

# 5. Extract secrets from .env file securely
Write-Host "Reading local .env for secrets..."
$EnvConfig = Get-Content .env | Where-Object { $_ -match "^[^#.+]" }
$NextAuthSecret = ($EnvConfig | Select-String "NEXTAUTH_SECRET=(.*)").Matches.Groups[1].Value.Replace('"', '')
$GoogleClientId = ($EnvConfig | Select-String "GOOGLE_CLIENT_ID=(.*)").Matches.Groups[1].Value.Replace('"', '')
$GoogleSecret = ($EnvConfig | Select-String "GOOGLE_CLIENT_SECRET=(.*)").Matches.Groups[1].Value.Replace('"', '')

# For SQLite to persist, in production we usually mount an Azure File Share,
# but for MVP we will pass the default env vars.
# IMPORTANT: In a real production deployment, SQLite will reset on container restart!
# It is highly recommended to migrate to Azure Database for PostgreSQL.

# 6. Create or Update the Container App
Write-Host "Deploying Container App: $AppName..." -ForegroundColor Yellow

$AcrLoginServer = az acr show --name $AcrName --query loginServer --output tsv
$AcrPassword = az acr credential show --name $AcrName --query passwords[0].value --output tsv

az containerapp create `
  --name $AppName `
  --resource-group $ResourceGroup `
  --environment $AppEnvName `
  --image "$AcrLoginServer/$AppName`:latest" `
  --registry-server $AcrLoginServer `
  --registry-username $AcrName `
  --registry-password $AcrPassword `
  --target-port 3000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 2 `
  --secrets "nextauth-secret=$NextAuthSecret,google-client-id=$GoogleClientId,google-client-secret=$GoogleSecret" `
  --env-vars "NEXTAUTH_URL=https://$AppName.$AppEnvName.$Location.azurecontainerapps.io" "NEXTAUTH_SECRET=secretref:nextauth-secret" "GOOGLE_CLIENT_ID=secretref:google-client-id" "GOOGLE_CLIENT_SECRET=secretref:google-client-secret"

Write-Host "✅ Deployment initiated!" -ForegroundColor Green
$Fqdn = az containerapp show --name $AppName --resource-group $ResourceGroup --query configuration.ingress.fqdn --output tsv
Write-Host "🌐 Your app will be live shortly at: https://$Fqdn" -ForegroundColor Cyan
Write-Host "⚠️ Remember to add 'https://$Fqdn/api/auth/callback/google' to your Google Cloud Console Authorized Redirect URIs!" -ForegroundColor Yellow
