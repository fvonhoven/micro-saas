import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const updateMemberSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
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
 * PATCH /api/teams/[id]/members/[userId]
 * Update member role (admin or owner only)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, userId } = params
    const body = await req.json()
    const data = updateMemberSchema.parse(body)

    // Check if requester is admin or owner
    const requesterRole = await getUserTeamRole(user.uid, id)
    if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the member to update
    const memberSnapshot = await adminDb
      .collection("team_members")
      .where("teamId", "==", id)
      .where("userId", "==", userId)
      .limit(1)
      .get()

    if (memberSnapshot.empty) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const memberDoc = memberSnapshot.docs[0]
    const currentRole = memberDoc.data().role

    // Cannot change owner role
    if (currentRole === "owner") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 })
    }

    // Only owner can promote to admin
    if (data.role === "admin" && requesterRole !== "owner") {
      return NextResponse.json({ error: "Only owner can promote to admin" }, { status: 403 })
    }

    // Update role
    await memberDoc.ref.update({
      role: data.role,
    })

    const updatedMember = await memberDoc.ref.get()

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        ...updatedMember.data(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/teams/[id]/members/[userId]
 * Remove member from team (admin or owner only, or self-removal)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, userId } = params

    // Check if requester is admin/owner or removing themselves
    const requesterRole = await getUserTeamRole(user.uid, id)
    if (!requesterRole) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isSelfRemoval = user.uid === userId
    const canRemoveOthers = requesterRole === "owner" || requesterRole === "admin"

    if (!isSelfRemoval && !canRemoveOthers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the member to remove
    const memberSnapshot = await adminDb
      .collection("team_members")
      .where("teamId", "==", id)
      .where("userId", "==", userId)
      .limit(1)
      .get()

    if (memberSnapshot.empty) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const memberDoc = memberSnapshot.docs[0]
    const memberRole = memberDoc.data().role

    // Cannot remove owner
    if (memberRole === "owner") {
      return NextResponse.json({ error: "Cannot remove team owner" }, { status: 403 })
    }

    // Delete the membership
    await memberDoc.ref.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

