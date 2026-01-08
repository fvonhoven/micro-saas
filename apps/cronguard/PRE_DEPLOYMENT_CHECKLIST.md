# 🚀 CronNarc Pre-Deployment Checklist

## ✅ Critical Security & Configuration

### 1. Firestore Security Rules

- [x] **Alert channels subcollection rules added** - Users can read/write their own channels
- [x] **Pings subcollection rules added** - Users can read, only server can write
- [ ] **Deploy updated rules to Firebase**
  ```bash
  firebase deploy --only firestore:rules
  ```

### 2. Environment Variables (Netlify)

Add these to Netlify Dashboard → Site Settings → Environment Variables:

**Firebase:**

- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY` (make sure to preserve newlines)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

**Stripe:**

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_CRONGUARD_STARTER_MONTHLY_PRICE_ID`
- [ ] `STRIPE_CRONGUARD_STARTER_ANNUAL_PRICE_ID`
- [ ] `STRIPE_CRONGUARD_PRO_MONTHLY_PRICE_ID`
- [ ] `STRIPE_CRONGUARD_PRO_ANNUAL_PRICE_ID`
- [ ] `STRIPE_CRONGUARD_TEAM_MONTHLY_PRICE_ID`
- [ ] `STRIPE_CRONGUARD_TEAM_ANNUAL_PRICE_ID`

**Email (Resend):**

- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (e.g., `https://cronnarc.com`)

### 3. Resend Email Configuration

- [ ] Domain verified in Resend dashboard
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Test email sent successfully from `noreply@cronnarc.com`

### 4. Stripe Configuration

- [ ] All 6 price IDs created (Starter/Pro/Team × Monthly/Annual)
- [ ] Webhook endpoint configured: `https://cronnarc.com/api/billing/webhook`
- [ ] Webhook secret copied to environment variables
- [ ] Test webhook delivery successful

### 5. Firebase Firestore Indexes

- [ ] `monitors` (userId ASC, createdAt DESC)
- [ ] `monitors` (status ASC, nextExpectedAt ASC) ⚡ **CRITICAL**
  ```bash
  firebase deploy --only firestore:indexes
  ```

---

## 🔒 Security Hardening

### Rate Limiting

- [x] **Netlify Edge Function rate limiting implemented**
  - Limits: 10 pings per minute per monitor
  - Runs at the edge (before hitting Next.js)
  - No external dependencies required
  - Returns 429 with `Retry-After` header when exceeded
  - Automatic cleanup of old entries

**Configuration:**

- File: `netlify/edge-functions/rate-limit-ping.ts`
- Limits: `MAX_REQUESTS_PER_WINDOW = 10` (adjustable)
- Window: `RATE_LIMIT_WINDOW_MS = 60000` (1 minute)

**To adjust limits**, edit `netlify/edge-functions/rate-limit-ping.ts`:

```typescript
const MAX_REQUESTS_PER_WINDOW = 10 // Change this value
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // Change this value
```

### Input Validation

- [x] All API endpoints use Zod validation
- [x] Monitor creation validates intervals and limits
- [x] Alert channel creation validates webhook URLs

---

## 🧪 Testing Checklist

### Core Functionality

- [ ] Create a monitor
- [ ] Ping endpoint works (GET and POST)
- [ ] Monitor goes DOWN when expected
- [ ] Monitor recovers when pinged
- [ ] Email alerts sent for DOWN events
- [ ] Email alerts sent for RECOVERY events
- [ ] Pause/Resume functionality works
- [ ] Delete monitor works

### Alert Channels

- [ ] Email channel works
- [ ] Slack channel works (test with real webhook)
- [ ] Discord channel works (test with real webhook)
- [ ] Custom webhook works
- [ ] Multiple channels send simultaneously
- [ ] Disabled channels don't send alerts

### Status Pages

- [ ] Public status page accessible without auth
- [ ] Status page shows correct uptime
- [ ] Status page shows recent incidents
- [ ] Status page auto-refreshes every 30 seconds
- [ ] Status page can be enabled/disabled

### Dashboard UX

- [ ] Search filters monitors correctly
- [ ] Status filter works
- [ ] Bulk select all works
- [ ] Bulk pause works
- [ ] Bulk resume works
- [ ] Bulk delete works (with confirmation)
- [ ] Mobile responsive layout works

### Billing

- [ ] Free plan limits enforced (2 monitors)
- [ ] Upgrade to Starter works
- [ ] Upgrade to Pro works
- [ ] Upgrade to Team works
- [ ] Plan change works (Starter → Pro)
- [ ] Downgrade shows warning
- [ ] Billing portal link works

---

## 📊 Monitoring & Observability

### Netlify Function Logs

- [ ] Check-monitors function runs every 5 minutes
- [ ] Logs show monitor checks
- [ ] Logs show alert sending (success/failure)
- [ ] No errors in function logs

### Error Tracking (Optional)

Consider adding error tracking:

- [ ] Sentry integration
- [ ] LogRocket for session replay
- [ ] Datadog for APM

---

## 🎯 Performance

### Build Optimization

- [x] Production build succeeds
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Bundle size reasonable (Dashboard: 7.14 kB)

### Database Optimization

- [x] Composite indexes created
- [x] Queries use indexes (no full collection scans)
- [x] Batch writes used where possible

---

## 📝 Documentation

- [ ] Update README with production URL
- [ ] Add API documentation for ping endpoint
- [ ] Create user guide for alert channels
- [ ] Document Slack app creation process
- [ ] Document Discord webhook creation process

---

## 🚀 Deployment Steps

1. **Deploy Firestore Rules & Indexes:**

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

2. **Add Environment Variables to Netlify**

3. **Deploy to Netlify:**

   ```bash
   cd apps/cronguard
   netlify deploy --prod
   ```

4. **Verify Deployment:**
   - [ ] Site loads at production URL
   - [ ] Login/signup works
   - [ ] Create monitor works
   - [ ] Ping endpoint works
   - [ ] Scheduled function runs

5. **Test End-to-End:**
   - [ ] Create test monitor
   - [ ] Let it go down
   - [ ] Verify alert received
   - [ ] Ping to recover
   - [ ] Verify recovery alert received

---

## 🎉 Post-Deployment

- [ ] Monitor Netlify function logs for errors
- [ ] Check Stripe webhook deliveries
- [ ] Monitor Resend email delivery rates
- [ ] Set up uptime monitoring for cronnarc.com itself (meta!)
- [ ] Announce launch! 🚀
