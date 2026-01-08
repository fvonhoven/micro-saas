# Netlify Environment Variables Setup

## Required Environment Variables for CronNarc

The Netlify scheduled function (`check-monitors.ts`) needs these environment variables to send emails:

### 1. Via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Select your CronNarc site
3. Navigate to: **Site settings** → **Environment variables**
4. Click **Add a variable** and add each of these:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----"
```

5. **Important**: Click **Save** then **trigger a new deploy** for changes to take effect

### 2. Via Netlify CLI

```bash
# Set environment variables
netlify env:set RESEND_API_KEY "re_xxxxxxxxxxxxx"
netlify env:set NEXT_PUBLIC_APP_URL "https://your-domain.com"
netlify env:set FIREBASE_PROJECT_ID "your-project-id"
netlify env:set FIREBASE_CLIENT_EMAIL "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
netlify env:set FIREBASE_PRIVATE_KEY "-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----"

# Trigger a new deploy
netlify deploy --prod
```

### 3. Verify Environment Variables

After setting variables, you can verify them:

```bash
netlify env:list
```

## Why This Is Needed

- Netlify Functions run in a separate environment from your local development
- They don't have access to your `.env.local` file
- Each Netlify site has its own environment variables
- The scheduled function `check-monitors.ts` needs these to:
  - Connect to Firebase (to read monitors)
  - Send emails via Resend (to alert users)
  - Generate correct URLs in emails

## Current Issue

If you're receiving emails from `onboarding@resend.dev` instead of `noreply@cronnarc.com`, it means:
- The `RESEND_API_KEY` environment variable is not set in Netlify
- OR the Resend API key doesn't have permission to send from your verified domain

## After Setting Variables

1. Redeploy your site (or wait for next deploy)
2. Check Netlify Function logs to verify it's working:
   - Go to **Functions** tab in Netlify dashboard
   - Click on `check-monitors`
   - View recent logs
3. Test by creating a monitor and letting it go down

