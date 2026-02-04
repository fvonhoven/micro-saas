import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { monitorRecoveryEmail } from "../../../../lib/email-templates"
import { sendAlertToChannels, type AlertChannel, type AlertPayload } from "../../../../lib/alert-channels"
import { notifySubscribersMonitorRecovery } from "../../../../lib/notify-subscribers"

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

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
    const nextExpectedAt = new Date(now.getTime() + monitor.expectedInterval * 1000)
    const wasDown = monitor.status === "DOWN" || monitor.status === "LATE" || monitor.status === "FAILED"

    // Calculate duration if job was started
    let duration: number | undefined
    if (monitor.lastStartedAt) {
      const startedAt = monitor.lastStartedAt.toDate()
      duration = now.getTime() - startedAt.getTime()
    }

    // Update monitor and create ping record in a batch
    const batch = adminDb.batch()

    const updateData: any = {
      lastPingAt: now,
      nextExpectedAt: nextExpectedAt,
      status: "HEALTHY",
    }

    // Track duration if available
    if (duration !== undefined) {
      updateData.lastDuration = duration

      // Calculate rolling average duration (simple moving average of last 10)
      const avgDuration = monitor.avgDuration || 0
      const alpha = 0.1 // Weight for new value (10% = like averaging last 10 values)
      updateData.avgDuration = avgDuration * (1 - alpha) + duration * alpha
    }

    batch.update(monitorDoc.ref, updateData)

    // Create ping record - only include duration if it's defined
    const pingData: any = {
      receivedAt: now,
      type: "success",
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      userAgent: req.headers.get("user-agent") || null,
    }

    // Only add duration if it's defined (requires /start endpoint to be called first)
    if (duration !== undefined) {
      pingData.duration = duration
    }

    batch.create(monitorDoc.ref.collection("pings").doc(), pingData)

    await batch.commit()

    // Resolve any ongoing incidents when monitor recovers
    if (wasDown) {
      try {
        // Find all unresolved incidents (no orderBy to avoid needing composite index)
        const incidentsSnapshot = await monitorDoc.ref.collection("incidents").where("resolvedAt", "==", null).get()

        if (!incidentsSnapshot.empty) {
          // Resolve all unresolved incidents
          const resolveBatch = adminDb.batch()
          let mostRecentIncident = null
          let mostRecentStartTime = 0

          for (const incidentDoc of incidentsSnapshot.docs) {
            const incident = incidentDoc.data()
            const startTime = incident.startedAt.toDate().getTime()

            // Track the most recent incident for email
            if (startTime > mostRecentStartTime) {
              mostRecentIncident = { doc: incidentDoc, data: incident }
              mostRecentStartTime = startTime
            }

            // Resolve this incident
            resolveBatch.update(incidentDoc.ref, {
              resolvedAt: now,
              duration: now.getTime() - startTime,
            })
          }

          await resolveBatch.commit()

          // Send recovery alerts for the most recent incident
          if (mostRecentIncident) {
            try {
              // Get all enabled alert channels
              const channelsSnapshot = await monitorDoc.ref.collection("channels").where("enabled", "==", true).get()

              const channels: AlertChannel[] = channelsSnapshot.docs.map(channelDoc => ({
                id: channelDoc.id,
                type: channelDoc.data().type,
                name: channelDoc.data().name,
                enabled: channelDoc.data().enabled,
                config: channelDoc.data().config,
                createdAt: channelDoc.data().createdAt?.toDate() || new Date(),
                updatedAt: channelDoc.data().updatedAt?.toDate() || new Date(),
              }))

              if (channels.length > 0) {
                const incident = mostRecentIncident.data

                // Calculate downtime
                const downtimeMinutes = Math.round((now.getTime() - incident.startedAt.toDate().getTime()) / 1000 / 60)
                const startedAt = incident.startedAt.toDate()
                const timezone = monitor.timezone || "UTC"

                const formatTime = (date: Date) => {
                  return new Intl.DateTimeFormat("en-US", {
                    timeZone: timezone,
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(date)
                }

                // Get base URL for links
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                const monitorUrl = `${baseUrl}/dashboard/monitors/${monitorDoc.id}`
                const dashboardUrl = `${baseUrl}/dashboard`

                // Prepare alert payload
                const payload: AlertPayload = {
                  monitorId: monitorDoc.id,
                  monitorName: monitor.name,
                  monitorSlug: monitor.slug,
                  event: "recovery",
                  timestamp: now.toISOString(),
                  details: {
                    wentDownAt: formatTime(startedAt),
                    recoveredAt: formatTime(now),
                    downtimeMinutes,
                  },
                }

                // Generate email HTML for email channels
                const emailHtml = monitorRecoveryEmail({
                  monitorName: monitor.name,
                  monitorUrl,
                  wentDownAt: formatTime(startedAt),
                  recoveredAt: formatTime(now),
                  downtimeMinutes,
                  dashboardUrl,
                })

                const emailSubject = `✅ Monitor Recovered: ${monitor.name}`

                // Send to all channels
                const result = await sendAlertToChannels(channels, payload, emailHtml, emailSubject)
                console.log(`Monitor ${monitor.name} recovered - alerts sent to ${result.success} channels (${result.failed} failed)`)

                // Notify subscribers if status page is enabled
                if (monitor.statusPageEnabled && mostRecentIncident) {
                  try {
                    const downtimeMs = now.getTime() - startedAt.getTime()
                    await notifySubscribersMonitorRecovery(monitorDoc.ref, monitor, downtimeMs)
                  } catch (subscriberError) {
                    console.error(`Failed to notify subscribers for ${monitor.name}:`, subscriberError)
                  }
                }
              }
            } catch (alertError) {
              console.error(`Failed to send recovery alerts for ${monitor.name}:`, alertError)
            }
          }
        }
      } catch (incidentError) {
        console.error(`Failed to resolve incidents for ${monitor.name}:`, incidentError)
      }
    }

    return NextResponse.json({
      status: "ok",
      next: nextExpectedAt.toISOString(),
    })
  } catch (error) {
    console.error("Ping error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      slug: params.slug,
    })

    // Check if it's a Firebase auth error
    if (error instanceof Error && error.message.includes("credential")) {
      console.error("⚠️ FIREBASE CREDENTIALS ERROR - Check environment variables:")
      console.error("- FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✓ Set" : "✗ Missing")
      console.error("- FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✓ Set" : "✗ Missing")
      console.error("- FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✓ Set" : "✗ Missing")
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Support GET requests too for easier testing
export const GET = POST
