import { adminDb, adminAuth } from "@repo/firebase/admin"
import { getUserPlan } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

async function getUserFromSession(req: NextRequest) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch {
    return null
  }
}

/**
 * GET /api/monitors/usage
 * Get monitor usage statistics for the current user
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's plan
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()
    const currentPlan = getUserPlan("cronguard", {
      stripePriceId: userData?.stripePriceId,
      stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
    })

    // Count monitors by status
    const monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", user.uid).get()

    const activeMonitors = monitorsSnapshot.docs.filter(doc => doc.data().status !== "PAUSED").length
    const totalMonitors = monitorsSnapshot.size
    const limit = currentPlan.limits.monitors

    // Calculate usage percentage
    const usagePercentage = limit > 0 ? Math.round((activeMonitors / limit) * 100) : 0

    // Determine if user is at or near limit
    const atLimit = activeMonitors >= limit
    const nearLimit = usagePercentage >= 80 && !atLimit

    // Get next tier suggestion
    let suggestedTier = null
    if (atLimit || nearLimit) {
      if (currentPlan.name === "Free") {
        suggestedTier = { name: "Starter", monitors: 5, price: 15 }
      } else if (currentPlan.name === "Starter") {
        suggestedTier = { name: "Pro", monitors: 25, price: 39 }
      } else if (currentPlan.name === "Pro") {
        suggestedTier = { name: "Team", monitors: 100, price: 99 }
      }
    }

    return NextResponse.json({
      usage: {
        active: activeMonitors,
        total: totalMonitors,
        limit,
        percentage: usagePercentage,
      },
      plan: {
        name: currentPlan.name,
        limit,
      },
      warnings: {
        atLimit,
        nearLimit,
      },
      suggestedTier,
    })
  } catch (error) {
    console.error("Get monitor usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

