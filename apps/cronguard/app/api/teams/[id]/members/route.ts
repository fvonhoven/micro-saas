import { adminAuth, adminDb } from "@repo/firebase/admin"
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
 * GET /api/teams/[id]/members
 * List all team members
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

    // Get all team members
    const membersSnapshot = await adminDb
      .collection("team_members")
      .where("teamId", "==", id)
      .orderBy("joinedAt", "desc")
      .get()

    // Get user details for each member
    const members = await Promise.all(
      membersSnapshot.docs.map(async memberDoc => {
        const memberData = memberDoc.data()

        try {
          const userRecord = await adminAuth.getUser(memberData.userId)

          return {
            id: memberDoc.id,
            userId: memberData.userId,
            email: userRecord.email,
            displayName: userRecord.displayName || userRecord.email,
            role: memberData.role,
            joinedAt: memberData.joinedAt,
            invitedBy: memberData.invitedBy,
          }
        } catch (error) {
          // User might have been deleted
          console.error(`Failed to fetch user ${memberData.userId}:`, error)
          return {
            id: memberDoc.id,
            userId: memberData.userId,
            email: "Unknown",
            displayName: "Unknown User",
            role: memberData.role,
            joinedAt: memberData.joinedAt,
            invitedBy: memberData.invitedBy,
          }
        }
      }),
    )

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

