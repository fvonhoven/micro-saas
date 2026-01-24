# Testing CronNarc

## 🚀 Quick Start - Run All Tests

### Unit Tests (Fast, Isolated)

Run unit tests with Vitest:

```bash
cd apps/cronguard
pnpm test                # Run all unit tests
pnpm test:watch          # Watch mode for development
pnpm test:coverage       # Generate coverage report
pnpm test:ui             # Open Vitest UI
```

**What's tested:**

- ✅ Rate limiter logic (14 tests)
- ✅ Email template structure (1 test)
- ✅ Billing helper functions (10 tests)

### Integration Tests (Full Stack)

Run integration tests:

```bash
node apps/cronguard/scripts/run-all-tests.js
```

**What's tested:**

- ✅ Rate limiting on live API endpoints
- ✅ Email verification flow
- ✅ Team collaboration features
- ✅ Billing and monitor limits
- ✅ Signup terms checkbox requirement
- ✅ Subscription cancellation monitor pausing
- ✅ Logout functionality (session + Firebase auth)

---

## 📊 Test Types

### Unit Tests ⚡ (Recommended for Development)

**Fast, isolated tests** that run in milliseconds:

- Test individual functions and classes
- No database or API calls
- Run on every code change
- Great for TDD (Test-Driven Development)

**Run with:**

```bash
pnpm test:watch
```

### Integration Tests 🔗 (Pre-Deployment)

**Full-stack tests** that test real API endpoints and database:

- Test complete user flows
- Require running server
- Slower but more comprehensive
- Run before deployment

**Run with:**

```bash
pnpm test:integration
```

---

## 📋 Individual Test Suites

### 1. Rate Limiting Tests

Tests that rate limiting is working on auth and API endpoints.

```bash
node apps/cronguard/scripts/test-rate-limiting.js
```

**What it tests:**

- Auth endpoint rate limiting (10 attempts per 15 minutes)
- Monitor creation rate limiting (5 per hour)
- General API rate limiting (100 per 15 minutes)

---

### 2. Email Verification Tests

Tests that email verification is required for new users.

```bash
node apps/cronguard/scripts/test-email-verification.js
```

**What it tests:**

- New users are created with `emailVerified: false`
- Monitor creation is blocked until email is verified
- Email verification banner shows on dashboard
- Users can resend verification email

---

### 3. Team Collaboration Tests

Tests team creation, invites, and permissions.

```bash
node apps/cronguard/scripts/test-teams.js
```

**What it tests:**

- Team creation with owner
- Team member management
- Team invite creation and expiration
- Role-based permissions

---

### 4. Billing & Monitor Limits Tests

Tests monitor limits, upgrades, downgrades, and payment handling.

```bash
node apps/cronguard/scripts/test-billing.js
```

**What it tests:**

- Monitor limit enforcement
- Upgrade prompts when limit is reached
- Downgrade flow with monitor archiving
- Payment failure grace period
- Payment warning banners

---

### 5. Email Template Tests

Test email sending with Resend.

```bash
node apps/cronguard/scripts/test-resend-email.js your-email@example.com
```

**What it tests:**

- Resend API configuration
- Email delivery
- Email template rendering

---

## Quick Test (Manual)

### 1. Create a Monitor

1. Go to `http://localhost:3000/dashboard`
2. Click "New Monitor"
3. Fill in:
   - **Name:** "Test Backup Job"
   - **Interval:** 1 minute
   - **Grace Period:** 1 minute
   - **Alert Email:** your-email@example.com
4. Click "Create Monitor"
5. **Copy the Ping URL** (e.g., `http://localhost:3000/api/ping/test-backup-job-123456`)

### 2. Send Test Pings

```bash
# Send a ping (monitor becomes HEALTHY)
curl http://localhost:3000/api/ping/YOUR_MONITOR_SLUG

# Wait 2+ minutes without pinging
# - After 1 min: Status → LATE
# - After 2 min: Status → DOWN (email sent)

# Send another ping (monitor recovers)
curl http://localhost:3000/api/ping/YOUR_MONITOR_SLUG
# Status → HEALTHY (recovery email sent)
```

---

## Test with Scripts

### Option 1: Bash Script

