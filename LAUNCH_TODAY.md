# Launch Today - Comprehensive Checklist 🚀

**You're ready to launch! Complete the checklist below.**

---

## ✅ Already Done

- Legal policies updated (Terms & Privacy)
- Payment failure handling (7-day grace period)
- Account deletion works
- Error handling in place
- "No refunds, as-is service" clearly stated
- **Security headers implemented**
- **hCaptcha bot protection integrated**
- **IP-based rate limiting active**
- **Enhanced Firestore security rules**

---

## 🔒 STEP 0: Security Setup (45 minutes) - DO FIRST!

### Why This Is Critical

Without completing this step, your auth forms won't work properly. This adds enterprise-grade security at $0/month cost.

### Task 0.1: Get hCaptcha Keys (5 minutes)

1. Go to: https://www.hcaptcha.com/
2. Sign up (free account)
3. Click "New Site"
4. Site settings:
   - Name: "CronNarc"
   - Hostnames: Add these:
     - `localhost`
     - `your-domain.netlify.app`
     - `cronnarc.com` (or your domain)
5. Copy your:
   - Site Key (starts with `10000000-...`)
   - Secret Key (starts with `0x...`)

### Task 0.2: Add Environment Variables (5 minutes)

**For Local Development:**

```bash
cd /Users/Frank/projects/micro-saas/apps/cronguard
cat >> .env.local << 'EOF'
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key-here
HCAPTCHA_SECRET_KEY=your-secret-key-here
EOF
```

**For Netlify (Production):**

1. Log into Netlify Dashboard
2. Go to: Site Settings → Environment Variables
3. Add two variables:
   - Variable name: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
   - Value: [paste your site key]
   - Variable name: `HCAPTCHA_SECRET_KEY`
   - Value: [paste your secret key]
4. Click "Save"
5. Trigger a new deployment (redeploy)

### Task 0.3: Deploy Firestore Security Rules (2 minutes)

```bash
cd /Users/Frank/projects/micro-saas
firebase deploy --only firestore:rules
```

Expected output:

```
✔  Deploy complete!
```

### Task 0.4: Test Security Setup (15 minutes)

**Test Locally:**

```bash
cd /Users/Frank/projects/micro-saas/apps/cronguard
pnpm dev
```

1. **Test Signup Page:**
   - Go to: http://localhost:3000/signup
   - ✅ hCaptcha widget loads
   - ✅ Complete captcha
   - ✅ Submit button enables
   - ✅ Can create account

2. **Test Login Page:**
   - Go to: http://localhost:3000/login
   - ✅ hCaptcha widget loads
   - ✅ Can login successfully

3. **Test Rate Limiting:**

   ```bash
   # Make 6 failed login attempts
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/auth/session \
       -H "Content-Type: application/json" \
       -d '{"idToken":"invalid"}' \
       -w "\nStatus: %{http_code}\n"
   done
   ```

   - ✅ 6th request returns 429 (rate limited)

4. **Check Firestore:**
   - Open Firebase Console
   - Navigate to Firestore
   - ✅ `rate_limits` collection exists

**If ANY test fails:** See `SECURITY_TESTING_GUIDE.md`

### Task 0.5: Test Production (After Deploy) (10 minutes)

1. **Deploy your app** (git push to Netlify)

2. **Test hCaptcha on Production:**
   - Visit: https://your-domain.com/signup
   - ✅ Real captcha loads (not test mode)
   - ✅ Can complete captcha
   - ✅ Can sign up

3. **Test Security Headers:**
   - Visit: https://securityheaders.com
   - Enter your domain
   - ✅ Target: A+ rating

4. **Test Rate Limiting:**
   - Try to login 6 times with wrong password
   - ✅ Should be blocked after 5 attempts

### 📚 Security Documentation

If you need help, see these guides:

- `apps/cronguard/SECURITY_COMPLETE.md` - Overview and summary
- `apps/cronguard/SECURITY_TESTING_GUIDE.md` - Detailed testing
- `apps/cronguard/SECURITY_ENV_SETUP.md` - Environment setup
- `apps/cronguard/SECURITY_IMPLEMENTATION.md` - Technical docs

**✅ Security Setup Complete! Now proceed to Steps 1-3 below.**

---

## 🔥 STEP 1-3: Launch Essentials

### Task 1: Email Forwarding (10 minutes)

**Go to your domain registrar** (where you registered cronnarc.com):

1. Log in to your domain control panel
2. Find "Email Forwarding" or "Email Management"
3. Add forwarding rule:
   ```
   support@cronnarc.com → your-email@gmail.com
   ```
4. Save and wait 1-2 minutes for activation
5. **Test it:**
   - Send email TO support@cronnarc.com from another address
   - Check you received it in your Gmail
6. **Set up "Reply As" in Gmail:**
   - Gmail → Settings → Accounts → "Send mail as"
   - Add email address: support@cronnarc.com
   - Gmail will send verification to support@ (which forwards to you)
   - Confirm verification
   - Now you can reply FROM support@cronnarc.com

