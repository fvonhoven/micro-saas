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

## 🔧 Usage Examples

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
<img src="https://yourapp.com/api/badge/my-monitor-slug" alt="Monitor Status">
<img src="https://yourapp.com/api/badge/my-monitor-slug/uptime?period=30d" alt="Uptime">
```

### JavaScript Integration

Fetch status data programmatically:

```javascript
async function checkMonitorStatus() {
  const response = await fetch('https://yourapp.com/api/status/my-monitor-slug');
  const data = await response.json();
  
  if (data.monitor.status === 'DOWN') {
    console.error('Monitor is down!');
    // Send alert, update UI, etc.
  }
  
  return data;
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

