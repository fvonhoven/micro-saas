import { adminDb, adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"

const createStatusGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  monitorIds: z.array(z.string()).min(1).max(50), // At least 1 monitor, max 50
  customTitle: z.string().max(100).optional().nullable(),
  customDescription: z.string().max(500).optional().nullable(),
  enabled: z.boolean().default(true),
  teamId: z.string().optional(), // Optional team ID for team status groups
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
 * GET /api/status-groups
 * List all status groups for the authenticated user
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's personal status groups
    const personalGroupsSnapshot = await adminDb
      .collection("status_groups")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get()

    const personalGroups = personalGroupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Get team status groups (if user is part of any teams)
    const teamMembershipsSnapshot = await adminDb
      .collection("team_members")
      .where("userId", "==", user.uid)
      .get()

    const teamIds = teamMembershipsSnapshot.docs.map(doc => doc.data().teamId)

    let teamGroups: any[] = []
    if (teamIds.length > 0) {
      // Firestore 'in' query supports up to 10 values
      const teamGroupsPromises = teamIds.map(teamId =>
        adminDb.collection("status_groups").where("teamId", "==", teamId).orderBy("createdAt", "desc").get(),
      )

      const teamGroupsSnapshots = await Promise.all(teamGroupsPromises)
      teamGroups = teamGroupsSnapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }

    return NextResponse.json({
      groups: [...personalGroups, ...teamGroups],
    })
  } catch (error) {
    console.error("Get status groups error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/status-groups
 * Create a new status group
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check email verification
  const authUser = await adminAuth.getUser(user.uid)
  if (!authUser.emailVerified) {
    return NextResponse.json({ error: "Please verify your email address" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createStatusGroupSchema.parse(body)

    // If teamId is provided, verify user is a member and can create status groups
    let isTeamGroup = false
    if (data.teamId) {
      const membershipSnapshot = await adminDb
        .collection("team_members")
        .where("teamId", "==", data.teamId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get()

      if (membershipSnapshot.empty) {
        return NextResponse.json({ error: "You are not a member of this team" }, { status: 403 })
      }

      const teamRole = membershipSnapshot.docs[0].data().role
      if (teamRole === "viewer") {
        return NextResponse.json({ error: "Viewers cannot create status groups" }, { status: 403 })
      }

      isTeamGroup = true
    }

    // Verify all monitors exist and belong to the user/team
    const monitorPromises = data.monitorIds.map(id => adminDb.collection("monitors").doc(id).get())
    const monitorDocs = await Promise.all(monitorPromises)

    for (const monitorDoc of monitorDocs) {
      if (!monitorDoc.exists) {
        return NextResponse.json({ error: "One or more monitors not found" }, { status: 404 })
      }

      const monitor = monitorDoc.data()
      // Check ownership
      if (isTeamGroup) {
        if (monitor?.teamId !== data.teamId) {
          return NextResponse.json({ error: "All monitors must belong to the team" }, { status: 403 })
        }
      } else {
        if (monitor?.userId !== user.uid) {
          return NextResponse.json({ error: "All monitors must belong to you" }, { status: 403 })
        }
      }
    }

    // Generate unique slug
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`

    const now = new Date()
    const groupData: any = {
      userId: user.uid,
      name: data.name,
      slug,
      description: data.description || null,
      monitorIds: data.monitorIds,
      customTitle: data.customTitle || null,
      customDescription: data.customDescription || null,
      enabled: data.enabled,
      createdAt: now,
      updatedAt: now,
      createdBy: user.uid,
    }

    if (isTeamGroup && data.teamId) {
      groupData.teamId = data.teamId
    }

    const groupRef = await adminDb.collection("status_groups").add(groupData)
    const group = await groupRef.get()

    return NextResponse.json({
      group: { id: group.id, ...group.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create status group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

