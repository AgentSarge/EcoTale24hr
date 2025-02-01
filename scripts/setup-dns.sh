#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Please configure AWS credentials first using: aws configure"
    exit 1
fi

# Check if domain name is provided
if [ -z "$1" ]; then
    read -p "Enter your domain name (e.g., ecotale24hr.app): " DOMAIN_NAME
else
    DOMAIN_NAME=$1
fi

# Get Netlify site information
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    read -p "Enter your Netlify auth token: " NETLIFY_AUTH_TOKEN
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
    read -p "Enter your Netlify site ID: " NETLIFY_SITE_ID
fi

# Get Netlify domain
NETLIFY_DOMAIN=$(curl -s -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
    "https://api.netlify.com/api/v1/sites/$NETLIFY_SITE_ID" | jq -r '.default_domain')

# Create Route53 hosted zone
echo "Creating Route53 hosted zone..."
ZONE_ID=$(aws route53 create-hosted-zone \
    --name "$DOMAIN_NAME" \
    --caller-reference "$(date +%s)" \
    --query 'HostedZone.Id' \
    --output text)

# Get nameservers
NAMESERVERS=$(aws route53 get-hosted-zone \
    --id "$ZONE_ID" \
    --query 'DelegationSet.NameServers' \
    --output text)

# Create DNS records
echo "Creating DNS records..."

# Create A record for apex domain
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "'$DOMAIN_NAME'",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "'$NETLIFY_DOMAIN'",
                    "EvaluateTargetHealth": true
                }
            }
        }]
    }'

# Create CNAME for www subdomain
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "www.'$DOMAIN_NAME'",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "'$NETLIFY_DOMAIN'"}]
            }
        }]
    }'

# Create CNAME for media subdomain
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "media.'$DOMAIN_NAME'",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "'$(terraform output -raw cloudfront_domain)'"}]
            }
        }]
    }'

# Create TXT record for domain verification
aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "_netlify-domain-challenge.'$DOMAIN_NAME'",
                "Type": "TXT",
                "TTL": 300,
                "ResourceRecords": [{"Value": "\"netlify-domain-verification='$NETLIFY_SITE_ID'\""}]
            }
        }]
    }'

echo "DNS setup complete!"
echo "Nameservers for $DOMAIN_NAME:"
echo "$NAMESERVERS"
echo ""
echo "Next steps:"
echo "1. Update your domain's nameservers at your domain registrar with the above nameservers"
echo "2. Wait for DNS propagation (may take up to 48 hours)"
echo "3. Verify domain ownership in Netlify"
echo "4. Enable HTTPS in Netlify" 