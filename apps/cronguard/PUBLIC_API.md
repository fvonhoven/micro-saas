# CronGuard Public API Documentation

CronGuard provides public APIs for accessing monitor status information and embeddable badges. These endpoints are **public** and do not require authentication, but only work for monitors with **status pages enabled**.

---

## 📊 Status API

### Get Monitor Status

Retrieve real-time status, uptime analytics, and incident history for a monitor.

**Endpoint:** `GET /api/status/{slug}`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor

**Response:**

```json
{
  "monitor": {
    "name": "Production Backup Job",
    "status": "HEALTHY",
    "lastPingAt": "2026-01-24T10:30:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "statusPageTitle": "Backup Service Status",
    "statusPageDescription": "Real-time status of our nightly backup service"
  },
  "analytics": {
    "uptime": {
      "last30d": {
        "uptime": 99.95,
        "downtime": 21600000
      },
      "last90d": {
        "uptime": 99.87,
        "downtime": 112320000
      }
    },
    "incidents": {
      "recent": [
        {
          "id": "abc123",
          "startedAt": "2026-01-20T03:00:00.000Z",
          "resolvedAt": "2026-01-20T09:00:00.000Z",
          "duration": 21600000
        }
      ]
    }
  }
}
```

![Monitor Status](http://localhost:3000/api/badge/feedvine-rss-fetch-1768922436574)
**Status Values:**

- `HEALTHY` - Monitor received ping within expected interval
- `LATE` - Monitor is overdue but within grace period
- `DOWN` - Monitor exceeded grace period (alert sent)
- `PAUSED` - Monitor temporarily disabled
- `PENDING` - Monitor created but never received a ping

**Example Usage:**

```bash
# cURL
curl https://yourapp.com/api/status/production-backup-1234567890

# JavaScript
const response = await fetch('https://yourapp.com/api/status/production-backup-1234567890');
const data = await response.json();
console.log(`Status: ${data.monitor.status}`);
console.log(`30-day uptime: ${data.analytics.uptime.last30d.uptime}%`);
```

**CORS:** This endpoint supports CORS and can be called from any origin.

**Caching:** Responses are cached for 60 seconds.

---

## 📛 Badge API

### Status Badge

Generate a dynamic SVG badge showing the current monitor status.

**Endpoint:** `GET /api/badge/{slug}`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor
- `style` (query parameter, optional) - Badge style: `flat` (default) or `flat-square`

**Example:**

```markdown
![Monitor Status](https://yourapp.com/api/badge/production-backup-1234567890)
```

**Badge Colors:**

- 🟢 **Green** - HEALTHY
- 🟡 **Yellow** - LATE
- 🔴 **Red** - DOWN
- ⚫ **Gray** - PAUSED
- 🔵 **Blue** - PENDING

**Styles:**

```markdown
# Flat (default)

![Status](https://yourapp.com/api/badge/your-slug)

# Flat Square

![Status](https://yourapp.com/api/badge/your-slug?style=flat-square)
```

---

### Uptime Badge

Generate a dynamic SVG badge showing uptime percentage.

**Endpoint:** `GET /api/badge/{slug}/uptime`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor
- `period` (query parameter, optional) - Time period: `30d` (default) or `90d`
- `style` (query parameter, optional) - Badge style: `flat` (default) or `flat-square`

**Example:**

```markdown
![Uptime](https://yourapp.com/api/badge/production-backup-1234567890/uptime?period=30d)
```

**Badge Colors:**

- 🟢 **Green** - ≥99.9% uptime
- 🟡 **Yellow** - 99.0-99.9% uptime
- 🟠 **Orange** - 95.0-99.0% uptime
- 🔴 **Red** - <95.0% uptime

**Examples:**

```markdown
# 30-day uptime (default)

![Uptime](https://yourapp.com/api/badge/your-slug/uptime)

# 90-day uptime

![Uptime](https://yourapp.com/api/badge/your-slug/uptime?period=90d)
```

---

## � Uptime History API

### Get Daily Uptime History

Retrieve daily uptime percentages for the last 90 days.

**Endpoint:** `GET /api/status/{slug}/history`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor

**Response:**

```json
{
  "dailyUptime": [
    {
      "date": "2025-10-26",
      "uptime": 100.0
    },
    {
      "date": "2025-10-27",
      "uptime": 99.85
    },
    {
      "date": "2025-10-28",
      "uptime": 100.0
    }
    // ... 90 days of data
  ]
}
```

**Example Usage:**

```javascript
// Fetch uptime history
const response = await fetch("https://yourapp.com/api/status/production-backup-1234567890/history")
const data = await response.json()

// Create a simple chart
data.dailyUptime.forEach(day => {
  console.log(`${day.date}: ${day.uptime.toFixed(2)}% uptime`)
})
```

**CORS:** This endpoint supports CORS and can be called from any origin.

**Caching:** Responses are cached for 5 minutes.

---

## 🔌 Embeddable Widget

### JavaScript Widget

Embed a live status widget on your website with a single script tag.

**Endpoint:** `GET /api/widget/{slug}`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor

**Example:**

```html
<!-- Add this script tag anywhere on your page -->
<script src="https://yourapp.com/api/widget/production-backup-1234567890"></script>
```

**Features:**

- ✅ Self-contained (no dependencies)
- ✅ Auto-refreshes every 60 seconds
- ✅ Shows current status with color-coded indicator
- ✅ Displays 30-day uptime percentage
- ✅ Responsive and mobile-friendly
- ✅ Works across all modern browsers

**Widget Display:**

```
┌─────────────────────────────────┐
│ 🟢 Production Backup Job        │
│ Status: Healthy                 │
│ 30-day uptime: 99.95%           │
└─────────────────────────────────┘
```

---

## 📧 Email Subscriptions

### Subscribe to Status Updates

Allow visitors to subscribe to email notifications when your monitor goes down or recovers.

**Endpoint:** `POST /api/subscriptions/{slug}`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "Successfully subscribed to status updates"
}
```

**Example Usage:**

```javascript
// Subscribe to updates
const response = await fetch("https://yourapp.com/api/subscriptions/production-backup-1234567890", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" }),
})

