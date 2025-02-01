output "app_url" {
  description = "URL of the deployed application"
  value       = "https://${netlify_site.main.default_subdomain}"
}

output "media_domain" {
  description = "Domain name for media assets"
  value       = aws_cloudfront_distribution.media.domain_name
}

output "media_bucket" {
  description = "Name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media.id
}

output "nameservers" {
  description = "Nameservers for the Route53 zone"
  value       = aws_route53_zone.main.name_servers
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.media.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "domain_name" {
  description = "Domain name for the application"
  value       = var.domain_name
}

output "monitoring_enabled" {
  description = "Whether monitoring is enabled"
  value       = var.enable_monitoring
}

output "waf_enabled" {
  description = "Whether WAF protection is enabled"
  value       = var.enable_waf
}

output "backup_retention" {
  description = "Number of days backups are retained"
  value       = var.backup_retention_days
}

output "allowed_ip_ranges" {
  description = "List of allowed IP ranges for admin access"
  value       = var.allowed_ip_ranges
  sensitive   = true
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    app_url          = "https://${netlify_site.main.default_subdomain}"
    media_domain     = aws_cloudfront_distribution.media.domain_name
    environment      = var.environment
    region          = var.aws_region
    waf_enabled     = var.enable_waf
    monitoring      = var.enable_monitoring
    ipv6_enabled    = var.enable_ipv6
    versioning      = var.enable_versioning
    cdn_price_class = var.cdn_price_class
  }
} 