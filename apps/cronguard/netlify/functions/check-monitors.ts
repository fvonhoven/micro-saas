import { schedule } from "@netlify/functions"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { monitorDownEmail } from "../../lib/email-templates"
import { sendAlertToChannels, type AlertChannel, type AlertPayload } from "../../lib/alert-channels"
import { notifySubscribersMonitorDown } from "../../lib/notify-subscribers"

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

const db = getFirestore()

// Run every 1 minute for accurate monitoring
// * * * * * for every minute
// */5 * * * * for 5 minutes
// */15 * * * * for 15 minutes
const handler = schedule("*/5 * * * *", async () => {
  const executionId = Math.random().toString(36).substring(7)
  console.log(`[${executionId}] Checking monitors...`)

  try {
    const now = new Date()
    console.log(`[${executionId}] Execution started at: ${now.toISOString()}`)

    // Get only monitors that are potentially overdue (nextExpectedAt <= now)
    // This is more efficient than fetching all monitors and filtering in-memory
    // We query for monitors where nextExpectedAt is in the past or null
    const overdueMonitorsSnapshot = await db.collection("monitors").where("status", "!=", "PAUSED").where("nextExpectedAt", "<=", now).get()

    console.log(`[${executionId}] Found ${overdueMonitorsSnapshot.size} potentially overdue monitors`)
    console.log(`[${executionId}] Current time: ${now.toISOString()}`)

    let overdueCount = 0

    for (const doc of overdueMonitorsSnapshot.docs) {
      const monitor = doc.data()

      // Skip if no nextExpectedAt (shouldn't happen with our query, but safety check)
      if (!monitor.nextExpectedAt) {
        continue
      }

      const nextExpectedAt = monitor.nextExpectedAt.toDate()

      overdueCount++
      const graceEndTime = new Date(nextExpectedAt.getTime() + (monitor.gracePeriod || 300) * 1000)

      if (now < graceEndTime) {
        // Still in grace period - mark as LATE (only if not already LATE or DOWN)
        if (monitor.status !== "LATE" && monitor.status !== "DOWN") {
          await doc.ref.update({ status: "LATE" })
          console.log(`Monitor ${monitor.name} is LATE`)
        }
      } else {
        // Grace period expired - mark as DOWN and send alert (ONLY ONCE)
        console.log(`Monitor ${monitor.name} - Current status: ${monitor.status}`)

        if (monitor.status !== "DOWN") {
          console.log(`Monitor ${monitor.name} - Transitioning to DOWN status`)

          // Update status to DOWN FIRST, before sending email
          await doc.ref.update({ status: "DOWN" })
          console.log(`Monitor ${monitor.name} - Status updated to DOWN in Firestore`)

          // Create incident
          await doc.ref.collection("incidents").add({
            startedAt: now,
            resolvedAt: null,
            alertsSent: {},
          })

          // Get all alert channels for this monitor
          const channelsSnapshot = await doc.ref.collection("channels").where("enabled", "==", true).get()

          const channels: AlertChannel[] = channelsSnapshot.docs.map(channelDoc => ({
            id: channelDoc.id,
            type: channelDoc.data().type,
            name: channelDoc.data().name,
            enabled: channelDoc.data().enabled,
            config: channelDoc.data().config,
            createdAt: channelDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: channelDoc.data().updatedAt?.toDate() || new Date(),
          }))

          // Send alerts to all channels
          if (channels.length > 0) {
            try {
              const lastPingTime = monitor.lastPingAt ? monitor.lastPingAt.toDate() : null
              const expectedTime = monitor.nextExpectedAt.toDate()
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
              const monitorUrl = `${baseUrl}/dashboard/monitors/${doc.id}`
              const dashboardUrl = `${baseUrl}/dashboard`

              // Prepare alert payload
              const payload: AlertPayload = {
                monitorId: doc.id,
                monitorName: monitor.name,
                monitorSlug: monitor.slug,
                event: "down",
                timestamp: now.toISOString(),
                details: {
                  lastPingAt: lastPingTime ? formatTime(lastPingTime) : undefined,
                  expectedBy: formatTime(expectedTime),
                  currentTime: formatTime(now),
                },
              }

              // Generate email HTML for email channels
              const emailHtml = monitorDownEmail({
                monitorName: monitor.name,
                monitorUrl,
                lastPingAt: lastPingTime ? formatTime(lastPingTime) : null,
                expectedBy: formatTime(expectedTime),
                currentTime: formatTime(now),
                dashboardUrl,
              })

              const emailSubject = `🚨 Monitor Down: ${monitor.name}`

              // Send to all channels
              const result = await sendAlertToChannels(channels, payload, emailHtml, emailSubject)
              console.log(`Monitor ${monitor.name} is DOWN - alerts sent to ${result.success} channels (${result.failed} failed)`)
            } catch (alertError) {
              console.error(`Failed to send alerts for ${monitor.name}:`, alertError)
            }
          } else {
            console.log(`Monitor ${monitor.name} is DOWN - no alert channels configured`)
          }

          // Notify subscribers if status page is enabled
          if (monitor.statusPageEnabled) {
            try {
              await notifySubscribersMonitorDown(doc.ref, monitor)
            } catch (subscriberError) {
              console.error(`Failed to notify subscribers for ${monitor.name}:`, subscriberError)
            }
          }
        } else {
          console.log(`Monitor ${monitor.name} is still DOWN (no new alert sent)`)
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ checked: overdueMonitorsSnapshot.size, overdue: overdueCount }),
    }
  } catch (error) {
    console.error("Error checking monitors:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check monitors" }),
    }
  }
})

export { handler }
