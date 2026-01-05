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

const handler = schedule("* * * * *", async () => {
  console.log("Checking monitors...")

  try {
    const now = new Date()

    // Get all active monitors (not PAUSED)
    // We'll filter in-memory to avoid complex Firestore index requirements
    const allMonitorsSnapshot = await db.collection("monitors").where("status", "!=", "PAUSED").get()

    console.log(`Checking ${allMonitorsSnapshot.size} monitors`)
    console.log(`Current time: ${now.toISOString()}`)

    let overdueCount = 0

    for (const doc of allMonitorsSnapshot.docs) {
      const monitor = doc.data()

      // Skip if no nextExpectedAt (PENDING monitors that never received a ping)
      if (!monitor.nextExpectedAt) {
        continue
      }

      const nextExpectedAt = monitor.nextExpectedAt.toDate()

      // Skip if not overdue yet
      if (now < nextExpectedAt) {
        continue
      }

      overdueCount++
      const graceEndTime = new Date(nextExpectedAt.getTime() + (monitor.gracePeriod || 300) * 1000)

      if (now < graceEndTime) {
        // Still in grace period - mark as LATE
        await doc.ref.update({ status: "LATE" })
        console.log(`Monitor ${monitor.name} is LATE`)
      } else {
        // Grace period expired - mark as DOWN and send alert
        await doc.ref.update({ status: "DOWN" })

        // Create incident
        await doc.ref.collection("incidents").add({
          startedAt: now,
          resolvedAt: null,
          alertsSent: { email: true },
        })

        // Send alert email
        if (monitor.alertEmail && resend) {
          try {
            await resend.emails.send({
              from: "CronGuard <alerts@cronguard.com>",
              to: monitor.alertEmail,
              subject: `🚨 Monitor Down: ${monitor.name}`,
              html: `
                <h1>Monitor Alert</h1>
                <p>Your monitor <strong>${monitor.name}</strong> has not checked in and is now marked as DOWN.</p>
                <p>Last ping: ${monitor.lastPingAt ? new Date(monitor.lastPingAt.toDate()).toLocaleString() : "Never"}</p>
                <p>Expected by: ${new Date(monitor.nextExpectedAt.toDate()).toLocaleString()}</p>
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
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ checked: allMonitorsSnapshot.size, overdue: overdueCount }),
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
