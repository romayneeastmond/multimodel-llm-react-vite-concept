# MSAL Terraform Configuration Guide

This guide explains how to use Terraform to automatically create a Microsoft Entra ID (Azure AD) application registration for MSAL authentication.

## 🎯 Overview

The `msal.tf` configuration file automatically creates:
- **Azure AD Application Registration** with SPA configuration
- **Service Principal** for the application
- **User.Read API permission** (default Microsoft Graph permission)
- **Redirect URIs** configured for your environment

## 🚀 Quick Start

### 1. Enable MSAL in terraform.tfvars

```hcl
# Enable MSAL authentication
enable_msal = true

# Application name in Azure AD
app_name = "Multi-Model Orchestrator"

# Redirect URIs for development and production
redirect_uris = [
  "http://localhost:3000",
  "https://yourdomain.com"
]

# Account types allowed
# Options: AzureADMyOrg, AzureADMultipleOrgs, AzureADandPersonalMicrosoftAccount
supported_account_types = "AzureADMyOrg"
```

### 2. Deploy with Terraform

```bash
# Initialize (first time only)
terraform init

# Preview changes
terraform plan

# Apply configuration
terraform apply
```

### 3. Retrieve Configuration Values

After deployment, get the values for your `.env.local`:

```bash
# Get all MSAL outputs
terraform output env_variables

# Or get individual values
terraform output azure_ad_client_id
terraform output azure_ad_tenant_id
```

### 4. Update .env.local

Copy the output values to your `.env.local` file:

```env
USE_MSAL=true
AZURE_AD_CLIENT_ID=<value from terraform output>
AZURE_AD_TENANT_ID=<value from terraform output>
AZURE_AD_REDIRECT_URI=http://localhost:3000
```

## 📋 Configuration Options

### Account Types

| Value | Description | Use Case |
|-------|-------------|----------|
| `AzureADMyOrg` | Single tenant | Your organization only |
| `AzureADMultipleOrgs` | Multi-tenant | Any Azure AD organization |
| `AzureADandPersonalMicrosoftAccount` | Consumer + enterprise | Any Microsoft account |

### Redirect URIs

Add all URLs where your app will be hosted:

```hcl
redirect_uris = [
  "http://localhost:3000",           # Development
  "https://staging.yourdomain.com",  # Staging
  "https://yourdomain.com"           # Production
]
```

## 🔒 Security Considerations

### 1. Service Principal Permissions

The created service principal has:
- ✅ **User.Read** permission (basic profile)
- ❌ **app_role_assignment_required = false** (any user can sign in)

To restrict access to specific users:
1. Go to Azure Portal → App Registration → Enterprise Application
2. Set "Assignment required" to Yes
3. Assign specific users/groups

### 2. API Permissions

By default, only `User.Read` is granted. To add more permissions, modify `msal.tf`:

```hcl
resource_access {
  id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
  type = "Scope"
}

# Add additional permissions here
resource_access {
  id   = "your-permission-uuid"
  type = "Scope"
}
```

### 3. Multi-Tenant Considerations

For multi-tenant apps (`AzureADMultipleOrgs` or `AzureADandPersonalMicrosoftAccount`):
- Admin consent may be required
- Consider adding tenant validation logic
- Review data isolation in your application

## 📊 Outputs

The configuration provides these outputs:

```hcl
# Application (client) ID
azure_ad_client_id = "12345678-1234-1234-1234-123456789012"

# Directory (tenant) ID  
azure_ad_tenant_id = "87654321-4321-4321-4321-210987654321"

# Object ID (for management)
azure_ad_object_id = "abcdef12-3456-7890-abcd-ef1234567890"

# Complete env variables
env_variables = {
  USE_MSAL              = "true"
  AZURE_AD_CLIENT_ID    = "..."
  AZURE_AD_TENANT_ID    = "..."
  AZURE_AD_REDIRECT_URI = "http://localhost:3000"
}
```

## 🔄 Updates and Changes

### Update Redirect URIs

Edit `terraform.tfvars`:
```hcl
redirect_uris = ["http://localhost:3000", "https://new-domain.com"]
```

Apply changes:
```bash
terraform apply
```

### Change Account Type

⚠️ **Warning:** Changing account type may affect existing users.

```hcl
supported_account_types = "AzureADMultipleOrgs"
```

### Disable MSAL

To remove the app registration:

```hcl
enable_msal = false
```

```bash
terraform apply
```

This will destroy the Azure AD application and service principal.

## 🐛 Troubleshooting

### "Insufficient privileges to complete the operation"

You need Azure AD permissions to create app registrations:
- **Application Administrator** role
- **Cloud Application Administrator** role
- **Global Administrator** role

### "Authentication configuration for identifier 'XXX' already exists"

The redirect URI is already in use. Either:
1. Use a different URI
2. Delete the existing app registration manually
3. Import the existing app into Terraform

### "The directory object quota limit for the Principal has been exceeded"

You've hit the app registration limit. Clean up unused registrations:
```bash
az ad app list --show-mine
az ad app delete --id <app-id>
```

## 📚 Additional Resources

- [Azure AD Terraform Provider Docs](https://registry.terraform.io/providers/hashicorp/azuread/latest/docs)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)

## 💡 Best Practices

1. ✅ Use separate app registrations for dev/staging/prod
2. ✅ Rotate redirect URIs regularly
3. ✅ Enable logging and monitoring
4. ✅ Use managed identities where possible
5. ✅ Keep Terraform state secure (use remote backend)
6. ✅ Review permissions regularly
7. ✅ Document any custom permissions added

## 🆘 Support

For issues:
- **Terraform**: Check `terraform.log` with `TF_LOG=DEBUG`
- **Azure AD**: Use Azure Portal audit logs
- **MSAL Authentication**: Check browser console for errors
