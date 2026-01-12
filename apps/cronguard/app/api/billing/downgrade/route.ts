import { adminAuth, adminDb } from "@repo/firebase/admin"
import { PLANS, PLAN_METADATA } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { Resend } from "resend"
import { downgradeConfirmationEmail } from "../../../../lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const downgradeSchema = z.object({
  planId: z.enum(["starter", "pro", "team"]),
  billingCycle: z.enum(["monthly", "annual"]),
  selectedMonitorIds: z.array(z.string()),
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

/**
 * POST /api/billing/downgrade
 * Handle plan downgrades with monitor selection
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = downgradeSchema.parse(body)

    // Get user's current subscription
    const userDoc = await adminDb.collection("users").doc(user.uid).get()
    const userData = userDoc.data()

    if (!userData?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    // Get the new plan limits
    const newPlanMetadata = PLAN_METADATA.cronguard[data.planId]
    const newLimit = newPlanMetadata.limits.monitors

    // Validate that the selected monitors count matches the new limit
    if (data.selectedMonitorIds.length !== newLimit) {
      return NextResponse.json({ error: `You must select exactly ${newLimit} monitors to keep` }, { status: 400 })
    }

    // Get all user's monitors
    const monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", user.uid).get()

    const allMonitorIds = monitorsSnapshot.docs.map(doc => doc.id)
    const monitorsToArchive = allMonitorIds.filter(id => !data.selectedMonitorIds.includes(id))

    // Archive monitors that weren't selected
    const archiveDate = new Date()
    const deleteAfter = new Date(archiveDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    const batch = adminDb.batch()

    for (const monitorId of monitorsToArchive) {
      const monitorRef = adminDb.collection("monitors").doc(monitorId)
      batch.update(monitorRef, {
        archived: true,
        archivedAt: archiveDate,
        deleteAfter,
        status: "PAUSED",
      })
    }

    // Create a subscription change record
    const changeRef = adminDb.collection("subscription_changes").doc()
    batch.set(changeRef, {
      userId: user.uid,
      type: "downgrade",
      fromPlan: userData.stripePriceId,
      toPlan: data.planId,
      billingCycle: data.billingCycle,
      selectedMonitors: data.selectedMonitorIds,
      archivedMonitors: monitorsToArchive,
      createdAt: new Date(),
      status: "pending",
      appliesAt: userData.stripeCurrentPeriodEnd || new Date(),
    })

    await batch.commit()

    // Send confirmation email
    try {
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cronnarc.com"
      const emailHtml = downgradeConfirmationEmail({
        newPlanName: newPlanMetadata.name,
        archivedCount: monitorsToArchive.length,
        appliesAt: userData.stripeCurrentPeriodEnd?.toDate() || new Date(),
        dashboardUrl,
      })

      await resend.emails.send({
        from: "CronNarc <noreply@cronnarc.com>",
        to: user.email || "",
        subject: `Plan Downgrade Scheduled - ${newPlanMetadata.name}`,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error("Failed to send downgrade confirmation email:", emailError)
      // Don't fail the request if email fails
    }

    // Note: We don't update Stripe subscription here
    // The downgrade will be applied at the end of the current billing period
    // This is handled by a scheduled function or webhook

    return NextResponse.json({
      success: true,
      message: `Downgrade scheduled. ${monitorsToArchive.length} monitors archived.`,
      archivedCount: monitorsToArchive.length,
      appliesAt: userData.stripeCurrentPeriodEnd,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Downgrade error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
