# Setting Up Firebase Secrets

## Quick Setup (Run these commands)

### 1. Install Firebase Tools (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Set the Gemini API Key Secret
```bash
cd c:\Projects\AI_agency\webfront-ai
firebase functions:secrets:set GEMINI_API_KEY --project webfrontai-42249
```

When prompted, paste your Gemini API key and press Enter.

### 4. Verify the Secret Was Created
```bash
firebase functions:secrets:access GEMINI_API_KEY --project webfrontai-42249
```

### 5. Deploy Again
```bash
firebase deploy --only functions --project webfrontai-42249
```

## Alternative: Create via Google Cloud Console

1. Visit: https://console.cloud.google.com/security/secret-manager?project=webfrontai-42249
2. Click "CREATE SECRET"
3. Name: `GEMINI_API_KEY`
4. Value: (paste your Gemini API key)
5. Click "CREATE SECRET"

## For GitHub Actions Deployment

After creating the secret via either method above, your GitHub Actions will automatically have access to it when deploying.

## Troubleshooting

If you still get permission errors, grant the Cloud Functions service account access:

```bash
gcloud projects add-iam-policy-binding webfrontai-42249 \
  --member="serviceAccount:webfrontai-42249@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
