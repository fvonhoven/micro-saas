# CronNarc Launch Checklist

## ✅ Completed Features

### Core Functionality
- [x] Cron job monitoring with configurable intervals (1 min - 7 days)
- [x] Monitor status tracking (HEALTHY, LATE, DOWN, PAUSED, PENDING)
- [x] Ping endpoint for cron jobs to check in
- [x] Automated downtime detection
- [x] Incident tracking and history
- [x] Monitor analytics and uptime calculations

### Monetization
- [x] Stripe integration for payments
- [x] 4 pricing tiers (Free, Starter, Pro, Team)
- [x] Checkout flow with monthly/annual billing
- [x] Billing portal for subscription management
- [x] Monitor limit enforcement
- [x] Upgrade/downgrade flows with proration
- [x] Failed payment handling with grace periods
- [x] Usage warnings and upgrade prompts

### Alert Channels
- [x] Email alerts
- [x] Slack webhooks
- [x] Discord webhooks
- [x] Custom webhooks
- [x] Multiple alert channels per monitor
- [x] Recovery notifications

### Status Pages & Public Features
- [x] Individual monitor status pages (`/status/{slug}`)
- [x] Multi-monitor status groups (`/status-group/{slug}`)
- [x] Overall system status calculation
- [x] Status badges (SVG)
- [x] Uptime badges (30d/90d)
- [x] Embeddable JavaScript widgets
- [x] Email subscriptions for status updates
- [x] 90-day uptime history charts
- [x] Public API documentation

### Team Collaboration
- [x] Team creation and management
- [x] Team invitations via email
- [x] Role-based permissions (Owner, Admin, Member, Viewer)
- [x] Team workspace selector
- [x] Team-owned monitors
- [x] Team billing

### Security & Abuse Prevention
- [x] Email verification requirement
- [x] Rate limiting on API endpoints
- [x] Monitor creation throttling
- [x] IP-based abuse detection
- [x] Session-based authentication

### User Experience
- [x] Dashboard with search and filters
- [x] Bulk actions (pause/resume, delete)
- [x] Monitor detail pages with analytics
- [x] Responsive mobile design
- [x] Loading and empty states
- [x] Account deletion

---

## 🔍 Pre-Launch Testing Checklist

### Authentication & Onboarding
- [ ] Sign up flow works correctly
- [ ] Email verification is sent and works
- [ ] Login/logout works
- [ ] Password reset works
- [ ] Profile updates work

### Monitor Management
- [ ] Create monitor (personal)
- [ ] Create monitor (team)
- [ ] Edit monitor settings
- [ ] Pause/resume monitor
- [ ] Delete monitor
- [ ] Bulk actions work
- [ ] Search and filters work

### Monitoring & Alerts
- [ ] Ping endpoint receives check-ins
- [ ] Monitor goes LATE when overdue
- [ ] Monitor goes DOWN after grace period
- [ ] Email alerts are sent
- [ ] Slack alerts work (if configured)
- [ ] Discord alerts work (if configured)
- [ ] Webhook alerts work (if configured)
- [ ] Recovery notifications are sent

### Status Pages
- [ ] Individual status page displays correctly
- [ ] Status page updates when monitor changes
- [ ] Status badges render correctly
- [ ] Uptime badges show correct percentages
- [ ] Widget embeds work on external sites
- [ ] Email subscriptions work
- [ ] Subscription emails are sent
- [ ] Multi-monitor status groups work
- [ ] Overall system status calculates correctly

### Billing
- [ ] Free plan limits enforced (2 monitors)
- [ ] Upgrade to Starter works
- [ ] Upgrade to Pro works
- [ ] Upgrade to Team works
- [ ] Downgrade flow works
- [ ] Billing portal accessible
- [ ] Failed payment handling works
- [ ] Grace period system works

### Team Features
- [ ] Create team
- [ ] Invite team members
- [ ] Accept team invitation
- [ ] Switch between personal/team workspaces
- [ ] Team permissions enforced correctly
- [ ] Team billing works

---

## 📋 Deployment Checklist

### Environment Variables
- [ ] All production environment variables set in Netlify
- [ ] Stripe production keys configured
- [ ] Resend API key configured
- [ ] Firebase production credentials set
- [ ] Clarity analytics ID set (optional)

### Firestore Setup
- [ ] Production Firestore database created
- [ ] Required indexes created:
  - [ ] `monitors`: userId (ASC) + createdAt (DESC)
  - [ ] `monitors`: status (ASC) + nextExpectedAt (ASC) ⚡ CRITICAL
  - [ ] `monitors`: teamId (ASC) + createdAt (DESC)
  - [ ] `status_groups`: userId (ASC) + createdAt (DESC)
  - [ ] `status_groups`: teamId (ASC) + createdAt (DESC)
- [ ] Security rules deployed

### Stripe Setup
- [ ] Products created in Stripe
- [ ] Price IDs added to environment variables
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to environment variables
- [ ] Test mode disabled

### Netlify Functions
- [ ] `check-monitors` scheduled function deployed (runs every 1 minute)
- [ ] Function timeout set appropriately (10 seconds recommended)
- [ ] Function logs monitored

### DNS & Domain
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] DNS records propagated

---

## 🚀 Launch Day Tasks

1. [ ] Final production build test
2. [ ] Deploy to production
3. [ ] Verify all scheduled functions running
4. [ ] Create test monitor and verify alerts
5. [ ] Test complete signup → monitor → alert flow
6. [ ] Monitor error logs for first few hours
7. [ ] Announce launch (if applicable)

---

## 📊 Post-Launch Monitoring

### Week 1
- [ ] Monitor error rates daily
- [ ] Check Stripe dashboard for payments
- [ ] Review user signups and conversions
- [ ] Monitor scheduled function execution
- [ ] Check email delivery rates

### Ongoing
- [ ] Weekly review of error logs
- [ ] Monthly review of user feedback
- [ ] Monitor Firestore usage and costs
- [ ] Review Stripe metrics
- [ ] Track feature usage

