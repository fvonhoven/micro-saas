import type { Context } from "@netlify/edge-functions"

// Simple in-memory rate limiting
// Note: This resets when the edge function cold-starts, but that's acceptable for basic protection
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10 // 10 pings per minute per monitor

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
  // Extract monitor slug from URL
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const slug = pathParts[pathParts.length - 1]

  if (!slug) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Rate limit key: monitor slug
  const rateLimitKey = `ping:${slug}`
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
          message: `Too many pings for this monitor. Maximum ${MAX_REQUESTS_PER_WINDOW} pings per minute allowed.`,
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

  // Rate limit not exceeded - pass through to Next.js API route
  return context.next()
}