const data = await response.json()
console.log(data.message)
```

### Unsubscribe from Updates

**Endpoint:** `DELETE /api/subscriptions/{slug}?token={unsubscribeToken}`

**Parameters:**

- `slug` (path parameter) - The unique slug identifier for your monitor
- `token` (query parameter) - Unique unsubscribe token (included in notification emails)

**Email Notifications:**

- 🚨 **Monitor Down** - Sent when monitor goes DOWN
- ✅ **Monitor Recovery** - Sent when monitor recovers
- 🔗 **Unsubscribe Link** - Included in every email

**CORS:** These endpoints support CORS and can be called from any origin.

---

## �🔧 Usage Examples

### README Badge

Add status badges to your GitHub README:

```markdown
# My Project

![Monitor Status](https://yourapp.com/api/badge/my-monitor-slug)
![30-Day Uptime](https://yourapp.com/api/badge/my-monitor-slug/uptime?period=30d)

## Status

Check our [live status page](https://yourapp.com/status/my-monitor-slug) for real-time updates.
```

### HTML Embed

Embed badges in HTML:

```html
<img src="https://yourapp.com/api/badge/my-monitor-slug" alt="Monitor Status" />
<img src="https://yourapp.com/api/badge/my-monitor-slug/uptime?period=30d" alt="Uptime" />
```

### JavaScript Integration

Fetch status data programmatically:

```javascript
async function checkMonitorStatus() {
  const response = await fetch("https://yourapp.com/api/status/my-monitor-slug")
  const data = await response.json()

  if (data.monitor.status === "DOWN") {
    console.error("Monitor is down!")
    // Send alert, update UI, etc.
  }

  return data
}
```

---

## 🔒 Privacy & Security

- **Public Access:** These endpoints are public and do not require authentication
- **Opt-in:** Badges and status API only work for monitors with **status pages enabled**
- **No Sensitive Data:** Only public status information is exposed (no ping URLs, user data, etc.)
- **Rate Limiting:** Endpoints are cached and rate-limited to prevent abuse

---

## 📝 Notes

- Badges are cached for 60 seconds (status) and 5 minutes (uptime)
- Uptime calculations exclude time before monitor creation
- Incident durations are in milliseconds
- All timestamps are in ISO 8601 format (UTC)
