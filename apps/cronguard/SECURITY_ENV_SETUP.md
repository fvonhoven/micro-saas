# Security Environment Variables Setup

## hCaptcha Configuration

### 1. Get hCaptcha Keys (Free)

1. Go to: https://www.hcaptcha.com/
2. Sign up for a free account
3. Click "New Site"
4. Site name: "CronNarc"
5. Hostnames: Add your domains:
   - `localhost` (for development)
   - `your-domain.netlify.app` (Netlify preview)
   - `your-domain.com` (production)
6. Copy the **Site Key** and **Secret Key**

### 2. Add to Environment Variables

#### Local Development (.env.local)

Create or update `/apps/cronguard/.env.local`:

```env
# hCaptcha Configuration
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-site-key-here
HCAPTCHA_SECRET_KEY=your-secret-key-here
```

**Note:** The `NEXT_PUBLIC_` prefix makes the site key available to the browser (required).

####  Netlify Configuration

1. Log into Netlify Dashboard
2. Go to: Site Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` = your-site-key
   - `HCAPTCHA_SECRET_KEY` = your-secret-key

4. Redeploy your site for changes to take effect

---

## Testing hCaptcha

### Development Mode

hCaptcha provides test keys that always pass:

```env
# Development test keys (always pass)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

### Production Mode

Use your real keys from hCaptcha dashboard.

---

## Verify Installation

1. Start your dev server:
   ```bash
   cd apps/cronguard
   pnpm dev
   ```

2. Visit: http://localhost:3000/signup

3. You should see the hCaptcha widget

4. Complete the captcha - the submit button should become enabled

---

## Troubleshooting

**Issue: "hCaptcha configuration error"**
- Solution: Check that `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is set

**Issue: Captcha not loading**
- Check browser console for errors
- Verify your domain is whitelisted in hCaptcha dashboard
- Check CSP headers aren't blocking hCaptcha domains

**Issue: Captcha fails on localhost**
- Make sure `localhost` is added to hCaptcha hostnames
- Use test keys for development

---

## Security Notes

- ✅ Site key is public (NEXT_PUBLIC_) - this is normal
- ✅ Secret key should NEVER be exposed to browser
- ✅ Free tier includes: 1M requests/month
- ✅ hCaptcha GDPR/CCPA compliant
- ✅ More privacy-focused than reCAPTCHA

---

## Cost

**hCaptcha Free Tier:**
- ✓ 1,000,000 requests per month
- ✓ Bot protection
- ✓ No credit card required
- ✓ Privacy-first (GDPR/CCPA compliant)

For your use case (auth forms only), you'll likely never exceed the free tier.
