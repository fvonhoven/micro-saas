import { schedule } from '@netlify/functions'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { Resend } from 'resend'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()
const resend = new Resend(process.env.RESEND_API_KEY)

const handler = schedule('* * * * *', async () => {
  console.log('Checking monitors...')

  try {
    const now = new Date()

    // Find monitors that are overdue
    const overdueSnapshot = await db
      .collection('monitors')
      .where('status', 'in', ['HEALTHY', 'LATE'])
      .where('nextExpectedAt', '<', now)
      .get()

    console.log(`Found ${overdueSnapshot.size} overdue monitors`)

    for (const doc of overdueSnapshot.docs) {
      const monitor = doc.data()
      const graceEndTime = new Date(
        monitor.nextExpectedAt.toDate().getTime() + monitor.gracePeriod * 1000
      )

      if (now < graceEndTime) {
        // Still in grace period - mark as LATE
        await doc.ref.update({ status: 'LATE' })
        console.log(`Monitor ${monitor.name} is LATE`)
      } else {
        // Grace period expired - mark as DOWN and send alert
        await doc.ref.update({ status: 'DOWN' })

        // Create incident
        await doc.ref.collection('incidents').add({
          startedAt: now,
          resolvedAt: null,
          alertsSent: { email: true },
        })

        // Send alert email
        if (monitor.alertEmail) {
          await resend.emails.send({
            from: 'CronGuard <alerts@cronguard.com>',
            to: monitor.alertEmail,
            subject: `🚨 Monitor Down: ${monitor.name}`,
            html: `
              <h1>Monitor Alert</h1>
              <p>Your monitor <strong>${monitor.name}</strong> has not checked in and is now marked as DOWN.</p>
              <p>Last ping: ${monitor.lastPingAt ? new Date(monitor.lastPingAt.toDate()).toLocaleString() : 'Never'}</p>
              <p>Expected by: ${new Date(monitor.nextExpectedAt.toDate()).toLocaleString()}</p>
              <p>Please check your cron job immediately.</p>
            `,
          })
        }

        console.log(`Monitor ${monitor.name} is DOWN - alert sent`)
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ checked: overdueSnapshot.size }),
    }
  } catch (error) {
    console.error('Error checking monitors:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to check monitors' }),
    }
  }
})

export { handler }

