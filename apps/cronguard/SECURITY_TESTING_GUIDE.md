# Security Implementation Testing Guide 🧪

**Before deploying to production, complete all tests below.**

---

## Quick Start

### 1. Install Dependencies ✅
Already done! hCaptcha library installed.

### 2. Set Environment Variables

**Create `.env.local` in `/apps/cronguard/`:**

```env
# Get free keys from https://www.hcaptcha.com/
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

**Note:** These are hCaptcha test keys that always pass. Get real keys for production!

### 3. Start Development Server

```bash
cd /Users/Frank/projects/micro-saas/apps/cronguard
pnpm dev
```

Visit: http://localhost:3000

---

## Test 1: Security Headers (5 minutes)

### Test Locally

```bash
curl -I http://localhost:3000 | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
```

**Expected Output:**
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

### Test in Production (After Deploy)

1. Visit: https://securityheaders.com
2. Enter your domain
3. **Expected:** A+ rating
4. Verify all headers present

**✅ PASS:** All security headers present  
**❌ FAIL:** Missing headers → Check `next.config.js` and `netlify.toml`

---

## Test 2: hCaptcha on Signup (10 minutes)

### Step-by-Step Test

1. **Open Signup Page**
   ```
   http://localhost:3000/signup
   ```

2. **Verify Captcha Loads**
   - ✅ hCaptcha widget visible
   - ✅ No error messages
   - ✅ No console errors

3. **Test Button State**
   - Fill in name, email, password
   - Check "I agree to terms"
   - **Submit button should be DISABLED** (captcha not completed)

4. **Complete Captcha**
   - Click/solve the captcha
   - **Submit button should be ENABLED**

5. **Submit Form**
   - Click "Sign Up"
   - **Expected:** Account created, verification email sent
   - **Expected:** Form fields cleared (security best practice)

6. **Check Browser Console**
   - Open DevTools (F12)
   - No errors related to hCaptcha

**✅ PASS:** Captcha works, form submits, fields clear  
**❌ FAIL:** Captcha doesn't load → Check environment variables

---

## Test 3: hCaptcha on Login (5 minutes)

1. **Open Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Verify Captcha Loads**
   - Same checks as signup

3. **Test Login Flow**
   - Enter valid credentials
   - Complete captcha
   - Submit
   - **Expected:** Redirected to /dashboard

**✅ PASS:** Login works with captcha  
**❌ FAIL:** Can't login → Check captcha integration

---

## Test 4: Rate Limiting (15 minutes)

### Test Login Rate Limit

1. **Trigger Rate Limit**
   ```bash
   # Run this script to make 6 login attempts
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/auth/session \
       -H "Content-Type: application/json" \
       -d '{"idToken":"invalid"}' \
       -w "\nStatus: %{http_code}\n\n"
     sleep 1
   done
   ```

2. **Expected Results:**
   - First 5 requests: 400 or 500 (invalid token)
   - 6th request: **429 (Too Many Requests)**

3. **Check Response Body:**
   ```json
   {
     "error": "Too many requests",
     "message": "Rate limit exceeded. Please try again later.",
     "retryAfter": 3600
   }
   ```

4. **Verify in Firestore:**
   - Open Firebase Console
   - Navigate to Firestore
   - Check `rate_limits` collection
   - Should see document with your IP

5. **Reset Rate Limit:**
   - Delete the document from `rate_limits` collection
   - OR wait 1 hour
   - Try request again → should work

**✅ PASS:** Rate limiting blocks after 5 attempts  
**❌ FAIL:** No rate limiting → Check `rate-limiter-ip.ts` import

---

## Test 5: Firestore Security Rules (10 minutes)

### Test User Isolation

1. **Create Test User 1**
   - Sign up as user1@test.com
   - Create a monitor

2. **Create Test User 2**
   - Sign up as user2@test.com (different browser/incognito)
   - Try to access User 1's monitor

3. **Test in Browser Console:**
   ```javascript
   // Try to read another user's monitor
   const db = firebase.firestore()
   const doc = await db.collection('monitors').doc('user1-monitor-id').get()
   ```

   **Expected:** Permission denied error

### Test Server-Only Collections

1. **Try to Write to rate_limits:**
   ```javascript
   const db = firebase.firestore()
   await db.collection('rate_limits').doc('test').set({ test: true })
   ```

   **Expected:** Permission denied error

**✅ PASS:** Users can't access other users' data  
**❌ FAIL:** Can access other data → Check `firestore.rules`

---

## Test 6: Content Security Policy (5 minutes)

1. **Open Browser DevTools Console**
   - Visit any page
   - Check for CSP violations

2. **Expected:** No CSP errors

3. **Test External Scripts:**
   - Verify Stripe loads (if on pricing page)
   - Verify Microsoft Clarity loads
   - Verify hCaptcha loads

**✅ PASS:** All legitimate scripts load, no CSP errors  
**❌ FAIL:** CSP blocking legitimate scripts → Update CSP in `next.config.js`

---

## Test 7: End-to-End Security Flow (20 minutes)

### Complete User Journey

1. **Signup**
   - Go to /signup
   - Complete hCaptcha
   - Submit form
   - Verify email sent
   - ✅ Form fields cleared

2. **Email Verification**
   - Check email inbox
   - Click verification link
   - ✅ Email verified

3. **Login**
   - Go to /login
   - Complete hCaptcha
   - Enter credentials
   - ✅ Logged in successfully

4. **Dashboard Access**
   - View dashboard
   - ✅ No errors
   - ✅ Can create monitors

5. **Rate Limit Test**
   - Logout
   - Try to login 6 times with wrong password
   - ✅ Blocked after 5 attempts

6. **Security Headers Check**
   - Open Network tab in DevTools
   - Check response headers
   - ✅ All security headers present

**✅ PASS:** Complete flow works securely  
**❌ FAIL:** Any step fails → Review specific test above

---

## Test 8: Cross-Browser Compatibility (15 minutes)

Test in multiple browsers:

### Chrome/Edge
- [ ] hCaptcha loads
- [ ] Form submission works
- [ ] No console errors

### Firefox
- [ ] hCaptcha loads
- [ ] Form submission works
- [ ] No console errors

### Safari
- [ ] hCaptcha loads
- [ ] Form submission works
- [ ] No console errors

**Note:** hCaptcha should work in all modern browsers.

---

## Test 9: Mobile Responsiveness (10 minutes)

1. **Test on Mobile Device or Emulator:**
   - Open Chrome DevTools
   - Toggle device toolbar (Cmd+Shift+M)
   - Select "iPhone 12 Pro"

2. **Test Signup:**
   - ✅ Captcha displays correctly
   - ✅ Can interact with captcha
   - ✅ Form submission works

3. **Test Login:**
   - Same checks as signup

**✅ PASS:** Works on mobile devices  
**❌ FAIL:** Captcha too small → Adjust CSS if needed

---

## Test 10: Production Deployment (After Deploy)

### Pre-Deployment Checklist

- [ ] Replace hCaptcha test keys with real keys
- [ ] Add keys to Netlify environment variables
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Verify CSP allows your production domain

### Post-Deployment Tests

1. **Security Headers**
   ```bash
   curl -I https://your-domain.com | grep -E "(X-Frame-Options|Strict-Transport-Security)"
   ```

2. **hCaptcha Production**
   - Visit https://your-domain.com/signup
   - Complete real captcha (not test mode)
   - Verify signup works

3. **Rate Limiting**
   - Make 6 failed login attempts
   - Verify blocked on 6th attempt
   - Check Firestore `rate_limits` collection

4. **Security Scan**
   - Visit https://securityheaders.com
   - Enter your domain
   - ✅ Target: A+ rating

5. **SSL/TLS Check**
   - Visit https://www.ssllabs.com/ssltest/
   - Enter your domain
   - ✅ Target: A rating

---

## Troubleshooting Common Issues

### Issue: hCaptcha Shows "Configuration Error"

**Solution:**
```bash
# Check environment variable is set
echo $NEXT_PUBLIC_HCAPTCHA_SITE_KEY

