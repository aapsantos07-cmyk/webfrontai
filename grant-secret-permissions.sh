#!/bin/bash

# Script to grant Secret Manager permissions to GitHub Actions service account

PROJECT_ID="webfrontai-42249"

echo "Granting Secret Manager permissions for GitHub Actions..."

# Get the service account email from the GitHub secret
# You'll need to extract this from your FIREBASE_SERVICE_ACCOUNT_WEBFRONTAI_42249 secret
# It's in the "client_email" field of the JSON

# Grant Secret Manager Secret Accessor role to the service account
# Replace SERVICE_ACCOUNT_EMAIL with the actual email from your service account JSON

echo "Please run these commands with your service account email:"
echo ""
echo "gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "  --member=\"serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL\" \\"
echo "  --role=\"roles/secretmanager.secretAccessor\""
echo ""
echo "To find your service account email:"
echo "1. Go to GitHub repository Settings > Secrets and variables > Actions"
echo "2. Find FIREBASE_SERVICE_ACCOUNT_WEBFRONTAI_42249"
echo "3. Look for the 'client_email' field in the JSON"
echo ""
echo "Or check the default service account:"
echo "gcloud iam service-accounts list --project=$PROJECT_ID"
