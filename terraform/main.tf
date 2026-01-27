# Multi-Model Orchestrator - Cosmos DB Infrastructure
# This Terraform configuration creates the necessary Azure Cosmos DB resources

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "rg-multi-model-orchestrator"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "cosmos_account_name" {
  description = "Name of the Cosmos DB account (must be globally unique)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "enable_free_tier" {
  description = "Enable Cosmos DB free tier (limits: 1 per subscription)"
  type        = bool
  default     = false
}

variable "max_throughput" {
  description = "Maximum autoscale throughput (RU/s)"
  type        = number
  default     = 4000
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "Multi-Model Orchestrator"
    ManagedBy   = "Terraform"
  }
}

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = var.cosmos_account_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # Enable free tier (optional - only 1 per subscription)
  enable_free_tier = var.enable_free_tier

  # Enable automatic failover
  enable_automatic_failover = true

  # Consistency policy
  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  # Primary location
  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  # Optional: Add secondary location for high availability
  # geo_location {
  #   location          = "westus"
  #   failover_priority = 1
  # }

  # Backup policy
  backup {
    type                = "Continuous"
    interval_in_minutes = 240
    retention_in_hours  = 8
  }

  # Network rules (optional - uncomment to restrict access)
  # ip_range_filter = "0.0.0.0" # Allow all IPs (replace with your IP ranges)
  
  # public_network_access_enabled = true
  # is_virtual_network_filter_enabled = false

  tags = {
    Environment = var.environment
    Project     = "Multi-Model Orchestrator"
    ManagedBy   = "Terraform"
  }
}

# Cosmos DB SQL Database
resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "ConversationDB"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name

  # Autoscale throughput at database level
  autoscale_settings {
    max_throughput = var.max_throughput
  }
}

# Container: Conversations
resource "azurerm_cosmosdb_sql_container" "conversations" {
  name                  = "Conversations"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/userId"
  partition_key_version = 1

  # Indexing policy optimized for chat sessions
  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    # Exclude large message content from indexing to save RU/s
    excluded_path {
      path = "/messages/[]/content/?"
    }

    excluded_path {
      path = "/messages/[]/responses/*"
    }
  }

  # TTL disabled (keep conversations indefinitely)
  default_ttl = -1
}

# Container: Resources
resource "azurerm_cosmosdb_sql_container" "resources" {
  name                  = "Resources"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/userId"
  partition_key_version = 1

  # Standard indexing for folders, personas, prompts, workflows
  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }

  # TTL disabled
  default_ttl = -1
}

# Container: DataSources
resource "azurerm_cosmosdb_sql_container" "datasources" {
  name                  = "DataSources"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/userId"
  partition_key_version = 1

  # Indexing policy optimized for database sources
  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    # Exclude large CSV content from indexing
    excluded_path {
      path = "/content/?"
    }
  }

  # TTL disabled
  default_ttl = -1
}

# Outputs
output "cosmos_endpoint" {
  description = "Cosmos DB account endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_primary_key" {
  description = "Cosmos DB primary key (sensitive)"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "cosmos_connection_string" {
  description = "Cosmos DB connection string (sensitive)"
  value       = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive   = true
}

output "database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "cosmos_account_name" {
  description = "Cosmos DB account name"
  value       = azurerm_cosmosdb_account.main.name
}
