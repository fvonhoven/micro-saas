import { adminDb, adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import type { AlertChannelType } from "@/lib/alert-channels"

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

const createChannelSchema = z.object({
  type: z.enum(["email", "slack", "discord", "webhook"]),
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  config: z.union([
    z.object({ email: z.string().email() }),
    z.object({ webhookUrl: z.string().url() }),
    z.object({
      url: z.string().url(),
      method: z.enum(["POST", "GET"]).optional(),
      headers: z.record(z.string()).optional(),
      includeDetails: z.boolean().optional(),
    }),
  ]),
})

/**
 * GET /api/monitors/[id]/channels
 * List all alert channels for a monitor
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Get all channels
    const channelsSnapshot = await adminDb.collection("monitors").doc(id).collection("channels").orderBy("createdAt", "desc").get()

    const channels = channelsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ channels })
  } catch (error) {
    console.error("Get channels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/monitors/[id]/channels
 * Create a new alert channel for a monitor
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const data = createChannelSchema.parse(body)

    // Verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()
    if (!monitorDoc.exists || monitorDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const now = new Date()

    // Create channel
    const channelRef = await adminDb
      .collection("monitors")
      .doc(id)
      .collection("channels")
      .add({
        type: data.type,
        name: data.name,
        enabled: data.enabled,
        config: data.config,
        createdAt: now,
        updatedAt: now,
      })

    const channel = await channelRef.get()

    return NextResponse.json({
      channel: { id: channel.id, ...channel.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