1. **Edit `test-cron.sh`** and replace `YOUR_MONITOR_SLUG`
2. **Make it executable:**
   ```bash
   chmod +x apps/cronguard/test-cron.sh
   ```
3. **Run it:**
   ```bash
   ./apps/cronguard/test-cron.sh
   ```

### Option 2: Node.js Script

1. **Edit `test-cron.js`** and replace `YOUR_MONITOR_SLUG`
2. **Make it executable:**
   ```bash
   chmod +x apps/cronguard/test-cron.js
   ```
3. **Run it:**
   ```bash
   node apps/cronguard/test-cron.js
   ```

---

## Set Up a Real Cron Job (macOS/Linux)

### 1. Edit your crontab

```bash
crontab -e
```

### 2. Add a test job that runs every minute

```bash
# Run test script every minute
* * * * * /path/to/micro-saas/apps/cronguard/test-cron.sh >> /tmp/cronguard-test.log 2>&1

# Or with Node.js
* * * * * /usr/local/bin/node /path/to/micro-saas/apps/cronguard/test-cron.js >> /tmp/cronguard-test.log 2>&1
```

### 3. View the logs

```bash
tail -f /tmp/cronguard-test.log
```

### 4. Test failure scenario

To test what happens when a job fails:

1. **Stop the cron job** (comment it out in crontab)
2. **Wait 2+ minutes**
3. **Check your email** - You should receive a DOWN alert
4. **Re-enable the cron job**
5. **Wait 1 minute** - You should receive a recovery alert

---

## Real-World Examples

### Example 1: Database Backup

```bash
#!/bin/bash
# backup-db.sh

# Backup database
pg_dump mydb > /backups/mydb-$(date +%Y%m%d).sql

# If backup succeeded, ping CronGuard
if [ $? -eq 0 ]; then
  curl -s https://cronguard.com/api/ping/backup-job-123456
fi
```

**Crontab:**

```bash
0 2 * * * /scripts/backup-db.sh  # Every day at 2 AM
```

### Example 2: API Data Sync

```javascript
// sync-data.js
const fetch = require("node-fetch")

async function syncData() {
  // Fetch data from external API
  const response = await fetch("https://api.example.com/data")
  const data = await response.json()

  // Save to database
  await saveToDatabase(data)

  // Ping CronGuard on success
  await fetch("https://cronguard.com/api/ping/sync-job-123456")
}

syncData().catch(console.error)
```

**Crontab:**

```bash
*/15 * * * * node /scripts/sync-data.js  # Every 15 minutes
```

### Example 3: Clean Up Old Files

```bash
#!/bin/bash
# cleanup.sh

# Delete files older than 30 days
find /tmp/uploads -type f -mtime +30 -delete

# Ping CronGuard
curl -s https://cronguard.com/api/ping/cleanup-job-123456
```

**Crontab:**

```bash
0 * * * * /scripts/cleanup.sh  # Every hour
```

---

## Testing the Background Checker

**Note:** The background checker (`check-monitors.ts`) only runs on Netlify in production.

To test locally, you can manually trigger it:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run the function locally
netlify functions:invoke check-monitors
```

Or deploy to Netlify and check the function logs:

1. Deploy to Netlify
2. Go to Netlify Dashboard → Functions
3. Click "check-monitors"
4. View logs to see it running every minute

---

## Cron Schedule Examples

```bash
# Every minute
* * * * * /script.sh

# Every 5 minutes
*/5 * * * * /script.sh

# Every hour
0 * * * * /script.sh

# Every day at 2 AM
0 2 * * * /script.sh

# Every Monday at 9 AM
0 9 * * 1 /script.sh

# Every 1st of the month
0 0 1 * * /script.sh

# Every 15 minutes during business hours (9 AM - 5 PM)
*/15 9-17 * * * /script.sh
```

---

## Troubleshooting

### Monitor stays PENDING

- Make sure you're pinging the correct URL
- Check the monitor slug matches
- Verify the ping endpoint is working: `curl -v http://localhost:3000/api/ping/YOUR_SLUG`

### No emails received

- Check `RESEND_API_KEY` is set in environment variables
- Verify the alert email is correct in the monitor settings
- Check Netlify function logs for email errors

### Cron job not running

