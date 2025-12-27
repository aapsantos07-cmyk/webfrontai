# Fix Secret Manager Permissions for GitHub Actions

Your GitHub Actions deployment is failing because the service account doesn't have permission to access Secret Manager. Here's how to fix it permanently.

## Quick Fix (Recommended)

### Option 1: Via Google Cloud Console (Easiest - No CLI needed)

1. **Go to IAM & Admin page:**
   - Visit: https://console.cloud.google.com/iam-admin/iam?project=webfrontai-42249

2. **Find your service account:**
   - Look for entries with emails like:
     - `firebase-adminsdk-xxxxx@webfrontai-42249.iam.gserviceaccount.com`
     - Or: `webfrontai-42249@appspot.gserviceaccount.com`
     - Or check your FIREBASE_SERVICE_ACCOUNT_WEBFRONTAI_42249 secret in GitHub for the `client_email` field

3. **Grant Secret Manager access:**
   - Click the **pencil icon (Edit)** next to the service account
   - Click **"+ ADD ANOTHER ROLE"**
   - Search for: `Secret Manager Secret Accessor`
   - Select it and click **SAVE**

4. **Push to GitHub again:**
   - Your deployment should now work!

### Option 2: Via Command Line (If you have gcloud CLI)

```bash
# Replace SERVICE_ACCOUNT_EMAIL with the actual email from step 2 above
gcloud projects add-iam-policy-binding webfrontai-42249 \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

Example:
```bash
gcloud projects add-iam-policy-binding webfrontai-42249 \
  --member="serviceAccount:webfrontai-42249@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## How to Find Your Service Account Email

1. Go to GitHub repository: Settings > Secrets and variables > Actions
2. Find `FIREBASE_SERVICE_ACCOUNT_WEBFRONTAI_42249`
3. The JSON has a field called `client_email` - that's your service account email

OR

Run this command:
```bash
gcloud iam service-accounts list --project=webfrontai-42249
```

## After Fixing Permissions

1. **Uncomment the functions deployment** in `.github/workflows/firebase-hosting-merge.yml`:
   ```yaml
   - name: Deploy Functions to Firebase
     run: npx firebase-tools deploy --only functions --project webfrontai-42249
   ```

2. **Push to GitHub** and the deployment will succeed with both hosting and functions!

## Current Workaround

For now, I've temporarily disabled functions deployment in your GitHub workflow so you can deploy your hosting changes (with all the SEO improvements). Once you fix the permissions, uncomment the functions deployment step.