**Done! ✓**

---

### Task 2: Stripe Billing Portal (10 minutes)

**Go to Stripe Dashboard:**

1. Navigate to: **Settings → Customer Portal**
2. Click "Activate test link" to try it first
3. Configuration:
   - **Subscription cancellation:** ON
   - **Cancellation behavior:** "Cancel at the end of billing period"
   - **Update payment methods:** ON
   - **View invoice history:** ON
   - **Update billing information:** ON (optional)
4. **Business information:**
   - Business name: CronNarc
   - Support email: support@cronnarc.com
5. **Save Changes**
6. **Activate in Production** (toggle from test to live mode)

**Test it:**

```bash
# Create a test portal session
curl https://api.stripe.com/v1/billing_portal/sessions \
  -u YOUR_STRIPE_SECRET_KEY: \
  -d customer=cus_test123 \
  -d return_url=https://yourapp.com/profile
```

Or test via your app's profile page "Manage Billing" button.

**Done! ✓**

---

### Task 3: Webhook Verification (25 minutes)

**1. Verify Webhook Endpoint (5 min)**

In Stripe Dashboard:

- Go to: **Developers → Webhooks**
- Check endpoint URL: Should be `https://yourdomain.com/api/webhooks/stripe`
- Check signing secret is set in your environment variables
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
  - `invoice.payment_action_required`

**2. Test in Test Mode (10 min)**

Using Stripe test mode:

1. Create a test subscription
2. Check webhook logs - should see `checkout.session.completed`
3. Cancel the subscription
4. Check webhook logs - should see `customer.subscription.deleted`
5. Verify user in your database was downgraded

**3. Test Payment Failure (10 min)**

Use test card that triggers payment failure:

- Card: `4000 0000 0000 0341` (always fails)
- Create subscription with this card
- Should trigger `invoice.payment_failed`
- Check that:
  - User received email about failed payment
  - Grace period was set (7 days)
  - User document has `paymentStatus: "past_due"`

**4. Check Logs**

In Stripe Dashboard:

- **Developers → Webhooks → [Your endpoint] → Events**
- All events should show 200 OK response
- Any 4xx or 5xx errors need to be fixed

**Done! ✓**

---

## 🎯 Verification Checklist

Before you announce launch, verify:

- [ ] Email test: Send to support@, receive it, reply from it
- [ ] Stripe portal test: Click "Manage Billing" in your app
- [ ] Webhook test: All events in Stripe show 200 OK
- [ ] Terms page loads: /terms
- [ ] Privacy page loads: /privacy
- [ ] Both pages show support@cronnarc.com contact
- [ ] Account deletion works (test with test account)

**All checked? You're ready! 🚀**

---

## 🚀 Launch!

**Announce with confidence:**

> "CronNarc is now live! 🎉
>
> Never miss a failed cron job again. Get instant alerts when your scheduled tasks don't check in.
>
> ✅ Free plan available
> ✅ Email, Slack & Discord alerts
> ✅ Public status pages
> ✅ Simple, transparent pricing
>
> Start monitoring: https://cronnarc.com"

---

## 📊 Post-Launch Monitoring (First Week)

**Day 1:**

- [ ] Check webhook logs every few hours
- [ ] Monitor support@cronnarc.com inbox
- [ ] Watch for any console errors in browser

**Day 2-7:**

- [ ] Check webhook logs daily
- [ ] Respond to support emails within 24 hours
- [ ] Monitor user signups and conversions

**Week 2:**

- [ ] Consider adding Sentry for error monitoring
- [ ] Review and refine Terms/Privacy if needed
- [ ] Add FAQ page if getting repeat questions

---

## 🆘 Common Issues & Solutions

**Issue: Email forwarding not working**

- Solution: Wait 24 hours for DNS propagation, check spam folder

**Issue: Stripe portal shows "Configuration not found"**

- Solution: Make sure it's activated in both test AND live mode

**Issue: Webhooks showing 401 Unauthorized**

- Solution: Check webhook signing secret matches environment variable

**Issue: User not downgraded after cancellation**

- Solution: Check webhook handler for `customer.subscription.deleted` event

---

## 💡 Quick Wins for Later

**After your first paying customer:**

- Add Google Workspace for professional email ($6/mo)
- Add Sentry for error monitoring (free tier)
- Create FAQ page based on support questions
- Consider adding testimonials from beta users

**After $1k MRR:**

- Get legal review of Terms/Privacy ($500-1k)
- Add automated data export feature
- Hire part-time support person
- Implement automated billing alerts

---

## 🎉 You've Got This!

Your "no frills, as-is service" approach is smart for MVP. You can always add:

- Refund policies later
- Service credits later
- More features later

**Right now, focus on:**

1. Getting these 3 things done (45 min)
2. Launching
3. Getting users
4. Learning what they actually need

**Stop perfecting, start launching!** 🚀

---

**Estimated Time:** 45 minutes  
**Cost:** $0 (using email forwarding)  
**Result:** Production-ready SaaS

Go! 💪