- Check cron is running: `ps aux | grep cron`
- View cron logs: `tail -f /var/log/syslog | grep CRON` (Linux) or `log show --predicate 'process == "cron"' --last 1h` (macOS)
- Make sure script has execute permissions: `chmod +x script.sh`
- Use absolute paths in crontab

---

## 🆕 Testing New Features (Priorities 1-7)

### Priority 1: Monitor Limit Enforcement & Upgrade Flow

**Manual Test:**

1. Create a free account (2 monitor limit)
2. Create 2 monitors
3. Try to create a 3rd monitor
4. Should see upgrade modal prompting to upgrade
5. Usage warning banner should appear at 80%+ capacity (2/2 monitors)

**API Test:**

```bash
# Check monitor usage
curl http://localhost:3000/api/monitors/usage \
  -H "Cookie: session=YOUR_SESSION_COOKIE"

# Expected response:
# { "used": 2, "limit": 2, "percentage": 100 }
```

---

### Priority 2: Downgrade Handling

**Manual Test:**

1. Create a Pro account with 10 monitors
2. Downgrade to Starter plan (5 monitors)
3. Should see monitor selection modal
4. Select 5 monitors to keep
5. Remaining 5 should be archived
6. Receive downgrade confirmation email

---

### Priority 3: Team Collaboration Features

**Manual Test:**

1. Create a team via POST /api/teams
2. Invite a team member via POST /api/teams/[id]/invites
3. Accept invite via /invites/[token]
4. Switch to team context in TeamSelector
5. Create a monitor (should have teamId set)
6. Verify team members can view/edit based on role

---

### Priority 4: Stripe Proration & Mid-Cycle Upgrades

**Manual Test:**

1. Subscribe to Starter plan
2. Upgrade to Pro plan immediately
3. Should see proration preview showing prorated charge
4. Confirm upgrade
5. Receive upgrade confirmation email
6. Check Stripe dashboard for prorated invoice

---

### Priority 5: Slack Integration

**Already Complete!** Test by:

1. Go to monitor settings
2. Add Slack alert channel
3. Enter Slack incoming webhook URL
4. Test notification
5. Verify message appears in Slack channel

---

### Priority 6: Failed Payment Handling

**Manual Test:**

1. Use Stripe test card that triggers payment failure: `4000000000000341`
2. Wait for webhook to process
3. Should see payment warning banner on dashboard
4. Grace period should be set to 7 days
5. Receive payment failed email
6. Update payment method
7. Payment should succeed and banner should disappear

**Webhook Test:**

Use Stripe CLI to trigger webhooks:

```bash
stripe trigger invoice.payment_failed
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_action_required
```

---

### Priority 7: Free Tier Abuse Prevention

**Email Verification Test:**

1. Sign up with new account
2. Should see "Check your email!" message
3. Try to create monitor before verifying
4. Should get error: "Please verify your email address"
5. Verify email via link
6. Should now be able to create monitors

**Rate Limiting Test:**

```bash
# Run automated test
node apps/cronguard/scripts/test-rate-limiting.js

# Or test manually by making rapid requests
for i in {1..15}; do
  curl http://localhost:3000/api/auth/session \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"idToken": "fake-token"}'
  echo ""
done

# Should see 429 errors after 10 attempts
```

---

### Signup Terms & Privacy Agreement

**Automated Test:**

```bash
# Run automated test
node apps/cronguard/scripts/test-signup-terms.js
```

**Manual Test:**

1. Go to `/signup`
2. Fill in name, email, and password
3. Notice the "Sign Up" button is disabled until checkbox is checked
4. Try to submit without checking the terms checkbox
5. Should see validation error
6. Check the "I agree to the Terms of Service and Privacy Policy" checkbox
7. Verify links to `/terms` and `/privacy` open in new tabs
8. Submit form - should work now

**What's tested:**

- ✅ Terms checkbox is present and required
- ✅ Terms of Service link is present
- ✅ Privacy Policy link is present
- ✅ Button is disabled until checkbox is checked
- ✅ Form validation prevents submission without agreement

---

### Subscription Cancellation Monitor Pausing

**Automated Test:**

```bash
# Run automated test
node apps/cronguard/scripts/test-cancellation-pausing.js
```

**Manual Test (requires Stripe webhook):**

