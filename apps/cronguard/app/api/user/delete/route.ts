import { adminAuth, adminDb } from "@repo/firebase/admin"
import { cancelSubscription } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

async function getUserFromSession(req: NextRequest) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch {
    return null
  }
}

/**
 * DELETE /api/user/delete
 * Delete user account and all associated data
 * 
 * This endpoint:
 * 1. Cancels Stripe subscription (if exists)
 * 2. Deletes all monitors and subcollections (incidents, channels, pings)
 * 3. Deletes user document from Firestore
 * 4. Deletes Firebase Auth account
 * 5. Clears session cookie
 */
export async function DELETE(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = user.uid
    console.log(`[Account Deletion] Starting deletion for user: ${userId}`)

    // Step 1: Cancel Stripe subscription if exists
    const userDoc = await adminDb.collection("users").doc(userId).get()
    const userData = userDoc.data()

    if (userData?.stripeSubscriptionId) {
      try {
        console.log(`[Account Deletion] Canceling Stripe subscription: ${userData.stripeSubscriptionId}`)
        await cancelSubscription({ subscriptionId: userData.stripeSubscriptionId })
        console.log(`[Account Deletion] Stripe subscription canceled`)
      } catch (error) {
        console.error(`[Account Deletion] Failed to cancel Stripe subscription:`, error)
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // Step 2: Delete all monitors and their subcollections
    const monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", userId).get()

    console.log(`[Account Deletion] Found ${monitorsSnapshot.size} monitors to delete`)

    for (const monitorDoc of monitorsSnapshot.docs) {
      const monitorId = monitorDoc.id
      console.log(`[Account Deletion] Deleting monitor: ${monitorId}`)

      // Delete subcollections: incidents, channels, pings
      const subcollections = ["incidents", "channels", "pings"]

      for (const subcollection of subcollections) {
        const subcollectionSnapshot = await monitorDoc.ref.collection(subcollection).get()
        console.log(`[Account Deletion] Deleting ${subcollectionSnapshot.size} ${subcollection} from monitor ${monitorId}`)

        // Delete in batches of 500 (Firestore limit)
        const batch = adminDb.batch()
        let count = 0

        for (const doc of subcollectionSnapshot.docs) {
          batch.delete(doc.ref)
          count++

          if (count >= 500) {
            await batch.commit()
            count = 0
          }
        }

        if (count > 0) {
          await batch.commit()
        }
      }

      // Delete the monitor document itself
      await monitorDoc.ref.delete()
      console.log(`[Account Deletion] Monitor ${monitorId} deleted`)
    }

    // Step 3: Delete user document from Firestore
    console.log(`[Account Deletion] Deleting user document from Firestore`)
    await adminDb.collection("users").doc(userId).delete()

    // Step 4: Delete Firebase Auth account
    console.log(`[Account Deletion] Deleting Firebase Auth account`)
    await adminAuth.deleteUser(userId)

    // Step 5: Clear session cookie
    const cookieStore = cookies()
    cookieStore.delete("session")

    console.log(`[Account Deletion] Account deletion completed for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error) {
    console.error("[Account Deletion] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

