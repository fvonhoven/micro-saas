# CronGuard Feature Roadmap

## Executive Summary

Based on competitive analysis of Cronitor, Healthchecks.io, Dead Man's Snitch, Uptime Robot, and Sentry, this roadmap outlines features to implement for competitive advantage.

### Current State

CronGuard has these unique advantages:

- ✅ Free public status pages (Cronitor charges $25/page)
- ✅ Free embeddable JavaScript widgets (no competitor has this)
- ✅ Free multi-monitor status pages (Pro tier)
- ✅ Free email subscriptions for status updates
- ✅ Free status badges (SVG)
- ✅ 25% annual discount (vs 20% industry standard)

### Gaps to Address

- ✅ ~~Only 2 free monitors~~ **Now 5 free monitors** (Healthchecks.io offers 20)
- ❌ No cron expression support
- ✅ ~~No start/fail signals~~ **Now supports /start and /fail endpoints with duration tracking**
- ❌ No ping via email
- ❌ No CLI tool or SDKs
- ❌ No 2FA/SSO
- ❌ Missing integrations (Telegram, MS Teams, PagerDuty, OpsGenie)

---

## Pricing Comparison

| Service           | Free Monitors | Cost for 100 Monitors |
| ----------------- | ------------- | --------------------- |
| Healthchecks.io   | 20            | $20/mo                |
| Dead Man's Snitch | 1             | $20/mo                |
| Uptime Robot      | 0             | $34/mo                |
| Sentry            | 1             | $77/mo                |
| Cronitor          | 5             | $200/mo               |
| **CronGuard**     | **5**         | **$99/mo**            |

---

## Phase 1: Quick Wins (Week 1-2)

### 1.1 Increase Free Tier to 5 Monitors

**Priority:** HIGH | **Effort:** LOW

Update the free tier from 2 monitors to 5 monitors to match Cronitor's free tier.

**Tasks:**

- [x] Update `packages/billing/src/plans.ts` - change free tier limit from 2 to 5
- [x] Update pricing page copy
- [x] Update CRONGUARD_OVERVIEW.md documentation

---

### 1.2 Telegram Integration

**Priority:** HIGH | **Effort:** LOW

Add Telegram as an alert channel. Popular with developer teams.

**Tasks:**

- [x] Create Telegram Bot via @BotFather
- [x] Add `telegram` alert channel type to schema
- [x] Create `/api/alerts/telegram/send` endpoint
- [x] Add Telegram configuration UI (requires chat_id)
- [x] Test integration

**API Example:**

```typescript
await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: chatId,
    text: `🚨 Monitor "${monitorName}" is DOWN`,
    parse_mode: "HTML",
  }),
})
```

---

### 1.3 Microsoft Teams Integration

**Priority:** HIGH | **Effort:** LOW

Add Microsoft Teams webhook integration for enterprise/corporate appeal.

**Tasks:**

- [x] Add `teams` alert channel type
- [x] Create `/api/alerts/teams/send` endpoint
- [x] Add Teams webhook URL configuration UI
- [x] Use Teams Incoming Webhook format (Adaptive Cards)

**API Example:**

```typescript
await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "FF0000",
    summary: `Monitor ${monitorName} is DOWN`,
    sections: [
      {
        activityTitle: `🚨 ${monitorName} Alert`,
        facts: [
          { name: "Status", value: "DOWN" },
          { name: "Time", value: new Date().toISOString() },
        ],
      },
    ],
  }),
})
```

---

### 1.4 PagerDuty Integration

**Priority:** HIGH | **Effort:** MEDIUM

DevOps teams consider PagerDuty essential. Healthchecks.io offers this FREE.

**Tasks:**

- [ ] Add `pagerduty` alert channel type
- [ ] Create `/api/alerts/pagerduty/send` endpoint
- [ ] Add PagerDuty Integration Key configuration UI
- [ ] Use PagerDuty Events API v2
- [ ] Support both trigger and resolve events

---

### 1.5 OpsGenie Integration

**Priority:** MEDIUM | **Effort:** MEDIUM

Similar to PagerDuty, popular with enterprise DevOps teams.

**Tasks:**

- [ ] Add `opsgenie` alert channel type
- [ ] Create `/api/alerts/opsgenie/send` endpoint
- [ ] Add OpsGenie API Key configuration UI
- [ ] Use OpsGenie Alert API

**API Example:**

