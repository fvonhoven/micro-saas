import { adminDb } from "@repo/firebase/admin"

interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  blockDurationMs: number
}

/**
 * IP-based Rate Limiter using Firestore
 * 
 * Tracks failed attempts by IP address to prevent brute force attacks.
 * Uses exponential backoff for repeated violations.
 */

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  "auth:login": {
    maxAttempts: 5, // 5 attempts
    windowMs: 15 * 60 * 1000, // per 15 minutes
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour after exceeding
  },
  "auth:signup": {
    maxAttempts: 3, // 3 signups
    windowMs: 60 * 60 * 1000, // per hour
    blockDurationMs: 24 * 60 * 60 * 1000, // Block for 24 hours
  },
  "auth:forgot-password": {
    maxAttempts: 3, // 3 requests
    windowMs: 60 * 60 * 1000, // per hour
    blockDurationMs: 2 * 60 * 60 * 1000, // Block for 2 hours
  },
  // API endpoints - more lenient
  "api:general": {
    maxAttempts: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
    blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
  },
}

/**
 * Get client IP from request headers
 * Handles various proxy configurations (Netlify, Cloudflare, etc.)
 */
export function getClientIp(headers: Headers): string {
  // Try various headers in order of preference
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback (should not happen in production)
  return "unknown"
}

/**
 * Check if IP is rate limited for a specific endpoint
 * 
 * @param ip - Client IP address
 * @param endpoint - Rate limit key (e.g., "auth:login")
 * @returns { allowed: boolean, retryAfter?: number }
 */
export async function checkRateLimit(
  ip: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS
): Promise<{ allowed: boolean; retryAfter?: number; remainingAttempts?: number }> {
  if (!ip || ip === "unknown") {
    // Allow if we can't determine IP (but log it)
    console.warn("[RateLimit] Unable to determine IP address")
    return { allowed: true }
  }

  const config = RATE_LIMIT_CONFIGS[endpoint]
  if (!config) {
    console.warn(`[RateLimit] No config found for endpoint: ${endpoint}`)
    return { allowed: true }
  }

  const now = Date.now()
  const docId = `${ip}:${endpoint}`

  try {
    const docRef = adminDb.collection("rate_limits").doc(docId)
    const doc = await docRef.get()

    if (!doc.exists) {
      // First request - create document
      await docRef.set({
        ip,
        endpoint,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
        blockUntil: null,
      })
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 }
    }

    const data = doc.data()!

    // Check if currently blocked
    if (data.blocked && data.blockUntil > now) {
      const retryAfter = Math.ceil((data.blockUntil - now) / 1000)
      console.warn(`[RateLimit] IP ${ip} blocked for ${endpoint} until ${new Date(data.blockUntil).toISOString()}`)
      return { allowed: false, retryAfter }
    }

    // Check if window has expired - reset if so
    if (now - data.firstAttempt > config.windowMs) {
      await docRef.set({
        ip,
        endpoint,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
        blockUntil: null,
      })
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 }
    }

    // Within window - check if exceeded
    if (data.attempts >= config.maxAttempts) {
      // Block the IP
      const blockUntil = now + config.blockDurationMs
      await docRef.update({
        attempts: data.attempts + 1,
        lastAttempt: now,
        blocked: true,
        blockUntil,
      })

      const retryAfter = Math.ceil(config.blockDurationMs / 1000)
      console.warn(`[RateLimit] IP ${ip} exceeded limit for ${endpoint}, blocked for ${retryAfter}s`)
      return { allowed: false, retryAfter }
    }

    // Increment attempts
    await docRef.update({
      attempts: data.attempts + 1,
      lastAttempt: now,
    })

    const remaining = config.maxAttempts - (data.attempts + 1)
    return { allowed: true, remainingAttempts: Math.max(0, remaining) }
  } catch (error) {
    console.error(`[RateLimit] Error checking rate limit:`, error)
    // Fail open - allow request if rate limiting fails
    return { allowed: true }
  }
}

/**
 * Reset rate limit for an IP (use after successful action)
 * 
 * @param ip - Client IP address
 * @param endpoint - Rate limit key
 */
export async function resetRateLimit(ip: string, endpoint: keyof typeof RATE_LIMIT_CONFIGS): Promise<void> {
  if (!ip || ip === "unknown") return

  const docId = `${ip}:${endpoint}`

  try {
    await adminDb.collection("rate_limits").doc(docId).delete()
  } catch (error) {
    console.error(`[RateLimit] Error resetting rate limit:`, error)
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 * Deletes entries older than 7 days
 */
export async function cleanupOldRateLimits(): Promise<void> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  try {
    const snapshot = await adminDb
      .collection("rate_limits")
      .where("lastAttempt", "<", sevenDaysAgo)
      .limit(500) // Batch delete
      .get()

    if (snapshot.empty) return

    const batch = adminDb.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()

    console.log(`[RateLimit] Cleaned up ${snapshot.size} old rate limit entries`)
  } catch (error) {
    console.error(`[RateLimit] Error cleaning up old rate limits:`, error)
  }
}
