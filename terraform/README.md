# Terraform Infrastructure for Multi-Model Orchestrator

This directory contains Terraform configuration to deploy Azure Cosmos DB resources for the Multi-Model Orchestrator application.

## 📋 Prerequisites

1. **Azure Subscription** with appropriate permissions
2. **Terraform** installed (>= 1.0)
   ```bash
   # Install on Windows (using Chocolatey)
   choco install terraform
   
   # Or download from: https://www.terraform.io/downloads
   ```
3. **Azure CLI** for authentication
   ```bash
   # Install Azure CLI
   winget install Microsoft.AzureCLI
   
   # Login
   az login
   ```

## 🚀 Quick Start

### 1. Configure Variables

Copy the example file and customize:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
cosmos_account_name = "cosmos-my-app-dev"  # Must be globally unique!
resource_group_name = "rg-my-app"
location            = "eastus"
environment         = "dev"
enable_free_tier    = true                 # Only 1 per subscription
max_throughput      = 4000
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Deployment

Preview what will be created:

```bash
terraform plan
```

### 4. Deploy

```bash
terraform apply
```

Type `yes` when prompted.

### 5. Get Outputs

After deployment, retrieve connection details:

```bash
# View all outputs
terraform output

# Get specific values
terraform output cosmos_endpoint
terraform output -raw cosmos_primary_key
```

## 📦 What Gets Created

### Resources

1. **Resource Group** (`rg-multi-model-orchestrator`)
   - Container for all resources

2. **Cosmos DB Account**
   - SQL API
   - Session consistency
   - Automatic failover enabled
   - Continuous backup (7 days)
   - Optional free tier (1000 RU/s free)

3. **Database** (`ConversationDB`)
   - Autoscale throughput (default: 4000 RU/s max)
   - Shared across all containers

4. **Containers:**
   - **Conversations** (`/userId` partition)
     - Stores chat sessions and messages
     - Optimized indexing (excludes message content)
   
   - **Resources** (`/userId` partition)
     - Stores folders, personas, prompts, workflows
     - Uses `type` discriminator field
   
   - **DataSources** (`/userId` partition)
     - Stores CSV and database metadata
     - Optimized indexing (excludes content)

### Cost Estimates

| Configuration | Estimated Monthly Cost |
|--------------|------------------------|
| **Free Tier** (1000 RU/s) | $0 |
| **Dev** (4000 RU/s) | ~$24-48 |
| **Prod** (10000 RU/s) | ~$60-120 |

*Costs vary by region and usage. See [Azure Cosmos DB Pricing](https://azure.microsoft.com/en-us/pricing/details/cosmos-db/)*

## 🔧 Configuration Options

### Enable Free Tier

Azure offers **1 free Cosmos DB account per subscription**:
- First 1000 RU/s free
- First 25 GB storage free

```hcl
enable_free_tier = true
```

⚠️ **Note:** You can only have one free tier account per subscription.

### Adjust Throughput

For development:
```hcl
max_throughput = 1000  # Minimum for autoscale
```

For production:
```hcl
max_throughput = 10000  # Higher performance
```

### Add Geo-Replication

Uncomment the secondary geo_location in `main.tf`:

```hcl
geo_location {
  location          = "westus"
  failover_priority = 1
}
```

### Restrict Network Access

Uncomment IP filtering in `main.tf`:

```hcl
ip_range_filter = "YOUR_IP_ADDRESS"
```

## 🔒 Security Best Practices

### 1. Secure Outputs

Primary keys are marked as `sensitive`. To retrieve securely:

```bash
# Output to environment variable
$env:AZURE_COSMOS_KEY = terraform output -raw cosmos_primary_key

# Or write to .env.local
terraform output -raw cosmos_primary_key | Out-File -FilePath ..\.env.local -Append
```

### 2. Use .gitignore

Ensure these files are ignored:

```
terraform/.terraform/
terraform/*.tfstate
terraform/*.tfstate.backup
terraform/terraform.tfvars
```

✅ Already configured in root `.gitignore`

### 3. Use Azure Key Vault (Optional)

For production, store keys in Azure Key Vault:

```bash
# Store in Key Vault
az keyvault secret set \
  --vault-name my-keyvault \
  --name cosmos-primary-key \
  --value $(terraform output -raw cosmos_primary_key)
```

## 🧪 Testing the Connection

After deployment, test the connection:

```bash
# Set environment variables
$env:AZURE_COSMOS_ENDPOINT = terraform output -raw cosmos_endpoint
$env:AZURE_COSMOS_KEY = terraform output -raw cosmos_primary_key
$env:AZURE_COSMOS_DB_ID = "ConversationDB"

# Run the app
cd ..
npm run dev
```

## 🗑️ Cleanup

To delete all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

⚠️ **Warning:** This will permanently delete all data!

## 📊 State Management

### Local State (Default)

- State stored in `terraform.tfstate`
- ⚠️ **Do not commit** to Git (contains sensitive data)

### Remote State (Recommended for Teams)

Use Azure Storage for state:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstate12345"
    container_name       = "tfstate"
    key                  = "multi-model-orchestrator.tfstate"
  }
}
```

## 🔄 Updates

### Update Throughput

Edit `terraform.tfvars`:

```hcl
max_throughput = 6000
```

Apply changes:

```bash
terraform apply
```

### Add Containers

Edit `main.tf` and add new `azurerm_cosmosdb_sql_container` resources, then apply.

## 🐛 Troubleshooting

### "Account name already exists"

Cosmos DB account names must be globally unique. Try:

```hcl
cosmos_account_name = "cosmos-myapp-${random_id}"
```

### "Insufficient permissions"

Ensure your Azure account has:
- Contributor role on subscription
- Or Owner role on resource group

### "Free tier already enabled"

You can only have one free tier account per subscription. Set:

```hcl
enable_free_tier = false
```

### "Quota exceeded"

Check subscription limits:

```bash
az cosmosdb show-quota \
  --resource-group rg-multi-model-orchestrator \
  --name your-cosmos-account
```

## 📚 Additional Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Terraform Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Cosmos DB Best Practices](https://docs.microsoft.com/en-us/azure/cosmos-db/best-practices)
- [Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## 🆘 Support

For issues with:
- **Terraform Configuration**: Open an issue on GitHub
- **Azure Cosmos DB**: Contact Azure Support
- **Application Integration**: See main README.md
