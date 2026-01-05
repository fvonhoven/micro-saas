import { adminDb, adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

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

const updateMonitorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["PENDING", "HEALTHY", "LATE", "DOWN", "PAUSED"]).optional(),
  expectedInterval: z.number().min(60).optional(),
  gracePeriod: z.number().min(0).optional(),
  alertEmail: z.string().email().optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const data = updateMonitorSchema.parse(body)

    // Verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists || monitorDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitor = monitorDoc.data()
    const updateData: any = { ...data }

    // If expectedInterval changed, recalculate nextExpectedAt
    if (data.expectedInterval && monitor?.lastPingAt) {
      const lastPing = monitor.lastPingAt.toDate()
      updateData.nextExpectedAt = new Date(lastPing.getTime() + data.expectedInterval * 1000)
    }

    // Update monitor
    await adminDb.collection("monitors").doc(id).update(updateData)

    const updatedDoc = await adminDb.collection("monitors").doc(id).get()

    return NextResponse.json({
      monitor: { id: updatedDoc.id, ...updatedDoc.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Update monitor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists || monitorDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    // Delete monitor
    await adminDb.collection("monitors").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete monitor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
