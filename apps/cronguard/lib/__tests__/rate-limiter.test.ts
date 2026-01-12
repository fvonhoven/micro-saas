import { describe, it, expect, beforeEach, vi } from "vitest"
import { RateLimiter, getClientIp } from "../rate-limiter"

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    // Create a new rate limiter for each test
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    })
  })

  describe("check()", () => {
    it("should allow requests under the limit", () => {
      const identifier = "user-123"

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check(identifier)).toBe(true)
      }
    })

    it("should block requests over the limit", () => {
      const identifier = "user-123"

      // First 5 requests allowed
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(identifier)
      }

      // 6th request should be blocked
      expect(rateLimiter.check(identifier)).toBe(false)
      expect(rateLimiter.check(identifier)).toBe(false)
    })

    it("should track different identifiers separately", () => {
      const user1 = "user-1"
      const user2 = "user-2"

      // User 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check(user1)).toBe(true)
      }

      // User 1 is blocked
      expect(rateLimiter.check(user1)).toBe(false)

      // User 2 should still be allowed
      expect(rateLimiter.check(user2)).toBe(true)
    })

    it("should reset after time window expires", () => {
      const identifier = "user-123"
      vi.useFakeTimers()

      // Use up all requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(identifier)
      }

      // Should be blocked
      expect(rateLimiter.check(identifier)).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61000) // 61 seconds

      // Should be allowed again
      expect(rateLimiter.check(identifier)).toBe(true)

      vi.useRealTimers()
    })
  })

  describe("getRemaining()", () => {
    it("should return max requests for new identifier", () => {
      expect(rateLimiter.getRemaining("new-user")).toBe(5)
    })

    it("should return correct remaining count", () => {
      const identifier = "user-123"

      expect(rateLimiter.getRemaining(identifier)).toBe(5)

      rateLimiter.check(identifier)
      expect(rateLimiter.getRemaining(identifier)).toBe(4)

      rateLimiter.check(identifier)
      expect(rateLimiter.getRemaining(identifier)).toBe(3)
    })

    it("should return 0 when limit is reached", () => {
      const identifier = "user-123"

      for (let i = 0; i < 5; i++) {
        rateLimiter.check(identifier)
      }

      expect(rateLimiter.getRemaining(identifier)).toBe(0)
    })
  })

  describe("getResetTime()", () => {
    it("should return null for new identifier", () => {
      expect(rateLimiter.getResetTime("new-user")).toBeNull()
    })

    it("should return reset time after first request", () => {
      const identifier = "user-123"
      const before = Date.now()

      rateLimiter.check(identifier)

      const resetTime = rateLimiter.getResetTime(identifier)
      expect(resetTime).toBeGreaterThan(before)
      expect(resetTime).toBeLessThanOrEqual(before + 60000)
    })
  })

  describe("reset()", () => {
    it("should reset rate limit for identifier", () => {
      const identifier = "user-123"

      // Use up all requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(identifier)
      }

      // Should be blocked
      expect(rateLimiter.check(identifier)).toBe(false)

      // Reset
      rateLimiter.reset(identifier)

      // Should be allowed again
      expect(rateLimiter.check(identifier)).toBe(true)
    })
  })
})

describe("getClientIp()", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      },
    })

    expect(getClientIp(req)).toBe("192.168.1.1")
  })

  it("should extract IP from x-real-ip header", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-real-ip": "192.168.1.1",
      },
    })

    expect(getClientIp(req)).toBe("192.168.1.1")
  })

  it("should extract IP from cf-connecting-ip header", () => {
    const req = new Request("http://localhost", {
      headers: {
        "cf-connecting-ip": "192.168.1.1",
      },
    })

    expect(getClientIp(req)).toBe("192.168.1.1")
  })

  it("should return 'unknown' if no IP headers present", () => {
    const req = new Request("http://localhost")

    expect(getClientIp(req)).toBe("unknown")
  })
})

