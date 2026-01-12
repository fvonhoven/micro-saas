import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
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

/**
 * GET /api/teams
 * List all teams the user is a member of
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get all team memberships for this user
    const membershipsSnapshot = await adminDb.collection("team_members").where("userId", "==", user.uid).get()

    if (membershipsSnapshot.empty) {
      return NextResponse.json({ teams: [] })
    }

    // Get team details for each membership
    const teams = await Promise.all(
      membershipsSnapshot.docs.map(async memberDoc => {
        const membership = memberDoc.data()
        const teamDoc = await adminDb.collection("teams").doc(membership.teamId).get()

        if (!teamDoc.exists) {
          return null
        }

        return {
          id: teamDoc.id,
          ...teamDoc.data(),
          role: membership.role, // Include user's role in this team
        }
      }),
    )

    // Filter out null values (deleted teams)
    const validTeams = teams.filter(team => team !== null)

    return NextResponse.json({ teams: validTeams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createTeamSchema.parse(body)

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const now = new Date()

    // Create team
    const teamRef = await adminDb.collection("teams").add({
      name: data.name,
      slug,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    })

    // Add creator as owner in team_members
    await adminDb.collection("team_members").add({
      teamId: teamRef.id,
      userId: user.uid,
      role: "owner",
      joinedAt: now,
      invitedBy: user.uid, // Self-invited (creator)
    })

    const team = await teamRef.get()

    return NextResponse.json({
      team: {
        id: team.id,
        ...team.data(),
        role: "owner",
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

