# Waitlist Mode - CronGuard

## Overview

Signup has been temporarily disabled and replaced with a waitlist system to capture interested users before launch.

---

## What Changed

### 1. Signup Page (`/signup`)
- **Before**: Full signup form with Firebase authentication
- **After**: Simple waitlist form that captures name and email
- **Features**:
  - Clean, modern design matching the brand
  - Success message after joining
  - Link back to login for existing users
  - Duplicate email detection

### 2. API Endpoint (`/api/waitlist`)
- **New endpoint**: `POST /api/waitlist`
- **Validation**: Email and name validation with Zod
- **Storage**: Firestore collection `waitlist`
- **Features**:
  - Prevents duplicate emails
  - Stores: email, name, createdAt, notified flag

### 3. Homepage Updates
- Changed "Get Started Free" button to "Join Waitlist"
- Added subtitle: "🚀 Coming soon! Join the waitlist to be notified when we launch."

### 4. Other Pages Updated
- **Login page**: "Sign up" link → "Join the waitlist"
- **Forgot password page**: "Sign up" link → "Join the waitlist"
- **Pricing page**: "Get Started" button → "Join Waitlist"

---

## Database Schema

### Firestore Collection: `waitlist`

```typescript
{
  email: string          // Lowercase email address
  name: string           // User's name
  createdAt: Timestamp   // When they joined
  notified: boolean      // Whether they've been notified of launch
}
```

### Firestore Index Required

```
waitlist: email ASC
```

---

## How to View Waitlist Entries

### Using Firebase Console
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open the `waitlist` collection
4. View all entries with email, name, and timestamp

### Using Firebase CLI
```bash
# Export waitlist to JSON
firebase firestore:export --collection-ids waitlist
```

### Using a Script
Create a script to export waitlist emails:

```javascript
// scripts/export-waitlist.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportWaitlist() {
  const snapshot = await db.collection('waitlist')
    .orderBy('createdAt', 'desc')
    .get();
  
  const emails = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    emails.push({
      email: data.email,
      name: data.name,
      joinedAt: data.createdAt.toDate().toISOString()
    });
  });
  
  console.log(JSON.stringify(emails, null, 2));
}

exportWaitlist();
```

---

## How to Re-Enable Signup

When you're ready to launch and re-enable signup:

### Option 1: Restore from Git
```bash
# Find the commit before waitlist mode
git log --oneline apps/cronguard/app/(auth)/signup/page.tsx

# Restore the original signup page
git checkout <commit-hash> apps/cronguard/app/(auth)/signup/page.tsx
```

### Option 2: Manual Changes

1. **Restore signup page** (`apps/cronguard/app/(auth)/signup/page.tsx`)
   - Replace waitlist form with original signup form
   - Re-add Firebase authentication
   - Re-add hCaptcha
   - Re-add terms checkbox

2. **Update homepage** (`apps/cronguard/app/page.tsx`)
   - Change "Join Waitlist" → "Get Started Free"
   - Remove waitlist subtitle

3. **Update other pages**:
   - Login page: "Join the waitlist" → "Sign up"
   - Forgot password: "Join the waitlist" → "Sign up"
   - Pricing page: "Join Waitlist" → "Get Started"

4. **Remove waitlist API** (optional)
   - Delete `apps/cronguard/app/api/waitlist/route.ts`
   - Or keep it for future use

---

## Notifying Waitlist Users

When you're ready to launch, notify all waitlist users:

### Email Template

```
Subject: CronNarc is Live! 🚀

Hi [Name],

Great news! CronNarc is now live and ready for you to use.

You're receiving this email because you joined our waitlist. We're excited to have you as one of our first users!

🎉 Get Started: https://cronnarc.com/signup

What you can do with CronNarc:
✅ Monitor unlimited cron jobs (free tier: 2 monitors)
✅ Get instant alerts via email, Slack, or Discord
✅ Create public status pages for your services
✅ Track 90-day uptime history
✅ Embed status widgets on your website

Ready to never miss a cron job failure again?

[Get Started Now] → https://cronnarc.com/signup

Thanks for your patience!
The CronNarc Team

---
Unsubscribe | Privacy Policy | Terms of Service
```

### Bulk Email Script

```javascript
// scripts/notify-waitlist.js
const admin = require('firebase-admin');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const db = admin.firestore();

async function notifyWaitlist() {
  const snapshot = await db.collection('waitlist')
    .where('notified', '==', false)
    .get();
  
  for (const doc of snapshot.docs) {
    const { email, name } = doc.data();
    
    await resend.emails.send({
      from: 'CronNarc <noreply@cronnarc.com>',
      to: email,
      subject: 'CronNarc is Live! 🚀',
      html: `<p>Hi ${name},</p><p>Great news! CronNarc is now live...</p>`
    });
    
    // Mark as notified
    await doc.ref.update({ notified: true });
    
    console.log(`Notified: ${email}`);
  }
}

notifyWaitlist();
```

---

## Testing

### Test the Waitlist Form
1. Visit http://localhost:3000/signup
2. Enter name and email
3. Submit form
4. Verify success message appears
5. Check Firestore for new entry

### Test Duplicate Prevention
1. Submit the same email twice
2. Verify error message: "This email is already on the waitlist"

### Test Navigation
1. Homepage → "Join Waitlist" button → Waitlist page ✅
2. Login page → "Join the waitlist" link → Waitlist page ✅
3. Forgot password → "Join the waitlist" link → Waitlist page ✅

---

## Files Modified

- `apps/cronguard/app/(auth)/signup/page.tsx` - Replaced with waitlist form
- `apps/cronguard/app/page.tsx` - Updated CTA button text
- `apps/cronguard/app/(auth)/login/page.tsx` - Updated signup link
- `apps/cronguard/app/(auth)/forgot-password/page.tsx` - Updated signup link
- `apps/cronguard/app/(dashboard)/pricing/page.tsx` - Updated button text

## Files Created

- `apps/cronguard/app/api/waitlist/route.ts` - Waitlist API endpoint
- `apps/cronguard/WAITLIST_MODE.md` - This documentation

---

**Status**: ✅ Waitlist mode active  
**Build**: ✅ Passing  
**Ready to deploy**: ✅ Yes

