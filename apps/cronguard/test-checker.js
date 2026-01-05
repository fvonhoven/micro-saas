#!/usr/bin/env node

/**
 * Local Background Checker Simulator
 * 
 * This simulates the Netlify scheduled function that checks monitors
 * and marks them as DOWN when they miss pings.
 * 
 * Run this while your dev server is running to test the full flow locally.
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin (same as your .env.local)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

async function checkMonitors() {
  console.log('🔍 Checking monitors...')
  console.log('Time:', new Date().toISOString())
  console.log('')

  try {
    const now = new Date()

    // Find monitors that are overdue
    const overdueSnapshot = await db
      .collection('monitors')
      .where('status', 'in', ['HEALTHY', 'LATE', 'PENDING'])
      .get()

    console.log(`Found ${overdueSnapshot.size} monitors to check`)
    console.log('')

    for (const doc of overdueSnapshot.docs) {
      const monitor = doc.data()
      
      // Skip if no nextExpectedAt (PENDING monitors)
      if (!monitor.nextExpectedAt) {
        console.log(`⏸️  ${monitor.name} - PENDING (never received a ping)`)
        continue
      }

      const nextExpectedAt = monitor.nextExpectedAt.toDate()
      const gracePeriod = monitor.gracePeriod || 300
      const graceEndTime = new Date(nextExpectedAt.getTime() + gracePeriod * 1000)

      console.log(`📊 ${monitor.name}:`)
      console.log(`   Status: ${monitor.status}`)
      console.log(`   Expected by: ${nextExpectedAt.toLocaleString()}`)
      console.log(`   Grace ends: ${graceEndTime.toLocaleString()}`)
      console.log(`   Current time: ${now.toLocaleString()}`)

      if (now < nextExpectedAt) {
        console.log(`   ✅ Still within expected interval`)
      } else if (now < graceEndTime) {
        console.log(`   ⚠️  LATE - In grace period`)
        if (monitor.status !== 'LATE') {
          await doc.ref.update({ status: 'LATE' })
          console.log(`   Updated status to LATE`)
        }
      } else {
        console.log(`   ❌ DOWN - Grace period expired`)
        if (monitor.status !== 'DOWN') {
          await doc.ref.update({ status: 'DOWN' })
          
          // Create incident
          await doc.ref.collection('incidents').add({
            startedAt: now,
            resolvedAt: null,
            alertsSent: { email: true },
          })
          
          console.log(`   Updated status to DOWN`)
          console.log(`   Created incident record`)
          console.log(`   📧 Would send email to: ${monitor.alertEmail || 'No email configured'}`)
        }
      }
      console.log('')
    }

    console.log('✅ Check complete!')
  } catch (error) {
    console.error('❌ Error checking monitors:', error)
  }
}

// Run the checker
checkMonitors()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

