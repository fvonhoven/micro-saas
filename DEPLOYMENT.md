# Deployment Guide

This guide walks you through deploying all three micro-SaaS apps to Netlify.

## Prerequisites

- Netlify account
- Firebase project configured
- Stripe account with products created
- Resend account with verified domain
- Upstash Redis instance (for SnipShot)
- Browserless account (for SnipShot)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Google Analytics (optional)

### 1.2 Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable "Email/Password"

### 1.3 Create Firestore Database

1. Go to Firestore Database
2. Create database in production mode
3. Choose a location close to your users

### 1.4 Create Storage Bucket

1. Go to Storage
2. Get started with default security rules
3. Note your bucket name

### 1.5 Get Firebase Config

1. Go to Project Settings > General
2. Scroll to "Your apps" and add a Web app
3. Copy the Firebase config object
4. Go to Project Settings > Service Accounts
5. Click "Generate new private key"
6. Save the JSON file securely

### 1.6 Create Firestore Indexes

Run these commands in Firestore:

```javascript
// Monitors collection
db.collection('monitors').createIndex({
  userId: 1,
  createdAt: -1
})

db.collection('monitors').createIndex({
  status: 1,
  nextExpectedAt: 1
})

// Forms collection
db.collection('forms').createIndex({
  userId: 1,
  createdAt: -1
})

// API Keys collection
db.collection('apiKeys').createIndex({
  userId: 1,
  createdAt: -1
})

db.collection('apiKeys').createIndex({
  key: 1
})

// Screenshots collection
db.collection('screenshots').createIndex({
  cacheKey: 1
})
```

## Step 2: Stripe Setup

### 2.1 Create Products

Create three products in Stripe Dashboard:

**CronGuard Plans:**
- Starter: $9/month - 5 monitors
- Pro: $29/month - 25 monitors
- Team: $79/month - Unlimited monitors

**FormVault Plans:**
- Solo: $24/month - 10GB storage
- Pro: $49/month - 50GB storage
- Agency: $99/month - 500GB storage

**SnipShot Plans:**
- Starter: $19/month - 500 screenshots
- Pro: $49/month - 2,500 screenshots
- Scale: $99/month - 10,000 screenshots

### 2.2 Get Price IDs

Copy the price IDs for each plan and update `packages/billing/src/plans.ts`

### 2.3 Set Up Webhooks

For each app, create a webhook endpoint:
- CronGuard: `https://cronguard.netlify.app/api/webhooks/stripe`
- FormVault: `https://formvault.netlify.app/api/webhooks/stripe`
- SnipShot: `https://snipshot.netlify.app/api/webhooks/stripe`

Select these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the webhook signing secret for each.

## Step 3: Resend Setup

1. Sign up at https://resend.com
2. Add and verify your domain
3. Create an API key
4. Update email templates in `packages/email/src/templates.ts` with your domain

## Step 4: Upstash Redis (SnipShot only)

1. Sign up at https://upstash.com
2. Create a new Redis database
3. Copy the REST URL and token

## Step 5: Browserless (SnipShot only)

1. Sign up at https://browserless.io
2. Get your API key from the dashboard

## Step 6: Deploy to Netlify

### 6.1 Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

### 6.2 Deploy CronGuard

```bash
cd apps/cronguard
netlify init
# Follow prompts to create new site
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "your-key"
netlify env:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "your-domain"
# ... set all environment variables from .env.example
netlify deploy --prod
```

### 6.3 Deploy FormVault

```bash
cd apps/formvault
netlify init
# Set all environment variables
netlify deploy --prod
```

### 6.4 Deploy SnipShot

```bash
cd apps/snipshot
netlify init
# Set all environment variables including Upstash and Browserless
netlify deploy --prod
```

## Step 7: Configure Environment Variables

For each Netlify site, go to Site Settings > Environment Variables and add:

### All Apps
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

### SnipShot Additional
```
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
BROWSERLESS_API_KEY=
```

## Step 8: Test Deployments

1. Visit each deployed site
2. Create a test account
3. Test core functionality:
   - CronGuard: Create a monitor, send a ping
   - FormVault: Create a form, generate access link
   - SnipShot: Create API key, test screenshot endpoint

## Step 9: Set Up Custom Domains (Optional)

1. Go to Site Settings > Domain Management
2. Add custom domain
3. Configure DNS records
4. Enable HTTPS

## Troubleshooting

### Build Failures
- Check that all environment variables are set
- Verify pnpm version matches package.json
- Check build logs for specific errors

### Runtime Errors
- Verify Firebase credentials are correct
- Check Firestore security rules
- Verify Stripe webhook secrets match

### Scheduled Functions (CronGuard)
- Verify the function appears in Netlify Functions dashboard
- Check function logs for errors
- Ensure Firebase Admin SDK is initialized correctly

## Monitoring

- Set up Netlify Analytics for traffic monitoring
- Configure Sentry or similar for error tracking
- Monitor Firebase usage and quotas
- Track Stripe subscription metrics

## Security Checklist

- [ ] All environment variables are set
- [ ] Firebase Security Rules are configured
- [ ] Stripe webhooks are verified
- [ ] HTTPS is enabled on all domains
- [ ] API keys are never exposed to client
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

