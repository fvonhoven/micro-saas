import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Subscribe to status page updates
 * Public endpoint - no authentication required
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { email } = await req.json()

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]
    const monitor = monitorDoc.data()

    // Check if status page is enabled
    if (!monitor.statusPageEnabled) {
      return NextResponse.json({ error: "Status page not enabled" }, { status: 404 })
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString("hex")

    // Check if already subscribed
    const existingSubscription = await monitorDoc.ref
      .collection("subscribers")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get()

    if (!existingSubscription.empty) {
      // Update existing subscription
      await existingSubscription.docs[0].ref.update({
        subscribedAt: new Date(),
        active: true,
      })
    } else {
      // Create new subscription
      await monitorDoc.ref.collection("subscribers").add({
        email: email.toLowerCase(),
        subscribedAt: new Date(),
        unsubscribeToken,
        active: true,
      })
    }

    return NextResponse.json(
      { success: true, message: "Successfully subscribed to status updates" },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Unsubscribe from status page updates
 */
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Unsubscribe token required" }, { status: 400 })
    }

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]

    // Find subscription by token
    const subscriptionSnapshot = await monitorDoc.ref
      .collection("subscribers")
      .where("unsubscribeToken", "==", token)
      .limit(1)
      .get()

    if (subscriptionSnapshot.empty) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Mark as inactive (soft delete)
    await subscriptionSnapshot.docs[0].ref.update({
      active: false,
      unsubscribedAt: new Date(),
    })

    return NextResponse.json(
      { success: true, message: "Successfully unsubscribed from status updates" },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

