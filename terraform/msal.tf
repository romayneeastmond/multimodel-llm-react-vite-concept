# Multi-Model Orchestrator - MSAL App Registration
# This Terraform configuration creates the Microsoft Entra ID app registration for SSO

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
  }
}

# Variables for MSAL configuration
variable "enable_msal" {
  description = "Enable MSAL authentication and create app registration"
  type        = bool
  default     = false
}

variable "app_name" {
  description = "Name of the Azure AD application"
  type        = string
  default     = "Multi-Model Orchestrator"
}

variable "redirect_uris" {
  description = "List of redirect URIs for the application"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "supported_account_types" {
  description = "Who can use this application (AzureADMyOrg, AzureADMultipleOrgs, AzureADandPersonalMicrosoftAccount)"
  type        = string
  default     = "AzureADMyOrg"
}

# Data source to get current Azure AD tenant information
data "azuread_client_config" "current" {
  count = var.enable_msal ? 1 : 0
}

# Azure AD Application Registration
resource "azuread_application" "main" {
  count            = var.enable_msal ? 1 : 0
  display_name     = var.app_name
  owners           = [data.azuread_client_config.current[0].object_id]
  sign_in_audience = var.supported_account_types

  # Single Page Application (SPA) configuration
  single_page_application {
    redirect_uris = var.redirect_uris
  }

  # Required API permissions
  required_resource_access {
    # Microsoft Graph
    resource_app_id = "00000003-0000-0000-c000-000000000000"

    # User.Read permission
    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
  }

  # Optional: Enable ID tokens for implicit flow (not recommended for SPA)
  web {
    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = false
    }
  }

  tags = [
    "Terraform",
    "Multi-Model-Orchestrator",
    var.environment
  ]
}

# Service Principal for the application
resource "azuread_service_principal" "main" {
  count          = var.enable_msal ? 1 : 0
  application_id = azuread_application.main[0].application_id
  owners         = [data.azuread_client_config.current[0].object_id]

  # Automatically assign users and groups
  app_role_assignment_required = false

  tags = [
    "Terraform",
    "Multi-Model-Orchestrator"
  ]
}

# Outputs for use in application configuration
output "azure_ad_client_id" {
  description = "Application (client) ID for MSAL configuration"
  value       = var.enable_msal ? azuread_application.main[0].application_id : null
}

output "azure_ad_tenant_id" {
  description = "Directory (tenant) ID for MSAL configuration"
  value       = var.enable_msal ? data.azuread_client_config.current[0].tenant_id : null
}

output "azure_ad_object_id" {
  description = "Object ID of the application"
  value       = var.enable_msal ? azuread_application.main[0].object_id : null
}

output "env_variables" {
  description = "Environment variables for .env.local file"
  value = var.enable_msal ? {
    USE_MSAL                = "true"
    AZURE_AD_CLIENT_ID      = azuread_application.main[0].application_id
    AZURE_AD_TENANT_ID      = data.azuread_client_config.current[0].tenant_id
    AZURE_AD_REDIRECT_URI   = var.redirect_uris[0]
  } : null
}
