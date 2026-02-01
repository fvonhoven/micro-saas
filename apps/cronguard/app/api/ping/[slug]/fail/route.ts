import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@repo/firebase/admin"
import { sendAlertToChannels, type AlertPayload } from "@/lib/alert-channels"
import { monitorFailedEmail } from "@/lib/email-templates"
import { notifySubscribersMonitorDown } from "@/lib/notify-subscribers"

/**
 * POST /api/ping/[slug]/fail
 *
 * Signal that a job has failed explicitly. This creates an incident and sends alerts.
 *
 * Optional body:
 * - message: string - Error message or failure reason
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Parse optional failure message
    let failureMessage: string | undefined
    try {
      const body = await req.json()
      failureMessage = body.message
    } catch {
      // No body or invalid JSON - that's okay
    }

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]!
    const monitor = monitorDoc.data()

    // If paused, acknowledge but don't update
    if (monitor.status === "PAUSED") {
      return NextResponse.json({ status: "paused" })
    }

    const now = new Date()
    const wasHealthy = monitor.status === "HEALTHY" || monitor.status === "RUNNING"

    // Calculate duration if job was started
    let duration: number | undefined
    if (monitor.lastStartedAt) {
      const startedAt = monitor.lastStartedAt.toDate()
      duration = now.getTime() - startedAt.getTime()
    }

    // Update monitor to FAILED state
    const batch = adminDb.batch()

    const updateData: any = {
      status: "FAILED",
      lastPingAt: now,
    }

    if (duration !== undefined) {
      updateData.lastDuration = duration
    }

    batch.update(monitorDoc.ref, updateData)

    // Create a ping record to track the failure event
    batch.create(monitorDoc.ref.collection("pings").doc(), {
      receivedAt: now,
      type: "fail",
      message: failureMessage,
      duration,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    })

    await batch.commit()

    // If this is a new failure (was healthy/running), create incident and send alerts
    if (wasHealthy) {
      try {
        // Create incident
        await monitorDoc.ref.collection("incidents").add({
          startedAt: now,
          resolvedAt: null,
          type: "failed",
          message: failureMessage,
          alertsSent: {},
        })

        // Send alerts if channels are configured
        const channelsSnapshot = await monitorDoc.ref.collection("channels").where("enabled", "==", true).get()

        if (!channelsSnapshot.empty) {
          const channels = channelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          const monitorUrl = `${baseUrl}/dashboard/monitors/${monitorDoc.id}`
          const dashboardUrl = `${baseUrl}/dashboard`

          // Prepare alert payload
          const payload: AlertPayload = {
            monitorId: monitorDoc.id,
            monitorName: monitor.name,
            monitorSlug: monitor.slug,
            event: "down",
            timestamp: now.toISOString(),
            details: {
              failureMessage,
              currentTime: now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            },
          }

          // Generate email HTML
          const emailHtml = monitorFailedEmail({
            monitorName: monitor.name,
            monitorUrl,
            failureMessage: failureMessage || "Job reported failure",
            currentTime: now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
            dashboardUrl,
          })

          const emailSubject = `❌ Monitor Failed: ${monitor.name}`

          // Send to all channels
          const result = await sendAlertToChannels(channels, payload, emailHtml, emailSubject)
          console.log(`Monitor ${monitor.name} failed - alerts sent to ${result.success} channels (${result.failed} failed)`)
        }

        // Notify subscribers if status page is enabled
        if (monitor.statusPageEnabled) {
          try {
            await notifySubscribersMonitorDown(monitorDoc.ref, monitor)
          } catch (subscriberError) {
            console.error(`Failed to notify subscribers for ${monitor.name}:`, subscriberError)
          }
        }
      } catch (alertError) {
        console.error(`Failed to send failure alerts for ${monitor.name}:`, alertError)
      }
    }

    return NextResponse.json({
      status: "failed",
      message: failureMessage,
      duration,
    })
  } catch (error) {
    console.error("Fail ping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Support GET requests too for easier testing
export const GET = POST
