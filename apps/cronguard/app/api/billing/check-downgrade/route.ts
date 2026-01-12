import { adminAuth, adminDb } from "@repo/firebase/admin"
import { getUserPlan, PLAN_METADATA } from "@repo/billing"
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
 * GET /api/billing/check-downgrade?planId=starter&billingCycle=monthly
 * Check if a plan change is a downgrade and requires monitor selection
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const planId = searchParams.get("planId")
    const billingCycle = searchParams.get("billingCycle")

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: "Missing planId or billingCycle" }, { status: 400 })
    }

    // Get user's current plan
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()
    const currentPlan = getUserPlan("cronguard", {
      stripePriceId: userData?.stripePriceId,
      stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
    })

    // Get new plan limits
    const newPlanMetadata = PLAN_METADATA.cronguard[planId as keyof typeof PLAN_METADATA.cronguard]
    if (!newPlanMetadata) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const currentLimit = currentPlan.limits.monitors
    const newLimit = newPlanMetadata.limits.monitors

    // Check if this is a downgrade (lower monitor limit)
    const isDowngrade = newLimit < currentLimit

    if (!isDowngrade) {
      return NextResponse.json({
        isDowngrade: false,
        requiresMonitorSelection: false,
      })
    }

    // Count user's active monitors (not archived)
    const monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", user.uid).get()

    // Filter out archived monitors (archived field may not exist on older monitors)
    const activeMonitors = monitorsSnapshot.docs.filter(doc => !doc.data().archived)
    const activeMonitorCount = activeMonitors.length

    // Check if user has more monitors than the new plan allows
    const requiresMonitorSelection = activeMonitorCount > newLimit

    // Get monitor details if selection is required
    let monitors: Array<{ id: string; name: string; status: string; lastPingAt: any }> = []
    if (requiresMonitorSelection) {
      monitors = activeMonitors.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        status: doc.data().status,
        lastPingAt: doc.data().lastPingAt,
      }))
    }

    return NextResponse.json({
      isDowngrade: true,
      requiresMonitorSelection,
      currentLimit,
      newLimit,
      activeMonitorCount,
      monitors,
      newPlanName: newPlanMetadata.name,
    })
  } catch (error) {
    console.error("Check downgrade error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
