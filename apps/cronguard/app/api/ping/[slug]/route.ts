import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { monitorRecoveryEmail } from "../../../../lib/email-templates"
import { sendAlertToChannels, type AlertChannel, type AlertPayload } from "../../../../lib/alert-channels"

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
    const wasDown = monitor.status === "DOWN" || monitor.status === "LATE"

    // Update monitor and create ping record in a batch
    const batch = adminDb.batch()

    batch.update(monitorDoc.ref, {
      lastPingAt: now,
      nextExpectedAt: nextExpectedAt,
      status: "HEALTHY",
    })

    batch.create(monitorDoc.ref.collection("pings").doc(), {
      receivedAt: now,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    })

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Support GET requests too for easier testing
export const GET = POST
