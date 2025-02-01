variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be one of: prod, staging, dev"
  }
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "ecotale24hr.app"
}

variable "netlify_token" {
  description = "Netlify personal access token"
  type        = string
  sensitive   = true
}

variable "netlify_deploy_key_id" {
  description = "Netlify deploy key ID for GitHub integration"
  type        = string
  sensitive   = true
}

variable "enable_waf" {
  description = "Enable AWS WAF protection"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable CloudWatch monitoring and alerts"
  type        = bool
  default     = true
}

variable "error_threshold" {
  description = "Threshold for error rate alerting"
  type        = number
  default     = 5

  validation {
    condition     = var.error_threshold > 0 && var.error_threshold <= 100
    error_message = "Error threshold must be between 1 and 100"
  }
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 7
    error_message = "Backup retention must be at least 7 days"
  }
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP CIDR ranges for admin access"
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for ip in var.allowed_ip_ranges : can(cidrhost(ip, 0))])
    error_message = "All IP ranges must be valid CIDR notation"
  }
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

variable "cdn_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cdn_price_class)
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All"
  }
}

variable "enable_ipv6" {
  description = "Enable IPv6 support for CloudFront"
  type        = bool
  default     = true
}

variable "ssl_certificate_arn" {
  description = "ARN of ACM certificate for CloudFront"
  type        = string
  default     = null
}

variable "enable_versioning" {
  description = "Enable versioning for S3 buckets"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 90

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be one of the allowed values"
  }
} 