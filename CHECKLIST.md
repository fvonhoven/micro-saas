# Pre-Deployment Checklist

Use this checklist to ensure everything is configured before deploying to production.

## 🔧 Development Setup

- [ ] Node.js 18+ installed
- [ ] pnpm 8+ installed (`npm install -g pnpm`)
- [ ] Git repository initialized
- [ ] Run `pnpm install` successfully
- [ ] All TypeScript files compile without errors

## 🔥 Firebase Configuration

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Service account key downloaded
- [ ] Firestore indexes created:
  - [ ] `monitors` (userId, createdAt)
  - [ ] `monitors` (status, nextExpectedAt)
  - [ ] `forms` (userId, createdAt)
  - [ ] `apiKeys` (userId, createdAt)
  - [ ] `apiKeys` (key)
  - [ ] `screenshots` (cacheKey)
- [ ] Firebase Security Rules configured
- [ ] Storage CORS configured

## 💳 Stripe Configuration

- [ ] Stripe account created
- [ ] Products created for all three apps:
  - [ ] CronGuard (Starter, Pro, Team)
  - [ ] FormVault (Solo, Pro, Agency)
  - [ ] SnipShot (Starter, Pro, Scale)
- [ ] Price IDs copied to `packages/billing/src/plans.ts`
- [ ] Webhook endpoints configured (one per app)
- [ ] Webhook secrets saved
- [ ] Test mode verified working

## 📧 Resend Configuration

- [ ] Resend account created
- [ ] Domain added and verified
- [ ] API key generated
- [ ] Email templates tested
- [ ] From address configured in templates

## 🔴 Upstash Redis (SnipShot only)

- [ ] Upstash account created
- [ ] Redis database created
- [ ] REST URL and token copied

## 🖼️ Browserless (SnipShot only)

- [ ] Browserless account created
- [ ] API key obtained
- [ ] Screenshot endpoint tested

## 🌍 Environment Variables

### CronGuard (.env.local)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

### FormVault (.env.local)
- [ ] All Firebase variables (same as above)
- [ ] All Stripe variables (different webhook secret)
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

### SnipShot (.env.local)
- [ ] All Firebase variables
- [ ] All Stripe variables (different webhook secret)
- [ ] `RESEND_API_KEY`
- [ ] `UPSTASH_REDIS_URL`
- [ ] `UPSTASH_REDIS_TOKEN`
- [ ] `BROWSERLESS_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

## 🧪 Local Testing

- [ ] CronGuard runs on port 3000
- [ ] FormVault runs on port 3001
- [ ] SnipShot runs on port 3002
- [ ] Can create account on each app
- [ ] Can sign in/out on each app
- [ ] CronGuard: Can create monitor
- [ ] CronGuard: Ping endpoint works
- [ ] FormVault: Can create form
- [ ] FormVault: Can generate access link
- [ ] FormVault: Can upload file via magic link
- [ ] SnipShot: Can create API key
- [ ] SnipShot: Screenshot API works
- [ ] No console errors in browser
- [ ] No TypeScript errors

## 🚀 Netlify Setup

### CronGuard
- [ ] Netlify site created
- [ ] All environment variables added
- [ ] Build command: `pnpm build`
- [ ] Publish directory: `.next`
- [ ] Functions directory: `netlify/functions`
- [ ] Scheduled function appears in dashboard

### FormVault
- [ ] Netlify site created
- [ ] All environment variables added
- [ ] Build settings configured

### SnipShot
- [ ] Netlify site created
- [ ] All environment variables added (including Upstash & Browserless)
- [ ] Build settings configured

## 🔒 Security

- [ ] `.env.local` files in `.gitignore`
- [ ] No secrets committed to git
- [ ] Firebase Security Rules reviewed
- [ ] Stripe webhook signatures verified
- [ ] Rate limiting configured (SnipShot)
- [ ] CORS properly configured
- [ ] HTTPS enabled on all domains

## 📊 Post-Deployment

- [ ] All three apps accessible via URLs
- [ ] Can create account on production
- [ ] Can complete full user flow on each app
- [ ] Stripe webhooks receiving events
- [ ] CronGuard scheduled function running
- [ ] Email notifications working
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)

## 📝 Documentation

- [ ] README.md reviewed
- [ ] DEPLOYMENT.md followed
- [ ] API_REFERENCE.md accurate
- [ ] Custom domain configured (optional)
- [ ] Team members have access

## 🎉 Launch Ready

- [ ] All items above checked
- [ ] Backup plan in place
- [ ] Monitoring configured
- [ ] Support email configured
- [ ] Pricing page live
- [ ] Terms of Service added
- [ ] Privacy Policy added

---

**Once all items are checked, you're ready to launch! 🚀**

