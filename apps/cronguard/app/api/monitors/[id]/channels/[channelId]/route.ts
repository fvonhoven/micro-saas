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

const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  config: z
    .union([
      z.object({ email: z.string().email() }),
      z.object({ webhookUrl: z.string().url() }),
      z.object({
        url: z.string().url(),
        method: z.enum(["POST", "GET"]).optional(),
        headers: z.record(z.string()).optional(),
        includeDetails: z.boolean().optional(),
      }),
    ])
    .optional(),
})

/**
 * PATCH /api/monitors/[id]/channels/[channelId]
 * Update an alert channel
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string; channelId: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, channelId } = params
    const body = await req.json()
    const data = updateChannelSchema.parse(body)

    // Verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists || monitorDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    // Verify channel exists
    const channelDoc = await adminDb.collection("monitors").doc(id).collection("channels").doc(channelId).get()

    if (!channelDoc.exists) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Update channel
    await adminDb
      .collection("monitors")
      .doc(id)
      .collection("channels")
      .doc(channelId)
      .update({
        ...data,
        updatedAt: new Date(),
      })

    const updatedChannel = await adminDb.collection("monitors").doc(id).collection("channels").doc(channelId).get()

    return NextResponse.json({
      channel: { id: updatedChannel.id, ...updatedChannel.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Update channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/monitors/[id]/channels/[channelId]
 * Delete an alert channel
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; channelId: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, channelId } = params

    // Verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists || monitorDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    // Delete channel
    await adminDb.collection("monitors").doc(id).collection("channels").doc(channelId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