1. Create a paid subscription via Stripe Checkout
2. Create several monitors
3. Cancel the subscription in Stripe Dashboard
4. Stripe sends `customer.subscription.deleted` webhook
5. Verify all monitors are automatically paused
6. Check user's subscription status is set to "canceled"
7. Verify monitors can be manually resumed if needed

**What's tested:**

- ✅ Webhook handler for `customer.subscription.deleted` exists
- ✅ Updates user subscription status to "canceled"
- ✅ Queries all monitors belonging to the user
- ✅ Uses batch update for efficiency
- ✅ Sets monitor status to PAUSED
- ✅ Only pauses monitors that aren't already paused
- ✅ Logs the pausing action for debugging
- ✅ Terms of Service accurately reflects this behavior

**How it works:**

1. User cancels subscription in Stripe
2. Stripe sends `customer.subscription.deleted` webhook
3. Webhook handler updates user status to "canceled"
4. Webhook handler pauses all active monitors
5. User can manually resume monitors if needed (on free tier limits)

---

### Logout Functionality

**Automated Test:**

```bash
# Run automated test
node apps/cronguard/scripts/test-logout.js
```

**Manual Test:**

1. Log in to the dashboard
2. Click on your profile avatar (top right)
3. Click "Logout"
4. Verify you're redirected to `/login`
5. Try to access `/dashboard` directly
6. Should be redirected back to `/login` (not logged in)
7. Check browser cookies - `session` cookie should be deleted

**What's tested:**

- ✅ DELETE `/api/auth/session` endpoint exists and works
- ✅ Session cookie is properly deleted
- ✅ Dashboard logout implementation is complete
- ✅ Pricing page logout implementation is complete
- ✅ Profile page logout implementation is complete
- ✅ Monitor detail page logout implementation is complete
- ✅ Team settings page logout implementation is complete

**How it works:**

1. User clicks "Logout" button
2. Client calls `DELETE /api/auth/session` to delete server-side session cookie
3. Client calls Firebase `signOut(auth)` to clear client-side auth state
4. User is redirected to `/login`
5. All subsequent requests are unauthenticated

**Bug Fixed:**

Previously, some pages (pricing, monitor detail) had incomplete logout implementations that only redirected to `/login` without actually logging out. This caused users to remain logged in after clicking "Logout". All pages now properly clear both session cookies and Firebase auth state.

---

## 📊 Test Coverage Summary

| Feature                    | Automated Tests | Manual Tests | Status   |
| -------------------------- | --------------- | ------------ | -------- |
| Monitor Limits             | ✅              | ✅           | Complete |
| Upgrade Flow               | ✅              | ✅           | Complete |
| Downgrade Flow             | ✅              | ✅           | Complete |
| Team Collaboration         | ✅              | ✅           | Complete |
| Team Invites               | ✅              | ✅           | Complete |
| Stripe Proration           | ⚠️ Manual       | ✅           | Complete |
| Payment Failures           | ⚠️ Manual       | ✅           | Complete |
| Email Verification         | ✅              | ✅           | Complete |
| Rate Limiting              | ✅              | ✅           | Complete |
| Alert Channels             | ⚠️ Manual       | ✅           | Complete |
| Signup Terms Agreement     | ✅              | ✅           | Complete |
| Cancellation Monitor Pause | ✅              | ⚠️ Manual    | Complete |
| Logout Functionality       | ✅              | ✅           | Complete |

**Legend:**

- ✅ = Fully tested
- ⚠️ Manual = Requires manual testing (Stripe webhooks, etc.)

---

## 🎯 Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All automated tests pass: `node scripts/run-all-tests.js`
- [ ] Email verification works for new signups
- [ ] Rate limiting blocks excessive requests
- [ ] Monitor limits are enforced correctly
- [ ] Upgrade/downgrade flows work smoothly
- [ ] Team collaboration features work
- [ ] Payment failure webhooks are configured
- [ ] Stripe proration is working correctly
- [ ] All email templates render correctly
- [ ] Alert channels (Slack, Discord, Email) work
- [ ] Background checker runs on schedule
- [ ] Environment variables are set correctly
- [ ] Signup requires terms/privacy agreement
- [ ] Subscription cancellation pauses monitors
- [ ] Logout properly clears session and Firebase auth
