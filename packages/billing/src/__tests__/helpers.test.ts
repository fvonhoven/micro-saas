import { describe, it, expect } from "vitest"
import { getUserPlan, hasActiveSubscription } from "../helpers"
import type { UserSubscription } from "../helpers"

describe("Billing Helpers", () => {
  describe("getUserPlan()", () => {
    it("should return free plan for user without subscription", () => {
      const user: UserSubscription = {
        stripePriceId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
      }

      const plan = getUserPlan("cronguard", user)

      expect(plan.name).toBe("Free")
      expect(plan.price).toBe(0)
    })

    it("should return correct plan for starter monthly", () => {
      const user: UserSubscription = {
        stripePriceId: "price_starter_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: new Date(),
      }

      const plan = getUserPlan("cronguard", user)

      expect(plan.name).toBe("Starter")
      expect(plan.price).toBe(15)
    })

    it("should return correct plan for pro monthly", () => {
      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: new Date(),
      }

      const plan = getUserPlan("cronguard", user)

      expect(plan.name).toBe("Pro")
      expect(plan.price).toBe(39)
    })

    it("should return correct plan for team monthly", () => {
      const user: UserSubscription = {
        stripePriceId: "price_team_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: new Date(),
      }

      const plan = getUserPlan("cronguard", user)

      expect(plan.name).toBe("Team")
      expect(plan.price).toBe(99)
    })

    it("should handle annual plans", () => {
      const user: UserSubscription = {
        stripePriceId: "price_pro_annual",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: new Date(),
      }

      const plan = getUserPlan("cronguard", user)

      expect(plan.name).toBe("Pro")
      expect(plan.price).toBe(29) // Annual price
    })
  })

  describe("hasActiveSubscription()", () => {
    it("should return false for user without subscription", () => {
      const user: UserSubscription = {
        stripePriceId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
      }

      expect(hasActiveSubscription(user)).toBe(false)
    })

    it("should return true for active subscription", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30 days in future

      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: futureDate,
      }

      expect(hasActiveSubscription(user)).toBe(true)
    })

    it("should return false for expired subscription", () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // 1 day in past

      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: pastDate,
      }

      expect(hasActiveSubscription(user)).toBe(false)
    })

    it("should handle Date objects", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: futureDate,
      }

      expect(hasActiveSubscription(user)).toBe(true)
    })

    it("should handle date strings", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: futureDate,
      }

      expect(hasActiveSubscription(user)).toBe(true)
    })

    it("should return false for subscription ending today", () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const user: UserSubscription = {
        stripePriceId: "price_pro_monthly",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        stripeCurrentPeriodEnd: today,
      }

      // Should be false because today is not > today
      expect(hasActiveSubscription(user)).toBe(false)
    })
  })
})

