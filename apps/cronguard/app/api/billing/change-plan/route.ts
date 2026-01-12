import { adminAuth, adminDb } from "@repo/firebase/admin"
import { updateSubscription, PLANS, getUserPlan } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { Resend } from "resend"
import { upgradeConfirmationEmail } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const changePlanSchema = z.object({
  planId: z.enum(["starter", "pro", "team"]),
  billingCycle: z.enum(["monthly", "annual"]),
  immediate: z.boolean().optional().default(true), // Apply immediately with proration or at end of period
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

    // Get current plan for email
    const currentPlan = getUserPlan("cronguard", {
      stripePriceId: userData.stripePriceId,
      stripeCurrentPeriodEnd: userData.stripeCurrentPeriodEnd,
    })

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
      immediate: data.immediate,
    })

    // Update Firestore with the new price ID
    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({
        stripePriceId: updatedSubscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      })

    // Send upgrade confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const userEmail = user.email || userData.email

    if (userEmail) {
      // Calculate proration amount from the latest invoice
      let prorationAmount = 0
      if (data.immediate && updatedSubscription.latest_invoice) {
        const invoice =
          typeof updatedSubscription.latest_invoice === "string"
            ? await require("@repo/billing").stripe.invoices.retrieve(updatedSubscription.latest_invoice)
            : updatedSubscription.latest_invoice

        prorationAmount = invoice.amount_paid / 100 // Convert cents to dollars
      }

      const emailHtml = upgradeConfirmationEmail({
        oldPlanName: currentPlan.name,
        newPlanName: plan.name,
        newPlanPrice: data.billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice,
        billingCycle: data.billingCycle,
        prorationAmount,
        nextBillingDate: new Date(updatedSubscription.current_period_end * 1000),
        immediate: data.immediate,
        dashboardUrl: baseUrl,
      })

      await resend.emails.send({
        from: "CronNarc <noreply@cronnarc.com>",
        to: userEmail,
        subject: `Plan Upgraded to ${plan.name}!`,
        html: emailHtml,
      })
    }

    return NextResponse.json({
      success: true,
      message: data.immediate
        ? "Plan upgraded successfully! You've been charged the prorated amount."
        : "Plan change scheduled for end of billing period.",
      newPlan: plan.name,
      immediate: data.immediate,
      nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Change plan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