```typescript
await fetch("https://api.opsgenie.com/v2/alerts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `GenieKey ${apiKey}`,
  },
  body: JSON.stringify({
    message: `Monitor "${monitorName}" is DOWN`,
    alias: `cronguard-${monitorId}`,
    priority: "P1",
    tags: ["cronguard", "cron-monitoring"],
  }),
})
```

---

## Phase 2: Core Feature Parity (Week 3-4)

### 2.1 Start/End Signals (Job Duration Tracking)

**Priority:** HIGH | **Effort:** MEDIUM

Allow jobs to signal when they start and end, enabling duration tracking and "running too long" alerts.

**New Ping Endpoints:**

- `POST /api/ping/{id}/start` - Job started
- `POST /api/ping/{id}` - Job completed (existing)
- `POST /api/ping/{id}/fail` - Job failed explicitly

**Tasks:**

- [x] Create `/api/ping/[id]/start/route.ts`
- [x] Create `/api/ping/[id]/fail/route.ts`
- [x] Update monitor status logic to handle 'running' state
- [x] Add duration tracking and display in dashboard
- [x] Add "max duration" setting to monitor configuration
- [x] Alert when job runs longer than max duration
- [x] Update status page to show "running" state

**Database Changes:**

```typescript
interface Monitor {
  // ... existing fields
  lastStartedAt?: Timestamp
  lastDuration?: number // milliseconds
  avgDuration?: number
  maxDuration?: number // alert if exceeded
  status: "up" | "down" | "running" | "failed"
}
```

---

### 2.2 Cron Expression Support

**Priority:** HIGH | **Effort:** MEDIUM

Parse cron expressions like `0 5 * * *` to calculate expected ping times.

**Tasks:**

- [ ] Install cron expression parser: `pnpm add cron-parser`
- [ ] Add `schedule` field to monitor schema (optional)
- [ ] Add schedule input UI with cron expression helper
- [ ] Calculate next expected ping time from cron expression
- [ ] Use expected time instead of interval for alerting
- [ ] Add cron expression validation
- [ ] Add timezone support

**Implementation:**

```typescript
import parser from "cron-parser"

function getNextExpectedPing(cronExpression: string, timezone: string): Date {
  const interval = parser.parseExpression(cronExpression, {
    currentDate: new Date(),
    tz: timezone,
  })
  return interval.next().toDate()
}
```

---

### 2.3 Two-Factor Authentication (2FA)

**Priority:** HIGH | **Effort:** MEDIUM

Add TOTP-based 2FA for security. Healthchecks.io has this, Cronitor doesn't.

**Tasks:**

- [ ] Install TOTP library: `pnpm add otplib qrcode`
- [ ] Add 2FA settings to user profile page
- [ ] Create `/api/auth/2fa/setup` - Generate secret and QR code
- [ ] Create `/api/auth/2fa/verify` - Verify TOTP code
- [ ] Create `/api/auth/2fa/disable` - Disable 2FA
- [ ] Add 2FA verification step to login flow
- [ ] Store encrypted 2FA secret in user document
- [ ] Add backup codes for account recovery

---

### 2.4 Ping via Email

**Priority:** MEDIUM | **Effort:** MEDIUM

Allow monitors to receive pings via email (useful for legacy systems).

**Tasks:**

- [ ] Set up email receiving (Resend Inbound or similar)
- [ ] Generate unique email address per monitor: `{monitorId}@ping.cronnarc.com`
- [ ] Create webhook endpoint to receive inbound emails
- [ ] Parse email and trigger ping for matching monitor
- [ ] Display ping email address in monitor settings

---

## Phase 3: Differentiation (Week 5-8)

### 3.1 CLI Tool

**Priority:** HIGH | **Effort:** MEDIUM

Create a CLI tool for easy integration from shell scripts.

**Package:** `cronguard-cli` (npm package)

**Commands:**

```bash
# Install
npm install -g cronguard-cli

# Configure
cronguard config --api-key YOUR_API_KEY

# Ping a monitor
cronguard ping backup-job

# Ping with start/end (wraps command)
cronguard run backup-job -- ./backup.sh

# List monitors
cronguard list

# Create monitor
cronguard create --name "Daily Backup" --interval 1440
```

**Tasks:**

- [ ] Create new package: `packages/cronguard-cli`
- [ ] Use Commander.js for CLI parsing
- [ ] Store API key in `~/.cronguard/config.json`
- [ ] Implement `ping`, `run`, `list`, `create` commands
- [ ] Add `run` wrapper that reports start/end/fail
- [ ] Publish to npm as `cronguard-cli`
- [ ] Add documentation

