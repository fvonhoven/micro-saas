import { schedule } from "@netlify/functions"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { Resend } from "resend"

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
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Run every 1 minute for accurate monitoring
const handler = schedule("* * * * *", async () => {
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
            alertsSent: { email: true },
          })

          // Send alert email
          if (monitor.alertEmail && resend) {
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

              await resend.emails.send({
                from: "onboarding@resend.dev",
                to: monitor.alertEmail,
                subject: `🚨 Monitor Down: ${monitor.name}`,
                html: `
                  <h1>Monitor Alert</h1>
                  <p>Your monitor <strong>${monitor.name}</strong> has not checked in and is now marked as DOWN.</p>
                  <p><strong>Last ping:</strong> ${lastPingTime ? formatTime(lastPingTime) : "Never"}</p>
                  <p><strong>Expected by:</strong> ${formatTime(expectedTime)}</p>
                  <p><strong>Current time:</strong> ${formatTime(now)}</p>
                  <p>Please check your cron job immediately.</p>
                `,
              })
              console.log(`Monitor ${monitor.name} is DOWN - alert sent to ${monitor.alertEmail}`)
            } catch (emailError) {
              console.error(`Failed to send email for ${monitor.name}:`, emailError)
            }
          } else {
            console.log(`Monitor ${monitor.name} is DOWN - no alert sent (${!monitor.alertEmail ? "no email configured" : "Resend not configured"})`)
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
