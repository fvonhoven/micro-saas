/**
 * Simple in-memory rate limiter for API endpoints
 * 
 * Usage:
 * const limiter = new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 })
 * const isAllowed = limiter.check(userId)
 */

interface RateLimiterOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the window
}

interface RequestLog {
  count: number
  resetTime: number
}

export class RateLimiter {
  private requests: Map<string, RequestLog>
  private windowMs: number
  private maxRequests: number

  constructor(options: RateLimiterOptions) {
    this.requests = new Map()
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Check if a request is allowed for the given identifier
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(identifier: string): boolean {
    const now = Date.now()
    const requestLog = this.requests.get(identifier)

    // If no previous requests or window has expired, allow and reset
    if (!requestLog || now > requestLog.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    // If within window and under limit, increment and allow
    if (requestLog.count < this.maxRequests) {
      requestLog.count++
      return true
    }

    // Rate limit exceeded
    return false
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now()
    const requestLog = this.requests.get(identifier)

    if (!requestLog || now > requestLog.resetTime) {
      return this.maxRequests
    }

    return Math.max(0, this.maxRequests - requestLog.count)
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number | null {
    const requestLog = this.requests.get(identifier)
    return requestLog?.resetTime || null
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    for (const [identifier, log] of this.requests.entries()) {
      if (now > log.resetTime) {
        this.requests.delete(identifier)
      }
    }
  }

  /**
   * Reset rate limit for an identifier (useful for testing)
   */
  reset(identifier: string) {
    this.requests.delete(identifier)
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 auth attempts per 15 minutes
})

export const monitorCreationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 monitor creations per hour (will be further restricted for free tier)
})

/**
 * Helper function to get client IP address from request
 */
export function getClientIp(req: Request): string {
  // Check various headers for IP address
  const forwarded = req.headers.get("x-forwarded-for")
  const realIp = req.headers.get("x-real-ip")
  const cfConnectingIp = req.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return "unknown"
}