---

### 3.2 AI-Powered Anomaly Detection

**Priority:** HIGH | **Effort:** HIGH

**🌟 UNIQUE DIFFERENTIATOR** - No competitor has this!

Predict failures before they happen by analyzing patterns.

**Features:**

- Detect unusual ping timing patterns
- Predict likely failures based on historical data
- Alert on anomalies (job running slower than usual)
- Weekly insights email with predictions

**Tasks:**

- [ ] Track ping timing statistics (mean, stddev, percentiles)
- [ ] Flag pings that are >2 standard deviations from mean
- [ ] Add "Anomaly Detected" alert type
- [ ] Create anomaly dashboard widget
- [ ] Add weekly insights email
- [ ] Show trend indicators on dashboard

**Implementation:**

```typescript
function detectAnomaly(monitor: Monitor, currentInterval: number): boolean {
  const { avgPingInterval, stdDevPingInterval } = monitor.stats
  const zScore = Math.abs(currentInterval - avgPingInterval) / stdDevPingInterval
  return zScore > 2 // More than 2 standard deviations
}
```

---

### 3.3 Smart Alert Grouping

**Priority:** MEDIUM | **Effort:** MEDIUM

**🌟 UNIQUE DIFFERENTIATOR** - Reduce alert fatigue!

Group related failures and send a single alert.

**Features:**

- If multiple monitors fail within 5 minutes, group into one alert
- "3 monitors are down" instead of 3 separate alerts
- Configurable grouping window
- Show correlation (all failed monitors on same server?)

**Tasks:**

- [ ] Add alert grouping logic in scheduled function
- [ ] Create grouped alert email template
- [ ] Add grouping window setting (default: 5 minutes)
- [ ] Track alert groups in database
- [ ] Show grouped incidents in dashboard

---

### 3.4 Mobile PWA with Push Notifications

**Priority:** MEDIUM | **Effort:** MEDIUM

Dead Man's Snitch has a mobile app. CronGuard can have a PWA.

**Tasks:**

- [ ] Add PWA manifest (`manifest.json`)
- [ ] Add service worker for offline support
- [ ] Implement Web Push notifications
- [ ] Create mobile-optimized dashboard view
- [ ] Add "Add to Home Screen" prompt
- [ ] Store push subscription in user document
- [ ] Send push notifications for alerts

---

### 3.5 Maintenance Windows

**Priority:** MEDIUM | **Effort:** LOW

Suppress alerts during planned downtime.

**Tasks:**

- [ ] Add maintenance window scheduling UI
- [ ] Store maintenance windows in Firestore
- [ ] Skip alerting during maintenance windows
- [ ] Show "In Maintenance" status on status pages
- [ ] Support recurring maintenance windows
- [ ] Add maintenance window API

**Database:**

```typescript
interface MaintenanceWindow {
  id: string
  userId: string
  monitorIds: string[] // or ['all']
  startTime: Timestamp
  endTime: Timestamp
  recurring?: {
    frequency: "daily" | "weekly" | "monthly"
    dayOfWeek?: number // 0-6
    dayOfMonth?: number // 1-31
  }
  reason?: string
  createdAt: Timestamp
}
```

---

## Phase 4: Enterprise Features (Month 2-3)

### 4.1 SAML SSO

**Priority:** MEDIUM | **Effort:** HIGH

Enterprise IT requirement for larger customers.

**Tasks:**

- [ ] Integrate SAML library (passport-saml or @node-saml/node-saml)
- [ ] Add SSO configuration in team settings
- [ ] Support Okta, Azure AD, Google Workspace
- [ ] Map SAML attributes to user roles
- [ ] Add SSO-only login enforcement option
- [ ] Price as add-on ($5/user/month like Cronitor)

---

### 4.2 SLA Reporting

**Priority:** MEDIUM | **Effort:** MEDIUM

Calculate and display SLA percentages.

**Features:**

- Calculate uptime % for any time window
- Show SLA dashboard with trends
- Generate PDF reports
- Email weekly/monthly SLA reports
- Set SLA targets and alert on breach

**Tasks:**

- [ ] Create SLA calculation logic
- [ ] Add SLA dashboard page
- [ ] Create PDF report generation
- [ ] Add scheduled SLA report emails
- [ ] Add SLA target configuration
- [ ] Alert when SLA target breached

---

### 4.3 Dependency Mapping

**Priority:** LOW | **Effort:** HIGH

