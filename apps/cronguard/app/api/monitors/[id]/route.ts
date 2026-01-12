import { adminDb, adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { Resend } from "resend"
import { monitorPausedEmail, monitorResumedEmail } from "@/lib/email-templates"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

const updateMonitorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["PENDING", "HEALTHY", "LATE", "DOWN", "PAUSED"]).optional(),
  expectedInterval: z.number().min(60).optional(),
  gracePeriod: z.number().min(0).optional(),
  alertEmail: z.string().email().optional().or(z.literal("")),
  timezone: z.string().optional(),
  statusPageEnabled: z.boolean().optional(),
  statusPageTitle: z.string().max(100).optional(),
  statusPageDescription: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const data = updateMonitorSchema.parse(body)

    // Verify ownership or team membership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorData = monitorDoc.data()
    const isOwner = monitorData?.userId === user.uid
    let canEdit = isOwner

    // If it's a team monitor, check team membership and permissions
    if (monitorData?.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", monitorData.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (!membershipSnapshot.empty) {
        const role = membershipSnapshot.docs[0].data().role
        // Viewers cannot edit monitors
        canEdit = role !== "viewer"
      } else {
        canEdit = false
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: "You don't have permission to edit this monitor" }, { status: 403 })
    }

    const monitor = monitorDoc.data()
    const updateData: any = { ...data }

    // Track if status is changing to/from PAUSED for email notifications
    const oldStatus = monitor?.status
    const newStatus = data.status
    const statusChangedToPaused = oldStatus !== "PAUSED" && newStatus === "PAUSED"
    const statusChangedFromPaused = oldStatus === "PAUSED" && newStatus && newStatus !== "PAUSED"

    // If expectedInterval changed, recalculate nextExpectedAt
    if (data.expectedInterval && monitor?.lastPingAt) {
      const lastPing = monitor.lastPingAt.toDate()
      updateData.nextExpectedAt = new Date(lastPing.getTime() + data.expectedInterval * 1000)
    }

    // Update monitor
    await adminDb.collection("monitors").doc(id).update(updateData)

    const updatedDoc = await adminDb.collection("monitors").doc(id).get()
    const updatedMonitor = updatedDoc.data()

    // Send email notifications for pause/resume
    if (resend && updatedMonitor?.alertEmail) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const monitorUrl = `${baseUrl}/dashboard/monitors/${id}`
      const dashboardUrl = `${baseUrl}/dashboard`

      try {
        if (statusChangedToPaused) {
          // Send pause notification
          const emailHtml = monitorPausedEmail({
            monitorName: updatedMonitor.name,
            monitorUrl,
            pausedBy: user.email || "You",
            dashboardUrl,
          })

          await resend.emails.send({
            from: "CronNarc <noreply@cronnarc.com>",
            to: updatedMonitor.alertEmail,
            subject: `⏸️ Monitor Paused: ${updatedMonitor.name}`,
            html: emailHtml,
          })
          console.log(`Pause notification sent for ${updatedMonitor.name}`)
        } else if (statusChangedFromPaused) {
          // Send resume notification
          const emailHtml = monitorResumedEmail({
            monitorName: updatedMonitor.name,
            monitorUrl,
            resumedBy: user.email || "You",
            dashboardUrl,
          })

          await resend.emails.send({
            from: "CronNarc <noreply@cronnarc.com>",
            to: updatedMonitor.alertEmail,
            subject: `▶️ Monitor Resumed: ${updatedMonitor.name}`,
            html: emailHtml,
          })
          console.log(`Resume notification sent for ${updatedMonitor.name}`)
        }
      } catch (emailError) {
        console.error(`Failed to send pause/resume email for ${updatedMonitor.name}:`, emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      monitor: { id: updatedDoc.id, ...updatedDoc.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Update monitor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Verify ownership or team admin/owner permissions
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorData = monitorDoc.data()
    const isOwner = monitorData?.userId === user.uid
    let canDelete = isOwner

    // If it's a team monitor, check team membership and permissions
    if (monitorData?.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", monitorData.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (!membershipSnapshot.empty) {
        const role = membershipSnapshot.docs[0].data().role
        // Only admins and owners can delete team monitors
        canDelete = role === "admin" || role === "owner"
      } else {
        canDelete = false
      }
    }

    if (!canDelete) {
      return NextResponse.json({ error: "You don't have permission to delete this monitor" }, { status: 403 })
    }

    // Delete monitor
    await adminDb.collection("monitors").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete monitor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
