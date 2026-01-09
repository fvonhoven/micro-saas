# Rate Limiting for CronNarc

## Overview

CronNarc uses **Netlify Edge Functions** for rate limiting public endpoints. This provides:

- ✅ **Zero external dependencies** (no Redis, no database)
- ✅ **Runs at the edge** (before hitting Next.js API routes)
- ✅ **Low latency** (Deno runtime on Netlify's global CDN)
- ✅ **Automatic scaling** (handled by Netlify)
- ✅ **Simple configuration** (just edit a TypeScript file)

## Protected Endpoints

### 1. Ping Endpoint (`/api/ping/*`)

- **Limit:** 10 pings per minute per monitor
- **Key:** Monitor slug
- **Purpose:** Prevent abuse of the ping endpoint

### 2. Status Pages (`/status/*` and `/api/status/*`)

- **Limit:** 60 requests per minute per IP
- **Key:** Client IP address
- **Purpose:** Prevent scraping and DDoS attacks on public status pages

## How It Works

### Architecture

```
Cron Job → Netlify Edge (rate-limit-ping.ts) → Next.js API (/api/ping/[slug])
                    ↓
              Rate limit check
                    ↓
         429 if exceeded, or pass through
```

### Rate Limit Configuration

**Ping Endpoint:**

- **Limit:** 10 pings per minute per monitor
- **Window:** 1 minute sliding window
- **Location:** `netlify/edge-functions/rate-limit-ping.ts`

**Status Pages:**

- **Limit:** 60 requests per minute per IP
- **Window:** 1 minute sliding window
- **Location:** `netlify/edge-functions/rate-limit-status.ts`

### How Rate Limiting Works

1. **Request arrives** at `/api/ping/[slug]`
2. **Edge function intercepts** the request
3. **Extracts monitor slug** from URL
4. **Checks rate limit** for that specific monitor
5. **Returns 429** if limit exceeded, or **passes through** to Next.js

### Rate Limit Storage

- Uses **in-memory Map** in the Edge Function
- Resets on cold starts (acceptable for basic protection)
- Automatic cleanup every 5 minutes to prevent memory leaks

## Configuration

### Adjusting Rate Limits

#### Ping Endpoint

Edit `netlify/edge-functions/rate-limit-ping.ts`:

```typescript
// Change these values:
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute (in milliseconds)
const MAX_REQUESTS_PER_WINDOW = 10 // 10 pings per minute
```

**Examples:**

**More restrictive (5 pings per minute):**

```typescript
const MAX_REQUESTS_PER_WINDOW = 5
```

**Less restrictive (30 pings per minute):**

```typescript
const MAX_REQUESTS_PER_WINDOW = 30
```

**Longer window (5 minutes):**

```typescript
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 50 // 50 pings per 5 minutes
```

#### Status Pages

Edit `netlify/edge-functions/rate-limit-status.ts`:

```typescript
// Change these values:
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60 // 60 requests per minute (1 per second)
```

**Examples:**

**More restrictive (30 requests per minute):**

```typescript
const MAX_REQUESTS_PER_WINDOW = 30
```

**Less restrictive (120 requests per minute):**

```typescript
const MAX_REQUESTS_PER_WINDOW = 120
```

### Response Headers

When rate limited, the response includes helpful headers:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 45
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704729600000
```

**Response Body:**

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many pings for this monitor. Maximum 10 pings per minute allowed.",
  "retryAfter": 45
}
```

## Testing Rate Limiting

### Local Testing

Edge Functions don't run locally with `next dev`. To test:

1. **Deploy to Netlify** (even a preview deploy)
2. **Use Netlify CLI:**
   ```bash
   netlify dev
   ```

### Production Testing

```bash
# Ping a monitor 11 times in quick succession
for i in {1..11}; do
  echo "Ping $i:"
  curl -X POST https://cronnarc.com/api/ping/YOUR_MONITOR_SLUG
  echo ""
done
```

**Expected result:**

- First 10 requests: `200 OK`
- 11th request: `429 Too Many Requests`

## Monitoring

### Netlify Dashboard

View Edge Function logs:

1. Go to Netlify Dashboard
2. Select your site
3. Navigate to **Functions** → **Edge Functions**
4. Click on `rate-limit-ping`
5. View logs and invocation count

### Metrics to Watch

- **Invocation count** - How many pings are being processed
- **429 responses** - How many are being rate limited
- **Execution time** - Should be <10ms

## Why Edge Functions vs. Alternatives?

### ✅ Netlify Edge Functions (Current Implementation)

**Pros:**

- No external dependencies
- No additional cost
- Runs at the edge (low latency)
- Simple to configure
- Automatic scaling

**Cons:**

- In-memory storage (resets on cold starts)
- Less precise than Redis-backed solutions
- Can't share state across edge locations

### ❌ Upstash Redis

**Pros:**

- Persistent storage
- More precise rate limiting
- Shared state globally

**Cons:**

- External dependency
- Additional cost (~$10/month)
- Requires environment variables
- More complex setup

### ❌ Cloudflare

**Pros:**

- Very robust
- DDoS protection
- Global CDN

**Cons:**

- Requires DNS change
- Another service to manage
- Rate limiting rules can be complex

## Recommendations

### For Most Users (Current Setup)

The **Netlify Edge Function** approach is perfect for:

- Small to medium deployments
- Preventing accidental abuse
- Simple configuration
- Zero additional cost

### For High-Volume Users

If you expect **>1000 monitors** or need more precise rate limiting:

- Consider **Upstash Redis** for persistent, global rate limiting
- Or use **Cloudflare** for enterprise-grade protection

## Troubleshooting

### Edge Function Not Working

1. **Check deployment:**

   ```bash
   netlify functions:list
   ```

2. **Check logs:**
   - Netlify Dashboard → Functions → Edge Functions → rate-limit-ping

3. **Verify configuration:**
   - `netlify.toml` should have `[[edge_functions]]` section
   - `netlify/edge-functions/rate-limit-ping.ts` should exist

### Rate Limits Too Strict

If legitimate cron jobs are being blocked:

1. **Increase the limit:**

   ```typescript
   const MAX_REQUESTS_PER_WINDOW = 20 // or higher
   ```

2. **Increase the window:**

   ```typescript
   const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000 // 2 minutes
   ```

3. **Redeploy:**
   ```bash
   netlify deploy --prod
   ```

### Rate Limits Too Lenient

If you're seeing abuse:

1. **Decrease the limit:**

   ```typescript
   const MAX_REQUESTS_PER_WINDOW = 5
   ```

2. **Add IP-based rate limiting** (advanced):
   ```typescript
   const ip = request.headers.get("x-nf-client-connection-ip")
   const rateLimitKey = `ping:${slug}:${ip}`
   ```

## Future Enhancements

Potential improvements:

1. **Per-plan rate limits** - Different limits for Free/Starter/Pro/Team
2. **IP-based rate limiting** - Prevent abuse from single IP
3. **Persistent storage** - Use Netlify Blobs or KV for state
4. **Analytics** - Track rate limit hits in dashboard
5. **Allowlist** - Bypass rate limits for trusted IPs