**🌟 UNIQUE DIFFERENTIATOR** - No competitor has this!

Define dependencies between monitors.

**Features:**

- "Job A depends on Job B"
- If Job B fails, suppress alerts for Job A
- Visualize dependency graph
- Root cause analysis

**Tasks:**

- [ ] Add dependency configuration UI
- [ ] Store dependencies in monitor document
- [ ] Update alerting logic to check dependencies
- [ ] Create dependency graph visualization
- [ ] Add root cause analysis view

---

### 4.4 Incident Post-Mortems

**Priority:** LOW | **Effort:** MEDIUM

Document and learn from incidents.

**Features:**

- Rich text editor for incident write-ups
- Timeline of events
- Root cause analysis template
- Action items tracking
- Public/private visibility

**Tasks:**

- [ ] Create post-mortem editor UI
- [ ] Store post-mortems in Firestore
- [ ] Link post-mortems to incidents
- [ ] Add action items with status tracking
- [ ] Add public post-mortem page option

---

### 4.5 Self-Hosted Option

**Priority:** LOW | **Effort:** HIGH

Healthchecks.io wins enterprise deals with this.

**Tasks:**

- [ ] Create Docker image
- [ ] Document self-hosting setup
- [ ] Support external database (PostgreSQL option)
- [ ] Create helm chart for Kubernetes
- [ ] Define licensing model (open core?)

---

## Implementation Timeline

### Week 1-2: Quick Wins

- [ ] 1.1 Increase free tier to 5 monitors
- [ ] 1.2 Telegram integration
- [ ] 1.3 Microsoft Teams integration
- [ ] 1.4 PagerDuty integration
- [ ] 1.5 OpsGenie integration

### Week 3-4: Core Parity

- [x] 2.1 Start/End signals (duration tracking)
- [ ] 2.2 Cron expression support
- [ ] 2.3 Two-factor authentication
- [ ] 2.4 Ping via email

### Week 5-8: Differentiation

- [ ] 3.1 CLI tool (npm package)
- [ ] 3.2 AI anomaly detection
- [ ] 3.3 Smart alert grouping
- [ ] 3.4 Mobile PWA
- [ ] 3.5 Maintenance windows

### Month 2-3: Enterprise

- [ ] 4.1 SAML SSO
- [ ] 4.2 SLA reporting
- [ ] 4.3 Dependency mapping
- [ ] 4.4 Incident post-mortems
- [ ] 4.5 Self-hosted option

---

## Success Metrics

After implementing these features, track:

| Metric                    | Target | How to Measure                |
| ------------------------- | ------ | ----------------------------- |
| Free tier conversion rate | +20%   | Stripe dashboard              |
| Enterprise inquiries      | +50%   | Contact form submissions      |
| Churn rate                | -30%   | Stripe subscription analytics |
| NPS score                 | >50    | User surveys                  |
| Competitive win rate      | Track  | Sales conversations           |

---

## Competitive Positioning After Implementation

After Phase 1-3, CronGuard will be positioned as:

> "The modern cron monitoring platform with AI-powered insights, beautiful status pages, and enterprise-ready features - at half the price of Cronitor."

### Unique Value Props

1. ✅ Free status pages (Cronitor charges $25/page)
2. ✅ Free embeddable widgets (no one else has this)
3. ✅ AI anomaly detection (no one else has this)
4. ✅ Smart alert grouping (no one else has this)
5. ✅ CLI tool for easy integration
6. ✅ 25% annual discount
7. ✅ Simple, transparent pricing

---

## Appendix: Alert Channel Comparison

| Channel   | CronGuard Now | After Phase 1 | Cronitor | Healthchecks.io |
| --------- | ------------- | ------------- | -------- | --------------- |
| Email     | ✅            | ✅            | ✅       | ✅              |
| Slack     | ✅            | ✅            | ✅       | ✅              |
| Discord   | ✅            | ✅            | ✅       | ✅              |
| Webhooks  | ✅            | ✅            | ✅       | ✅              |
| Telegram  | ❌            | ✅            | ✅       | ✅              |
| MS Teams  | ❌            | ✅            | ✅       | ✅              |
| PagerDuty | ❌            | ✅            | Paid     | ✅ Free         |
| OpsGenie  | ❌            | ✅            | Paid     | ✅ Free         |
| SMS       | ❌            | Future        | Paid     | Paid            |
| Phone     | ❌            | Future        | ❌       | Paid            |

---

**Last Updated:** February 2026
**Status:** Ready for Implementation
