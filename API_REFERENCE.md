# API Reference

Complete API documentation for all three micro-SaaS products.

## CronGuard API

### Ping Endpoint

**Endpoint:** `GET/POST /api/ping/[slug]`

**Description:** Health check endpoint for cron jobs

**Authentication:** None (public endpoint)

**Example:**
```bash
curl https://cronguard.app/api/ping/abc123xyz
```

**Response:**
```json
{
  "success": true,
  "nextExpectedAt": "2024-01-15T10:30:00Z"
}
```

### Monitors API

**List Monitors:** `GET /api/monitors`

**Create Monitor:** `POST /api/monitors`

**Authentication:** Session cookie (logged in user)

**Request Body:**
```json
{
  "name": "Daily Backup Job",
  "expectedInterval": 86400,
  "gracePeriod": 300
}
```

**Response:**
```json
{
  "monitor": {
    "id": "monitor123",
    "slug": "abc123xyz",
    "name": "Daily Backup Job",
    "pingUrl": "https://cronguard.app/api/ping/abc123xyz"
  }
}
```

---

## FormVault API

### Forms API

**List Forms:** `GET /api/forms`

**Create Form:** `POST /api/forms`

**Authentication:** Session cookie

**Request Body:**
```json
{
  "name": "Client Documents",
  "description": "Upload your tax documents",
  "maxFileSize": 10485760
}
```

### Access Links API

**Create Access Link:** `POST /api/access-links`

**Request Body:**
```json
{
  "formId": "form123",
  "clientEmail": "client@example.com",
  "expiresInDays": 7,
  "maxUses": 1
}
```

**Response:**
```json
{
  "accessLink": {
    "token": "abc123...",
    "uploadUrl": "https://formvault.app/submit/abc123..."
  }
}
```

### Validate Token

**Endpoint:** `GET /api/validate-token/[token]`

**Authentication:** None (public)

**Response:**
```json
{
  "valid": true,
  "form": {
    "name": "Client Documents",
    "description": "Upload your tax documents"
  }
}
```

### Upload URL

**Endpoint:** `POST /api/upload-url`

**Request Body:**
```json
{
  "token": "abc123...",
  "filename": "document.pdf",
  "contentType": "application/pdf"
}
```

**Response:**
```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "fileId": "file123"
}
```

### Create Submission

**Endpoint:** `POST /api/submissions`

**Request Body:**
```json
{
  "token": "abc123...",
  "files": [
    {
      "id": "file123",
      "name": "document.pdf",
      "size": 1024000,
      "url": "https://storage.googleapis.com/..."
    }
  ]
}
```

---

## SnipShot API

### Screenshot API

**Endpoint:** `GET /api/screenshot?url=https://example.com`

**Authentication:** API Key via `X-API-Key` header

**Rate Limit:** 60 requests per minute

**Example:**
```bash
curl -H "X-API-Key: ss_abc123..." \
  "https://snipshot.app/api/screenshot?url=https://example.com"
```

**Response:**
```json
{
  "url": "https://storage.googleapis.com/bucket/screenshots/hash.png",
  "cached": false
}
```

**Error Responses:**

```json
// Missing API key
{
  "error": "Missing API key"
}

// Invalid API key
{
  "error": "Invalid API key"
}

// Rate limited
{
  "error": "Rate limited"
}

// Invalid URL
{
  "error": "Invalid URL"
}
```

### API Keys Management

**List Keys:** `GET /api/keys`

**Create Key:** `POST /api/keys`

**Delete Key:** `DELETE /api/keys?id=key123`

**Authentication:** Session cookie

**Create Request:**
```json
{
  "name": "Production API"
}
```

**Create Response:**
```json
{
  "key": {
    "id": "key123",
    "name": "Production API",
    "key": "ss_abc123...",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Note:** The full API key is only shown once during creation.

---

## Stripe Webhooks

All apps handle Stripe webhooks at `/api/webhooks/stripe`

**Events Handled:**
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

**Authentication:** Stripe signature verification

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## Rate Limits

| App | Endpoint | Limit |
|-----|----------|-------|
| CronGuard | /api/ping/* | None (public) |
| FormVault | /api/upload-url | 10/min per token |
| SnipShot | /api/screenshot | 60/min per API key |

