import { adminAuth, adminDb } from "@repo/firebase/admin"
import { createBillingPortalSession } from "@repo/billing"
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

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's Stripe customer ID
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()

    if (!userData?.stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3002"

    const session = await createBillingPortalSession({
      customerId: userData.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Create portal session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

