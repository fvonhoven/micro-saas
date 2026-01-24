import { adminDb, adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { FieldValue } from "firebase-admin/firestore"

const updateStatusGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  monitorIds: z.array(z.string()).min(1).max(50).optional(),
  customTitle: z.string().max(100).optional().nullable(),
  customDescription: z.string().max(500).optional().nullable(),
  enabled: z.boolean().optional(),
})

async function getUserFromSession(req: NextRequest) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie.value, true)
    return decodedClaims
  } catch (error) {
    return null
  }
}

/**
 * GET /api/status-groups/[id]
 * Get a specific status group
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  try {
    const groupDoc = await adminDb.collection("status_groups").doc(id).get()

    if (!groupDoc.exists) {
      return NextResponse.json({ error: "Status group not found" }, { status: 404 })
    }

    const group = groupDoc.data()

    // Check ownership
    if (group?.userId !== user.uid && !group?.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If team group, verify user is a member
    if (group?.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", group.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (membershipSnapshot.empty) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({
      group: { id: groupDoc.id, ...group },
    })
  } catch (error) {
    console.error("Get status group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/status-groups/[id]
 * Update a status group
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  try {
    const groupDoc = await adminDb.collection("status_groups").doc(id).get()

    if (!groupDoc.exists) {
      return NextResponse.json({ error: "Status group not found" }, { status: 404 })
    }

    const group = groupDoc.data()

    // Check ownership
    if (group?.userId !== user.uid && !group?.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If team group, verify user has permission
    if (group?.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", group.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (membershipSnapshot.empty) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const teamRole = membershipSnapshot.docs[0].data().role
      if (teamRole === "viewer") {
        return NextResponse.json({ error: "Viewers cannot update status groups" }, { status: 403 })
      }
    }

    const body = await req.json()
    const data = updateStatusGroupSchema.parse(body)

    // If updating monitorIds, verify all monitors exist and belong to user/team
    if (data.monitorIds) {
      const monitorPromises = data.monitorIds.map(monitorId => adminDb.collection("monitors").doc(monitorId).get())
      const monitorDocs = await Promise.all(monitorPromises)

      for (const monitorDoc of monitorDocs) {
        if (!monitorDoc.exists) {
          return NextResponse.json({ error: "One or more monitors not found" }, { status: 404 })
        }

        const monitor = monitorDoc.data()
        if (group?.teamId) {
          if (monitor?.teamId !== group.teamId) {
            return NextResponse.json({ error: "All monitors must belong to the team" }, { status: 403 })
          }
        } else {
          if (monitor?.userId !== user.uid) {
            return NextResponse.json({ error: "All monitors must belong to you" }, { status: 403 })
          }
        }
      }
    }

    const updateData: any = { ...data, updatedAt: new Date() }

    // Handle null values for optional fields
    if (data.description === null) {
      updateData.description = FieldValue.delete()
    }
    if (data.customTitle === null) {
      updateData.customTitle = FieldValue.delete()
    }
    if (data.customDescription === null) {
      updateData.customDescription = FieldValue.delete()
    }

    await adminDb.collection("status_groups").doc(id).update(updateData)

    const updatedDoc = await adminDb.collection("status_groups").doc(id).get()

    return NextResponse.json({
      group: { id: updatedDoc.id, ...updatedDoc.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Update status group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/status-groups/[id]
 * Delete a status group
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = params

  try {
    const groupDoc = await adminDb.collection("status_groups").doc(id).get()

    if (!groupDoc.exists) {
      return NextResponse.json({ error: "Status group not found" }, { status: 404 })
    }

    const group = groupDoc.data()

    // Check ownership
    if (group?.userId !== user.uid && !group?.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If team group, verify user has permission
    if (group?.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", group.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (membershipSnapshot.empty) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const teamRole = membershipSnapshot.docs[0].data().role
      if (teamRole === "viewer") {
        return NextResponse.json({ error: "Viewers cannot delete status groups" }, { status: 403 })
      }
    }

    await adminDb.collection("status_groups").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete status group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

