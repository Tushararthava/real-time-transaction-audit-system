terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state backend — comment out the backend block when running
  # with -backend=false (local/CI plan-only mode, no AWS credentials needed)
  backend "s3" {
    bucket         = "real-time-audit-tfstate"
    key            = "terraform/state/audit-system.tfstate"
    region         = "us-east-1"
    encrypt        = true      # Trivy: ensure state is encrypted at rest
    dynamodb_table = "real-time-audit-tfstate-lock" # State locking
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "real-time-transaction-audit"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
