import type { Context } from "@netlify/edge-functions"

// Simple in-memory rate limiting for public status pages
// More lenient than ping endpoint since users may refresh frequently
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60 // 60 requests per minute per IP (1 per second)

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export default async (request: Request, context: Context) => {
  // Get client IP address
  const ip = request.headers.get("x-nf-client-connection-ip") || 
             request.headers.get("x-forwarded-for") || 
             "unknown"

  // Rate limit key: IP address
  // This prevents a single IP from hammering the status pages
  const rateLimitKey = `status:${ip}`
  const now = Date.now()

  // Get or create rate limit entry
  let entry = rateLimitMap.get(rateLimitKey)

  if (!entry || now > entry.resetAt) {
    // Create new window
    entry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    }
    rateLimitMap.set(rateLimitKey, entry)
  } else {
    // Increment count in current window
    entry.count++

    // Check if rate limit exceeded
    if (entry.count > MAX_REQUESTS_PER_WINDOW) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": entry.resetAt.toString(),
          },
        },
      )
    }
  }

  // Add rate limit headers to successful responses
  const remaining = MAX_REQUESTS_PER_WINDOW - entry.count
  
  // Pass through to Next.js with rate limit info
  const response = await context.next()
  
  // Add rate limit headers to the response
  response.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString())
  response.headers.set("X-RateLimit-Remaining", Math.max(0, remaining).toString())
  response.headers.set("X-RateLimit-Reset", entry.resetAt.toString())
  
  return response
}

