import { adminDb } from "@repo/firebase/admin"
import { Resend } from "resend"
import { subscriberMonitorDownEmail, subscriberMonitorRecoveryEmail } from "./email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Notify all subscribers when a monitor goes down
 */
export async function notifySubscribersMonitorDown(
  monitorRef: FirebaseFirestore.DocumentReference,
  monitorData: any
): Promise<void> {
  try {
    // Get all active subscribers
    const subscribersSnapshot = await monitorRef.collection("subscribers").where("active", "==", true).get()

    if (subscribersSnapshot.empty) {
      console.log(`No subscribers for monitor ${monitorData.name}`)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const statusPageUrl = `${baseUrl}/status/${monitorData.slug}`
    const lastPingAt = monitorData.lastPingAt
      ? new Date(monitorData.lastPingAt.toDate()).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null

    // Send emails to all subscribers
    const emailPromises = subscribersSnapshot.docs.map(async doc => {
      const subscriber = doc.data()
      const unsubscribeUrl = `${baseUrl}/api/subscriptions/${monitorData.slug}?token=${subscriber.unsubscribeToken}`

      try {
        await resend.emails.send({
          from: "CronNarc <alerts@cronnarc.com>",
          to: subscriber.email,
          subject: `🚨 Service Down: ${monitorData.statusPageTitle || monitorData.name}`,
          html: subscriberMonitorDownEmail({
            monitorName: monitorData.statusPageTitle || monitorData.name,
            statusPageUrl,
            lastPingAt,
            unsubscribeUrl,
          }),
        })
        console.log(`Sent down notification to subscriber: ${subscriber.email}`)
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error)
      }
    })

    await Promise.all(emailPromises)
    console.log(`Notified ${subscribersSnapshot.size} subscribers about monitor down: ${monitorData.name}`)
  } catch (error) {
    console.error("Error notifying subscribers:", error)
  }
}

/**
 * Notify all subscribers when a monitor recovers
 */
export async function notifySubscribersMonitorRecovery(
  monitorRef: FirebaseFirestore.DocumentReference,
  monitorData: any,
  downtimeMs: number
): Promise<void> {
  try {
    // Get all active subscribers
    const subscribersSnapshot = await monitorRef.collection("subscribers").where("active", "==", true).get()

    if (subscribersSnapshot.empty) {
      console.log(`No subscribers for monitor ${monitorData.name}`)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const statusPageUrl = `${baseUrl}/status/${monitorData.slug}`
    const downtimeMinutes = Math.round(downtimeMs / 1000 / 60)

    // Send emails to all subscribers
    const emailPromises = subscribersSnapshot.docs.map(async doc => {
      const subscriber = doc.data()
      const unsubscribeUrl = `${baseUrl}/api/subscriptions/${monitorData.slug}?token=${subscriber.unsubscribeToken}`

      try {
        await resend.emails.send({
          from: "CronNarc <alerts@cronnarc.com>",
          to: subscriber.email,
          subject: `✅ Service Recovered: ${monitorData.statusPageTitle || monitorData.name}`,
          html: subscriberMonitorRecoveryEmail({
            monitorName: monitorData.statusPageTitle || monitorData.name,
            statusPageUrl,
            downtimeMinutes,
            unsubscribeUrl,
          }),
        })
        console.log(`Sent recovery notification to subscriber: ${subscriber.email}`)
      } catch (error) {
        console.error(`Failed to send email to ${subscriber.email}:`, error)
      }
    })

    await Promise.all(emailPromises)
    console.log(`Notified ${subscribersSnapshot.size} subscribers about monitor recovery: ${monitorData.name}`)
  } catch (error) {
    console.error("Error notifying subscribers:", error)
  }
}

