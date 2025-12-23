# Cloud Secrets Setup Guide

## Overview
For enhanced security, the Gemini API key is now stored in **Firebase Cloud Secret Manager** instead of Firestore. This prevents unauthorized access and follows security best practices.

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project with Blaze (pay-as-you-go) plan
- Admin access to your Firebase project

## Step 1: Set Up the Secret

### Option A: Using Firebase CLI (Recommended)

1. **Login to Firebase** (if not already logged in):
   ```bash
   firebase login
   ```

2. **Navigate to your functions directory**:
   ```bash
   cd webfront-ai/functions
   ```

3. **Create the secret** during deployment:
   ```bash
   firebase deploy --only functions
   ```

4. **When prompted**, enter your Gemini API key:
   - The CLI will detect the `defineSecret("GEMINI_API_KEY")` in your code
   - It will prompt: "Enter a value for GEMINI_API_KEY"
   - Paste your Gemini API key (it will be hidden as you type)
   - Press Enter to confirm

### Option B: Using Google Cloud Console

1. **Open Google Cloud Console**:
   - Go to https://console.cloud.google.com
   - Select your Firebase project

2. **Navigate to Secret Manager**:
   - In the left menu, find "Security" → "Secret Manager"
   - Or search for "Secret Manager" in the top search bar
   - Enable the Secret Manager API if prompted

3. **Create a new secret**:
   - Click "CREATE SECRET"
   - Name: `GEMINI_API_KEY` (must match exactly)
   - Secret value: Paste your Gemini API key
   - Click "CREATE SECRET"

4. **Grant access to Cloud Functions**:
   - Find your secret in the list
   - Click on `GEMINI_API_KEY`
   - Go to "PERMISSIONS" tab
   - Click "GRANT ACCESS"
   - Add member: `[YOUR-PROJECT-ID]@appspot.gserviceaccount.com`
   - Role: "Secret Manager Secret Accessor"
   - Click "SAVE"

## Step 2: Deploy Cloud Functions

Deploy your updated Cloud Functions with the secret:

```bash
cd webfront-ai/functions
firebase deploy --only functions
```

## Step 3: Verify the Setup

1. **Test the chatbot** on your website
2. **Check Cloud Functions logs**:
   ```bash
   firebase functions:log
   ```
3. Look for any errors related to "GEMINI_API_KEY not configured"

## Step 4: Clean Up Old Firestore Data (Optional)

For maximum security, remove the old API key from Firestore:

1. Go to Firebase Console → Firestore Database
2. Navigate to `admin` → `ai_settings`
3. Delete the `geminiKey` field if it exists

## Getting Your Gemini API Key

If you don't have a Gemini API key yet:

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy...`)

## Troubleshooting

### Error: "API key not configured in Cloud Secrets"

**Solution**: The secret wasn't created or deployed properly.
- Re-run `firebase deploy --only functions`
- Ensure you entered the API key when prompted

### Error: "Permission denied on secret"

**Solution**: The Cloud Function service account doesn't have access.
- Follow "Option B" above to grant permissions manually
- Ensure the secret name is exactly `GEMINI_API_KEY`

### Error: "Secret Manager API not enabled"

**Solution**: Enable the API in Google Cloud Console:
```bash
gcloud services enable secretmanager.googleapis.com
```

## Security Benefits

✅ **API keys are encrypted** at rest and in transit
✅ **Access is restricted** to authorized Cloud Functions only
✅ **Audit logs** track all secret access
✅ **Secrets are isolated** from your codebase
✅ **No accidental exposure** in client-side code or logs

## Cost

- Secret Manager pricing: $0.06 per 10,000 access operations
- For typical usage, this is negligible (< $1/month)

## Additional Resources

- [Firebase Secret Manager Documentation](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
