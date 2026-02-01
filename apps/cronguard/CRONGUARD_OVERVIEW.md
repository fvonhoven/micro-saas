# CronGuard (CronNarc) - Project Overview

> **Tagline**: Never miss a cron job failure again  
> **Description**: Get instant alerts when your scheduled tasks don't check in. Simple, reliable, and powerful monitoring.  
> **Production URL**: https://cronnarc.com  
> **Status**: ✅ Production Ready

---

## 📋 Table of Contents

- [Product Overview](#product-overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Services & Integrations](#services--integrations)
- [Architecture](#architecture)
- [Pricing Plans](#pricing-plans)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## 🎯 Product Overview

**CronGuard** is a SaaS application that monitors cron jobs and scheduled tasks by providing unique ping URLs. When a job completes successfully, it pings the URL. If a job fails to ping within the expected interval, CronGuard sends alerts via multiple channels.

### Key Value Propositions

- ✅ **Dead simple setup** - Just ping a URL from your cron job
- ✅ **Multiple alert channels** - Email, Slack, Discord, webhooks
- ✅ **Public status pages** - Share uptime with customers
- ✅ **Team collaboration** - Invite team members to manage monitors
- ✅ **Rich analytics** - 90-day uptime history and incident tracking

---

## 🚀 Core Features

### Phase 1: Core Monitoring ✅

- [x] **Unique ping URLs** for each monitor
- [x] **Configurable check intervals** (1-60 minutes)
- [x] **Grace periods** (1-60 minutes)
- [x] **Email alerts** on failures
- [x] **Incident tracking** with automatic resolution
- [x] **Monitor status** (HEALTHY, LATE, DOWN, PAUSED, PENDING)
- [x] **Netlify scheduled function** for health checks (runs every minute)

### Phase 2: Advanced Alerts ✅

- [x] **Slack integration** with webhook alerts
- [x] **Discord integration** with webhook alerts
- [x] **Custom webhooks** with JSON payloads
- [x] **Multiple alert channels** per monitor
- [x] **Alert channel management** (add/remove/test)

### Phase 3: Public Status Pages ✅

- [x] **Individual monitor status pages** (`/status/[slug]`)
- [x] **Custom titles and descriptions** for status pages
- [x] **Real-time status display** with color-coded indicators
- [x] **Uptime analytics** (30-day and 90-day)
- [x] **Incident history** with duration tracking
- [x] **Public/private toggle** for status pages

### Phase 4: Embeddable Widgets ✅

- [x] **Status badges** (SVG, real-time)
- [x] **Uptime badges** (30-day percentage)
- [x] **Embeddable JavaScript widget** (works on any website)
- [x] **Email subscriptions** for status updates
- [x] **Subscriber notifications** on incidents
- [x] **90-day uptime chart** (visual bar chart)

### Phase 5: Multi-Monitor Status Pages ✅

- [x] **Status groups** - Combine multiple monitors
- [x] **Overall system status** (operational, degraded, partial outage, major outage)
- [x] **Group status pages** (`/status-group/[slug]`)
- [x] **Auto-refresh** every 30 seconds
- [x] **Team support** for status groups

### Phase 6: Team Collaboration ✅

- [x] **Team creation** and management
- [x] **Team invitations** via email
- [x] **Role-based access** (owner, admin, member)
- [x] **Team monitors** - Shared across team members
- [x] **Team billing** - Separate from personal plans
- [x] **Team settings** page

### Phase 7: Billing & Monetization ✅

- [x] **Stripe integration** with checkout sessions
- [x] **4 pricing tiers** (Free, Starter, Pro, Team)
- [x] **Monthly and annual billing** (25% discount on annual)
- [x] **Usage limits** by plan (monitors, check intervals)
- [x] **Upgrade/downgrade flows** with prorated billing
- [x] **Customer portal** for subscription management
- [x] **Webhook handling** for subscription events

---

## 🛠️ Tech Stack

### Frontend

| Technology       | Purpose                             |
| ---------------- | ----------------------------------- |
| **Next.js 14**   | React framework with App Router     |
| **TypeScript**   | Type-safe development (strict mode) |
| **Tailwind CSS** | Utility-first styling               |
| **shadcn/ui**    | Component library                   |
| **React Hooks**  | State management                    |

### Backend

| Technology             | Purpose                         |
| ---------------------- | ------------------------------- |
| **Next.js API Routes** | RESTful API endpoints           |
| **Netlify Functions**  | Serverless scheduled functions  |
| **Zod**                | Schema validation               |
| **Firebase Admin SDK** | Server-side Firebase operations |

### Database & Auth

| Technology             | Purpose                       |
| ---------------------- | ----------------------------- |
| **Firebase Firestore** | NoSQL database                |
| **Firebase Auth**      | User authentication           |
| **Session Cookies**    | Server-side auth verification |

### External Services

| Service               | Purpose                        |
| --------------------- | ------------------------------ |
| **Stripe**            | Payment processing             |
| **Resend**            | Transactional emails           |
| **Netlify**           | Hosting & serverless functions |
| **Microsoft Clarity** | Analytics & session replay     |

---

## 🔌 Services & Integrations

### Firebase

- **Project ID**: `micro-saas-713e2`
- **Services Used**:
  - Firestore (database)
  - Authentication (email/password)
  - Session cookies (server-side auth)

### Stripe

- **Mode**: Test mode (ready for production)
- **Products**:
  - Starter: $15/mo or $11/mo annual
  - Pro: $39/mo or $29/mo annual
  - Team: $99/mo or $74/mo annual
- **Webhook Events**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### Resend

- **Purpose**: Transactional emails
- **Email Types**:
  - Alert notifications (monitor down/late)
  - Team invitations
  - Subscriber notifications (incident updates)
- **From Address**: Configured via `NEXT_PUBLIC_APP_URL`

### Netlify

- **Hosting**: Static site + serverless functions
- **Scheduled Function**: `/netlify/functions/check-monitors.ts`
  - Runs every 1 minute
  - Checks all active monitors
  - Creates incidents for late/down monitors
  - Sends alerts via configured channels

### Microsoft Clarity

- **Project ID**: `uze1z6a6ci`
- **Purpose**: User behavior analytics and session replay

### hCaptcha

- **Site Key**: `d73edc56-2ce2-4392-aff4-8ec0999abbe8`
- **Purpose**: Bot protection (configured but using test key)

---

## 🏗️ Architecture

### Application Structure

```
apps/cronguard/
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── pricing/         # Pricing page
│   │   ├── profile/         # User profile
│   │   └── team/            # Team management
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication
│   │   ├── monitors/        # Monitor CRUD
│   │   ├── status/          # Public status API
│   │   ├── status-groups/   # Status group API
│   │   ├── badge/           # Badge generation
│   │   ├── widget/          # Widget JavaScript
│   │   ├── subscriptions/   # Email subscriptions
│   │   ├── billing/         # Stripe integration
│   │   ├── teams/           # Team management
│   │   └── webhooks/        # Stripe webhooks
│   ├── status/[slug]/       # Public status pages
│   ├── status-group/[slug]/ # Multi-monitor status pages
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── MonitorCard.tsx
│   ├── StatusBadge.tsx
│   ├── UptimeChart.tsx
│   └── ...
├── lib/                     # Utility functions
│   └── notify-subscribers.ts
├── netlify/
│   └── functions/
│       └── check-monitors.ts # Scheduled health checks
└── public/                  # Static assets
```

### Data Flow

**Monitor Creation Flow**:

1. User creates monitor via dashboard
2. API validates input with Zod
3. Firestore creates monitor document
4. Unique slug generated for ping URL
5. User receives ping URL: `https://cronnarc.com/api/ping/[slug]`

**Health Check Flow** (runs every minute):

1. Netlify function fetches all active monitors
2. For each monitor, check if `lastPingAt + interval + gracePeriod < now`
3. If late/down, create incident in Firestore
4. Send alerts via all configured channels (email, Slack, Discord, webhooks)
5. Update monitor status

**Ping Flow**:

1. Cron job hits `GET /api/ping/[slug]`
2. API finds monitor by slug
3. Updates `lastPingAt` timestamp
4. If monitor was DOWN/LATE, resolves incident
5. Updates status to HEALTHY
6. Returns 200 OK

**Status Page Flow**:

1. User visits `/status/[slug]`
2. API fetches monitor data (public fields only)
3. Calculates 30-day and 90-day uptime
4. Fetches recent incidents
5. Renders status page with real-time data
6. Auto-refreshes every 30 seconds

---

## 💰 Pricing Plans

| Plan        | Price (Monthly) | Price (Annual)   | Monitors | Check Interval | Features                                                                   |
| ----------- | --------------- | ---------------- | -------- | -------------- | -------------------------------------------------------------------------- |
| **Free**    | $0              | $0               | 2        | 5 min          | Email alerts, status pages, badges, widgets, subscriptions, 90-day history |
| **Starter** | $15             | $11/mo ($132/yr) | 5        | 5 min          | + Slack, Discord, webhooks                                                 |
| **Pro**     | $39             | $29/mo ($348/yr) | 25       | 1 min          | + Multi-monitor status pages                                               |
| **Team**    | $99             | $74/mo ($888/yr) | 100      | 1 min          | + Team collaboration                                                       |

### Plan Limits

- **Free**: 5 monitors, 5-minute intervals
- **Starter**: 5 monitors, 5-minute intervals
- **Pro**: 25 monitors, 1-minute intervals, multi-monitor status pages
- **Team**: 100 monitors, 1-minute intervals, multi-monitor status pages, team features

---

## 🔗 API Endpoints

### Public APIs (CORS enabled)

#### Ping API

```
GET /api/ping/[slug]
```

- Updates monitor's last ping timestamp
- Resolves incidents if monitor was down
- Returns 200 OK

#### Status API

```
GET /api/status/[slug]
```

- Returns monitor status, uptime, and incidents
- Public data only (no sensitive info)
- Cached for 30 seconds

#### Status History API

```
GET /api/status/[slug]/history?days=90
```

- Returns daily uptime data for charts
- Supports 30, 60, or 90 days

#### Badge API

```
GET /api/badge/[slug]
GET /api/badge/[slug]/uptime
```

- Returns SVG badges
- Real-time status or 30-day uptime percentage

#### Widget API

```
GET /api/widget/[slug]
```

- Returns embeddable JavaScript
- Self-contained widget with styles
- Auto-refreshes every 60 seconds

#### Status Group API

```
GET /api/status-group/[slug]
```

- Returns multi-monitor status page data
- Overall system status calculation

#### Email Subscription API

```
POST /api/subscriptions/[slug]
DELETE /api/subscriptions/[slug]
```

- Subscribe/unsubscribe to monitor updates
- Email notifications on incidents

### Protected APIs (requires authentication)

#### Monitors

```
GET    /api/monitors              # List user's monitors
POST   /api/monitors              # Create monitor
GET    /api/monitors/[id]         # Get monitor details
PATCH  /api/monitors/[id]         # Update monitor
DELETE /api/monitors/[id]         # Delete monitor
GET    /api/monitors/[id]/analytics # Get uptime analytics
GET    /api/monitors/usage        # Check usage limits
```

#### Alert Channels

```
GET    /api/monitors/[id]/channels           # List channels
POST   /api/monitors/[id]/channels           # Add channel
DELETE /api/monitors/[id]/channels/[channelId] # Remove channel
```

#### Status Groups

```
GET    /api/status-groups         # List status groups
POST   /api/status-groups         # Create status group
GET    /api/status-groups/[id]    # Get status group
PATCH  /api/status-groups/[id]    # Update status group
DELETE /api/status-groups/[id]    # Delete status group
```

#### Teams

```
GET    /api/teams                 # List user's teams
POST   /api/teams                 # Create team
GET    /api/teams/[id]            # Get team details
PATCH  /api/teams/[id]            # Update team
DELETE /api/teams/[id]            # Delete team
GET    /api/teams/[id]/members    # List team members
DELETE /api/teams/[id]/members/[userId] # Remove member
POST   /api/teams/[id]/invites    # Send invitation
DELETE /api/teams/[id]/invites/[inviteId] # Cancel invitation
```

#### Billing

```
POST /api/billing/create-checkout-session  # Start Stripe checkout
POST /api/billing/create-portal-session    # Open customer portal
POST /api/billing/preview-upgrade          # Preview upgrade cost
POST /api/billing/check-downgrade          # Check downgrade eligibility
POST /api/billing/downgrade                # Downgrade plan
```

#### User

```
GET    /api/user/plan             # Get current plan
DELETE /api/user/delete           # Delete account
```

---

## 🗄️ Database Schema

### Firestore Collections

#### `monitors`

```typescript
{
  id: string                    // Auto-generated
  userId: string                // Owner's Firebase UID
  teamId?: string               // Optional team ID
  name: string                  // Monitor name
  slug: string                  // Unique slug for URLs
  interval: number              // Check interval (minutes)
  gracePeriod: number           // Grace period (minutes)
  status: "HEALTHY" | "LATE" | "DOWN" | "PAUSED" | "PENDING"
  lastPingAt: Timestamp | null  // Last successful ping
  createdAt: Timestamp
  statusPageEnabled: boolean    // Public status page toggle
  statusPageTitle?: string      // Custom title for status page
  statusPageDescription?: string // Custom description
}
```

#### `monitors/{id}/incidents`

```typescript
{
  id: string // Auto-generated
  startedAt: Timestamp // When incident started
  resolvedAt: Timestamp | null // When incident resolved (null if ongoing)
  status: "LATE" | "DOWN" // Incident severity
}
```

#### `monitors/{id}/channels`

```typescript
{
  id: string                    // Auto-generated
  type: "email" | "slack" | "discord" | "webhook"
  config: {
    // For email:
    email?: string
    // For Slack/Discord:
    webhookUrl?: string
    // For custom webhook:
    url?: string
    method?: "GET" | "POST"
    headers?: Record<string, string>
  }
  createdAt: Timestamp
}
```

#### `monitors/{id}/subscribers`

```typescript
{
  id: string // Auto-generated (email hash)
  email: string // Subscriber email
  subscribedAt: Timestamp
}
```

#### `status_groups`

```typescript
{
  id: string                    // Auto-generated
  userId: string                // Owner's Firebase UID
  teamId?: string               // Optional team ID
  name: string                  // Group name
  slug: string                  // Unique slug for URLs
  description?: string          // Optional description
  monitorIds: string[]          // Array of monitor IDs
  customTitle?: string          // Custom title for status page
  customDescription?: string    // Custom description
  enabled: boolean              // Enable/disable status page
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `teams`

```typescript
{
  id: string                    // Auto-generated
  name: string                  // Team name
  ownerId: string               // Owner's Firebase UID
  createdAt: Timestamp
  stripeCustomerId?: string     // Stripe customer ID
  stripePriceId?: string        // Current subscription price ID
  stripeSubscriptionId?: string // Current subscription ID
  plan: "free" | "starter" | "pro" | "team"
  billingCycle: "monthly" | "annual"
}
```

#### `team_members`

```typescript
{
  id: string // Auto-generated
  teamId: string // Team ID
  userId: string // Member's Firebase UID
  role: "owner" | "admin" | "member"
  joinedAt: Timestamp
}
```

#### `team_invites`

```typescript
{
  id: string // Auto-generated
  teamId: string // Team ID
  email: string // Invitee email
  role: "admin" | "member"
  token: string // Unique invite token
  expiresAt: Timestamp // Expiration date
  createdAt: Timestamp
}
```

#### `users`

```typescript
{
  id: string                    // Firebase UID
  email: string
  createdAt: Timestamp
  stripeCustomerId?: string     // Stripe customer ID
  stripePriceId?: string        // Current subscription price ID
  stripeSubscriptionId?: string // Current subscription ID
  plan: "free" | "starter" | "pro" | "team"
  billingCycle: "monthly" | "annual"
}
```

### Firestore Indexes

Required composite indexes:

```
monitors: userId ASC, createdAt DESC
monitors: teamId ASC, createdAt DESC
monitors: slug ASC
monitors/{id}/incidents: startedAt DESC
status_groups: userId ASC, createdAt DESC
status_groups: teamId ASC, createdAt DESC
status_groups: slug ASC
team_members: teamId ASC, userId ASC
team_invites: token ASC
```

---

## 🔐 Environment Variables

### Required Variables

```bash
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_CRONGUARD_STARTER_MONTHLY_PRICE_ID=
STRIPE_CRONGUARD_STARTER_ANNUAL_PRICE_ID=
STRIPE_CRONGUARD_PRO_MONTHLY_PRICE_ID=
STRIPE_CRONGUARD_PRO_ANNUAL_PRICE_ID=
STRIPE_CRONGUARD_TEAM_MONTHLY_PRICE_ID=
STRIPE_CRONGUARD_TEAM_ANNUAL_PRICE_ID=

# Resend
RESEND_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=https://cronnarc.com

# Analytics
NEXT_PUBLIC_CLARITY_PROJECT_ID=

# Optional: Bot Protection
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=

# Optional: Rate Limiting
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
```

---

## 🚀 Deployment

### Netlify Configuration

**Build Settings**:

- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `netlify/functions`

**Environment Variables**:

- Add all variables from `.env.local` to Netlify dashboard

**Scheduled Functions**:

- Function: `check-monitors`
- Schedule: `*/1 * * * *` (every minute)
- Timeout: 60 seconds

### Deployment Checklist

- [ ] Set up Firebase project
- [ ] Configure Firestore indexes
- [ ] Create Stripe products and prices
- [ ] Set up Resend domain and API key
- [ ] Configure environment variables in Netlify
- [ ] Deploy to Netlify
- [ ] Test scheduled function execution
- [ ] Verify Stripe webhook endpoint
- [ ] Test all alert channels
- [ ] Test public status pages
- [ ] Test embeddable widgets

---

## 📊 Key Metrics to Track

### Product Metrics

- Total monitors created
- Active monitors (by plan)
- Incidents created/resolved
- Alert delivery success rate
- Status page views
- Widget embeds
- Email subscribers

### Business Metrics

- MRR (Monthly Recurring Revenue)
- Churn rate
- Conversion rate (free → paid)
- Average revenue per user (ARPU)
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

### Technical Metrics

- Scheduled function execution time
- API response times
- Firestore read/write operations
- Email delivery rate
- Uptime (monitor the monitor!)

---

## 🎯 Competitive Advantages

1. **Multi-monitor status pages** - Most competitors don't offer this
2. **Embeddable widgets** - Easy integration into customer sites
3. **Email subscriptions** - Let customers subscribe to updates
4. **90-day uptime history** - Longer than most competitors
5. **Team collaboration** - Built-in from the start
6. **Multiple alert channels** - Email, Slack, Discord, webhooks
7. **Generous free tier** - 5 monitors with full features

---

## 📝 Future Enhancements (Not Implemented)

### Phase 8: SLA Reporting (Optional)

- [ ] Monthly/quarterly SLA reports
- [ ] Uptime percentage by monitor
- [ ] Incident summary with MTTR
- [ ] Downloadable PDF reports
- [ ] Email delivery on schedule
- [ ] Custom SLA targets

### Phase 9: Incident Post-Mortems (Optional)

- [ ] Rich text editor for incident write-ups
- [ ] Timeline of events
- [ ] Root cause analysis
- [ ] Impact assessment
- [ ] Action items and follow-ups
- [ ] Public/private visibility toggle

### Other Ideas

- [ ] API monitoring (ping HTTP endpoints)
- [ ] Scheduled maintenance windows
- [ ] Status page themes/customization
- [ ] Mobile app (iOS/Android)
- [ ] Integrations (PagerDuty, Opsgenie, etc.)
- [ ] Advanced analytics dashboard
- [ ] Custom domains for status pages

---

## 🐛 Known Issues / Tech Debt

- None currently - production ready! ✅

---

## 📚 Resources

- **Production URL**: https://cronnarc.com
- **Repository**: (private)
- **Documentation**: `PUBLIC_API.md`
- **Launch Checklist**: `LAUNCH_CHECKLIST.md`

---

**Last Updated**: January 24, 2026
**Status**: ✅ Production Ready - Ready to Launch!

- Returns multi-monitor status page data
- Overall system status calculation

#### Email Subscription API

```
POST /api/subscriptions/[slug]
DELETE /api/subscriptions/[slug]
```

- Subscribe/unsubscribe to monitor updates
- Email notifications on incidents
