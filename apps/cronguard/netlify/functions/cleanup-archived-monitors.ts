import { schedule } from "@netlify/functions"
import { adminDb } from "@repo/firebase/admin"

/**
 * Scheduled function to delete archived monitors after 30 days
 * Runs daily at 2 AM UTC
 */
const handler = schedule("0 2 * * *", async () => {
  console.log("Starting archived monitor cleanup...")

  try {
    const now = new Date()

    // Find all archived monitors where deleteAfter date has passed
    const archivedMonitorsSnapshot = await adminDb
      .collection("monitors")
      .where("archived", "==", true)
      .where("deleteAfter", "<=", now)
      .get()

    if (archivedMonitorsSnapshot.empty) {
      console.log("No archived monitors to delete")
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No archived monitors to delete" }),
      }
    }

    console.log(`Found ${archivedMonitorsSnapshot.size} archived monitors to delete`)

    // Delete monitors and their subcollections
    const batch = adminDb.batch()
    let deleteCount = 0

    for (const monitorDoc of archivedMonitorsSnapshot.docs) {
      const monitorId = monitorDoc.id
      const monitorRef = adminDb.collection("monitors").doc(monitorId)

      // Delete subcollections (incidents, channels, pings)
      const subcollections = ["incidents", "channels", "pings"]

      for (const subcollection of subcollections) {
        const subcollectionSnapshot = await monitorRef.collection(subcollection).get()
        subcollectionSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref)
        })
      }

      // Delete the monitor itself
      batch.delete(monitorRef)
      deleteCount++

      console.log(`Scheduled deletion for monitor: ${monitorDoc.data().name} (${monitorId})`)
    }

    // Commit the batch
    await batch.commit()

    console.log(`Successfully deleted ${deleteCount} archived monitors`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Deleted ${deleteCount} archived monitors`,
        deletedCount: deleteCount,
      }),
    }
  } catch (error) {
    console.error("Error cleaning up archived monitors:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to cleanup archived monitors" }),
    }
  }
})

export { handler }

