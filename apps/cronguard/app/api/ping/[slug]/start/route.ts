import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@repo/firebase/admin"

/**
 * POST /api/ping/[slug]/start
 *
 * Signal that a job has started. This enables duration tracking and "running too long" alerts.
 *
 * Flow:
 * 1. Job calls /start when it begins
 * 2. Job calls /ping/[slug] when it completes successfully
 * 3. OR job calls /fail if it fails
 */
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

    // Update monitor to RUNNING state and record start time
    const batch = adminDb.batch()

    batch.update(monitorDoc.ref, {
      status: "RUNNING",
      lastStartedAt: now,
    })

    // Create a ping record to track the start event
    batch.create(monitorDoc.ref.collection("pings").doc(), {
      receivedAt: now,
      type: "start",
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    })

    await batch.commit()

    return NextResponse.json({
      status: "running",
      startedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("Start ping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Support GET requests too for easier testing
export const GET = POST
