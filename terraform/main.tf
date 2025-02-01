terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    netlify = {
      source  = "netlify/netlify"
      version = "~> 1.0"
    }
  }

  backend "s3" {
    bucket = "ecotale24hr-tfstate"
    key    = "prod/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "EcoTale24hr"
      ManagedBy   = "Terraform"
    }
  }
}

provider "netlify" {
  token = var.netlify_token
}

# S3 bucket for media storage
resource "aws_s3_bucket" "media" {
  bucket = "ecotale24hr-media-${var.environment}"
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront distribution for media
resource "aws_cloudfront_distribution" "media" {
  enabled             = true
  is_ipv6_enabled    = true
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_cloudfront_origin_access_identity" "media" {
  comment = "access-identity-${aws_s3_bucket.media.bucket_regional_domain_name}"
}

# Netlify site
resource "netlify_site" "main" {
  name = "ecotale24hr-${var.environment}"

  repo {
    provider    = "github"
    repo_path   = "username/EcoTale24hr"
    branch      = "main"
    cmd         = "npm run build"
    dir         = "dist"
    deploy_key_id = var.netlify_deploy_key_id
  }
}

# Route53 DNS records
resource "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "app" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [netlify_site.main.default_subdomain]
}

resource "aws_route53_record" "media" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "media.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  records = [aws_cloudfront_distribution.media.domain_name]
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "ecotale24hr-${var.environment}"
  description = "WAF rules for EcoTale24hr"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "EcoTale24hrWAFMetric"
    sampled_requests_enabled  = true
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "ecotale24hr-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/CloudFront"
  period             = "300"
  statistic          = "Average"
  threshold          = "5"
  alarm_description  = "This metric monitors error rate"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.media.id
  }
}

resource "aws_sns_topic" "alerts" {
  name = "ecotale24hr-alerts-${var.environment}"
}

# Outputs
output "media_bucket_name" {
  value = aws_s3_bucket.media.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.media.domain_name
}

output "netlify_url" {
  value = netlify_site.main.default_subdomain
}

output "nameservers" {
  value = aws_route53_zone.main.name_servers
} 