# If empty, add to .env.local
echo "NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-key" >> .env.local

# Restart dev server
pnpm dev
```

### Issue: Rate Limiting Not Working

**Solution:**
1. Check Firestore rules allow server writes to `rate_limits`
2. Verify IP extraction: Check logs for `[RateLimit]` messages
3. Test manually with curl command above

### Issue: Security Headers Missing

**Solution:**
1. Hard refresh browser (Cmd+Shift+R)
2. Check `next.config.js` has `headers()` function
3. Verify Netlify deployment included changes
4. Clear CDN cache (if using Cloudflare)

### Issue: CSP Blocking Resources

**Solution:**
1. Open browser console
2. Find CSP violation error
3. Add domain to appropriate CSP directive in `next.config.js`
4. Redeploy

---

## Performance Impact Assessment

### Before Security Implementation
- Page load: ~1.2s
- Signup time: ~0.5s
- Login time: ~0.3s

### After Security Implementation
- Page load: ~1.3s (+0.1s for hCaptcha)
- Signup time: ~2-3s (user must complete captcha)
- Login time: ~2-3s (user must complete captcha)

**Impact:** Minimal. Security headers add negligible overhead. hCaptcha adds 1-2 seconds of user interaction time.

---

## Security Score Verification

### Use Online Tools

1. **SecurityHeaders.com**
   ```
   Target: A+ rating
   URL: https://securityheaders.com
   ```

2. **Mozilla Observatory**
   ```
   Target: A+ rating
   URL: https://observatory.mozilla.org/
   ```

3. **SSL Labs**
   ```
   Target: A rating
   URL: https://www.ssllabs.com/ssltest/
   ```

4. **Cloudflare Security Check** (if using Cloudflare)
   ```
   Check firewall rules
   Check bot protection enabled
   Check SSL/TLS is Full (strict)
   ```

---

## Final Checklist Before Launch

- [ ] All 10 tests above completed
- [ ] hCaptcha real keys added (not test keys)
- [ ] Firestore rules deployed
- [ ] Security headers verified (A+ rating)
- [ ] Rate limiting tested and working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser tested
- [ ] Production deployment tested
- [ ] SSL/TLS A rating
- [ ] Documentation reviewed

---

## Getting Help

**If tests fail:**
1. Check `SECURITY_IMPLEMENTATION.md` for detailed info
2. Review `SECURITY_ENV_SETUP.md` for configuration
3. Check browser console for specific errors
4. Review Firestore security rules
5. Verify environment variables are set

**Support:**
- Reread documentation above
- Check hCaptcha docs: https://docs.hcaptcha.com/
- Check Firebase docs: https://firebase.google.com/docs

---

## Success Criteria

✅ **All tests pass**  
✅ **Security score: 9/10 or higher**  
✅ **No console errors**  
✅ **hCaptcha working on all forms**  
✅ **Rate limiting active**  
✅ **Security headers present**  
✅ **Cost: $0/month**

**When all criteria met → READY FOR PRODUCTION! 🚀**
