import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
})

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

async function getUserTeamRole(userId: string, teamId: string): Promise<string | null> {
  const membershipSnapshot = await adminDb
    .collection("team_members")
    .where("teamId", "==", teamId)
    .where("userId", "==", userId)
    .limit(1)
    .get()

  if (membershipSnapshot.empty) {
    return null
  }

  return membershipSnapshot.docs[0].data().role
}

/**
 * GET /api/teams/[id]
 * Get team details
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Check if user is a member
    const role = await getUserTeamRole(user.uid, id)
    if (!role) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const teamDoc = await adminDb.collection("teams").doc(id).get()

    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({
      team: {
        id: teamDoc.id,
        ...teamDoc.data(),
        role,
      },
    })
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/teams/[id]
 * Update team (admin or owner only)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const data = updateTeamSchema.parse(body)

    // Check if user is admin or owner
    const role = await getUserTeamRole(user.uid, id)
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    // Update slug if name changed
    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }

    await adminDb.collection("teams").doc(id).update(updateData)

    const updatedTeam = await adminDb.collection("teams").doc(id).get()

    return NextResponse.json({
      team: {
        id: updatedTeam.id,
        ...updatedTeam.data(),
        role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete team (owner only)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Check if user is owner
    const role = await getUserTeamRole(user.uid, id)
    if (role !== "owner") {
      return NextResponse.json({ error: "Forbidden - only team owner can delete team" }, { status: 403 })
    }

    // Delete all team members
    const membersSnapshot = await adminDb.collection("team_members").where("teamId", "==", id).get()

    const batch = adminDb.batch()
    membersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // Delete all pending invites
    const invitesSnapshot = await adminDb.collection("team_invites").where("teamId", "==", id).get()

    invitesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // Delete the team
    batch.delete(adminDb.collection("teams").doc(id))

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

