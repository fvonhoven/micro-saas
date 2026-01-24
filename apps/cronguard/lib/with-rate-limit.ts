import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "./rate-limiter-ip"

type RateLimitEndpoint = "auth:login" | "auth:signup" | "auth:forgot-password" | "api:general"

/**
 * Rate limit middleware wrapper for API routes
 * 
 * Usage:
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await withRateLimit(req, "auth:login")
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response
 *   }
 *   
 *   // Your handler logic here
 * }
 * ```
 */
export async function withRateLimit(
  req: NextRequest,
  endpoint: RateLimitEndpoint
): Promise<{ allowed: boolean; response?: NextResponse; ip: string }> {
  const ip = getClientIp(req.headers)

  const { allowed, retryAfter, remainingAttempts } = await checkRateLimit(ip, endpoint)

  if (!allowed) {
    const response = NextResponse.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Please try again later.`,
        retryAfter,
      },
      { status: 429 }
    )

    // Add rate limit headers
    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString())
      response.headers.set("X-RateLimit-Reset", new Date(Date.now() + retryAfter * 1000).toISOString())
    }
    response.headers.set("X-RateLimit-Limit", "See API documentation")

    return { allowed: false, response, ip }
  }

  // Add rate limit info headers to successful requests
  if (remainingAttempts !== undefined) {
    // Note: Can't modify the request, but you can add headers to the response later
  }

  return { allowed: true, ip }
}

/**
 * Create rate-limited API handler
 * 
 * Higher-order function that wraps your handler with rate limiting
 * 
 * Usage:
 * ```ts
 * export const POST = createRateLimitedHandler(
 *   "auth:login",
 *   async (req: NextRequest, ip: string) => {
 *     // Your handler logic here
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function createRateLimitedHandler(
  endpoint: RateLimitEndpoint,
  handler: (req: NextRequest, ip: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await withRateLimit(req, endpoint)

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    try {
      return await handler(req, rateLimitResult.ip)
    } catch (error) {
      console.error(`[API] Error in rate-limited handler:`, error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}
