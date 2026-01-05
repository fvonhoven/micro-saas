# Micro-SaaS Monorepo

A production-ready monorepo containing three micro-SaaS products built with Next.js 14, Firebase, and Stripe.

## 🚀 Products

### 1. **CronGuard** - Cron Job Monitoring

Monitor your cron jobs and get instant alerts when they fail to check in.

- **Port**: 3000
- **Features**: Ping URLs, health monitoring, email alerts, grace periods
- **Tech**: Next.js, Firebase Firestore, Netlify Scheduled Functions

### 2. **FormVault** - Secure Document Collection

Collect documents from clients without requiring them to create accounts.

- **Port**: 3001
- **Features**: Magic links, file uploads, Firebase Storage, email notifications
- **Tech**: Next.js, Firebase Storage, Resend

### 3. **SnipShot** - Screenshot API

Capture website screenshots via API with CDN hosting and caching.

- **Port**: 3002
- **Features**: Screenshot API, rate limiting, usage tracking, CDN delivery
- **Tech**: Next.js, Browserless, Upstash Redis, Firebase Storage

## 📦 Shared Packages

- **@repo/firebase** - Firebase client & admin SDK
- **@repo/auth** - Authentication utilities & hooks
- **@repo/billing** - Stripe integration & plans
- **@repo/email** - Resend email client & templates
- **@repo/ui** - Shared UI components (Tailwind + shadcn/ui)

## 🛠️ Tech Stack

| Layer         | Technology               |
| ------------- | ------------------------ |
| Monorepo      | Turborepo + pnpm         |
| Framework     | Next.js 14 (App Router)  |
| Language      | TypeScript (strict)      |
| Styling       | Tailwind CSS + shadcn/ui |
| Database      | Firebase Firestore       |
| Auth          | Firebase Auth            |
| Storage       | Firebase Storage         |
| Payments      | Stripe                   |
| Email         | Resend                   |
| Hosting       | Netlify                  |
| Rate Limiting | Upstash Redis            |
| Screenshots   | Browserless              |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project
- Stripe account
- Resend account
- Upstash Redis (for SnipShot)
- Browserless account (for SnipShot)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd micro-saas-monorepo
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` in each app directory and fill in your credentials:

```bash
cp .env.example apps/cronguard/.env.local
cp .env.example apps/formvault/.env.local
cp .env.example apps/snipshot/.env.local
```

4. **Run development servers**

Run all apps:

```bash
pnpm dev
```

Or run individual apps:

```bash
cd apps/cronguard && pnpm dev  # Port 3000
cd apps/formvault && pnpm dev  # Port 3001
cd apps/snipshot && pnpm dev   # Port 3002
```

## 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Create a Storage bucket
5. Generate a service account key (Settings > Service Accounts)
6. Add Firebase config to your `.env.local` files

### Firestore Indexes

You need to create composite indexes for efficient queries. Choose one of these methods:

#### Option 1: Automatic (Recommended)

Use Firebase CLI to deploy indexes automatically:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy indexes
firebase deploy --only firestore:indexes
```

#### Option 2: Generate Direct URLs

Run the helper script to get clickable URLs:

```bash
node scripts/create-firestore-indexes.js YOUR_PROJECT_ID
```

This will output direct links to create each index in the Firebase Console.

#### Option 3: Manual Creation

Create these composite indexes manually in the Firebase Console:

```
monitors: userId (Ascending), createdAt (Descending)
monitors: status (Ascending), nextExpectedAt (Ascending)  ⚡ CRITICAL for performance
forms: userId (Ascending), createdAt (Descending)
apiKeys: userId (Ascending), createdAt (Descending)
```

**Note:** Single-field indexes (like `apiKeys: key` and `screenshots: cacheKey`) are created automatically by Firestore.

## 💳 Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint: `https://your-app.netlify.app/api/webhooks/stripe`
3. Add webhook secret to environment variables
4. Update price IDs in `packages/billing/src/plans.ts`

## 📧 Resend Setup

1. Sign up at https://resend.com
2. Verify your domain
3. Create an API key
4. Add to environment variables

## 🚀 Deployment to Netlify

### Deploy Each App Separately

1. **CronGuard**

```bash
cd apps/cronguard
netlify deploy --prod
```

2. **FormVault**

```bash
cd apps/formvault
netlify deploy --prod
```

3. **SnipShot**

```bash
cd apps/snipshot
netlify deploy --prod
```

### Environment Variables on Netlify

Add all environment variables from `.env.example` to each Netlify site:

- Site Settings > Environment Variables

### Scheduled Functions (CronGuard)

The monitor check function runs every minute via Netlify Scheduled Functions.
No additional configuration needed - it's defined in `netlify.toml`.

## 📁 Project Structure

```
micro-saas/
├── apps/
│   ├── cronguard/       # Cron monitoring app
│   ├── formvault/       # Document collection app
│   └── snipshot/        # Screenshot API app
├── packages/
│   ├── firebase/        # Firebase SDK
│   ├── auth/            # Auth utilities
│   ├── billing/         # Stripe integration
│   ├── email/           # Email templates
│   └── ui/              # Shared components
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🔐 Security Notes

- Never commit `.env.local` files
- Use Firebase Security Rules for Firestore and Storage
- Validate all API inputs with Zod
- Rate limit public endpoints
- Use HTTPS only in production

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Netlify Hosting                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   CronGuard     │   FormVault     │      SnipShot           │
│   (Port 3000)   │   (Port 3001)   │     (Port 3002)         │
│                 │                 │                         │
│ • Ping API      │ • Form Builder  │ • Screenshot API        │
│ • Monitors      │ • Magic Links   │ • API Keys              │
│ • Alerts        │ • File Upload   │ • Rate Limiting         │
│ • Scheduled Fn  │ • Submissions   │ • CDN Delivery          │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │      Shared Packages (@repo)       │
         ├────────────────────────────────────┤
         │ • firebase  - Client & Admin SDK   │
         │ • auth      - Auth hooks & utils   │
         │ • billing   - Stripe integration   │
         │ • email     - Resend templates     │
         │ • ui        - Shared components    │
         └─────────────────┬──────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │        External Services           │
         ├────────────────────────────────────┤
         │ • Firebase (Auth, DB, Storage)     │
         │ • Stripe (Payments)                │
         │ • Resend (Email)                   │
         │ • Upstash Redis (Rate Limiting)    │
         │ • Browserless (Screenshots)        │
         └────────────────────────────────────┘
```

## 🔑 Key Features by App

### CronGuard

- ✅ Unique ping URLs for each monitor
- ✅ Configurable check intervals and grace periods
- ✅ Email alerts on failures
- ✅ Incident tracking
- ✅ Netlify scheduled function for health checks

### FormVault

- ✅ Magic link generation for clients
- ✅ No-login file uploads
- ✅ Firebase Storage integration
- ✅ Signed URLs for secure uploads
- ✅ Submission tracking

### SnipShot

- ✅ RESTful screenshot API
- ✅ SHA256-based caching
- ✅ Upstash Redis rate limiting (60/min)
- ✅ Browserless integration
- ✅ CDN-hosted images
- ✅ Usage analytics

## 📝 License

MIT
