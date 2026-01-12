import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminAuth, adminDb } from "@repo/firebase/admin"
import { getUserPlan } from "@repo/billing"

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

export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()

    const plan = getUserPlan("cronguard", {
      stripePriceId: userData?.stripePriceId,
      stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
    })

    // Get Firebase Auth user to check email verification
    const authUser = await adminAuth.getUser(user.uid)

    return NextResponse.json({
      plan,
      paymentStatus: userData?.paymentStatus || "active",
      gracePeriodEndsAt: userData?.gracePeriodEndsAt?.toDate?.() || null,
      emailVerified: authUser.emailVerified,
    })
  } catch (error) {
    console.error("Error fetching user plan:", error)
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 })
  }
}
