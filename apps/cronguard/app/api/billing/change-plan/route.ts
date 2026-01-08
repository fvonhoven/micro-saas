import { adminAuth, adminDb } from "@repo/firebase/admin"
import { updateSubscription, PLANS } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const changePlanSchema = z.object({
  planId: z.enum(["starter", "pro", "team"]),
  billingCycle: z.enum(["monthly", "annual"]),
})

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
    const body = await req.json()
    const data = changePlanSchema.parse(body)

    // Get user's current subscription
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()

    if (!userData?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    // Get the new price ID from the plan configuration
    const plan = PLANS.cronguard[data.planId]
    if (!plan || !("monthlyPriceId" in plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const newPriceId = data.billingCycle === "monthly" ? plan.monthlyPriceId : plan.annualPriceId

    // Check if user is already on this plan
    if (userData.stripePriceId === newPriceId) {
      return NextResponse.json({ error: "You are already on this plan" }, { status: 400 })
    }

    // Update the subscription in Stripe
    const updatedSubscription = await updateSubscription({
      subscriptionId: userData.stripeSubscriptionId,
      newPriceId,
    })

    // Update Firestore with the new price ID
    await adminDb.collection("users").doc(user.uid).update({
      stripePriceId: updatedSubscription.items.data[0]?.price.id,
      stripeCurrentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
    })

    return NextResponse.json({ 
      success: true,
      message: "Plan updated successfully",
      newPlan: plan.name,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Change plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

