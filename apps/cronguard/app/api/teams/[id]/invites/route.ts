import { adminAuth, adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { Resend } from "resend"
import crypto from "crypto"
import { teamInviteEmail } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

const createInviteSchema = z.object({
  email: z.string().email(),
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
  const membershipSnapshot = await adminDb.collection("team_members").where("teamId", "==", teamId).where("userId", "==", userId).limit(1).get()

  if (membershipSnapshot.empty) {
    return null
  }

  return membershipSnapshot.docs[0].data().role
}

/**
 * GET /api/teams/[id]/invites
 * List pending invites for a team
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Check if user is admin or owner
    const role = await getUserTeamRole(user.uid, id)
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get pending invites
    const invitesSnapshot = await adminDb
      .collection("team_invites")
      .where("teamId", "==", id)
      .where("status", "==", "pending")
      .orderBy("invitedAt", "desc")
      .get()

    const invites = invitesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ invites })
  } catch (error) {
    console.error("Error fetching invites:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/teams/[id]/invites
 * Send a team invite
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await req.json()
    const data = createInviteSchema.parse(body)

    // Check if user is admin or owner
    const role = await getUserTeamRole(user.uid, id)
    if (!role || (role !== "owner" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get team details
    const teamDoc = await adminDb.collection("teams").doc(id).get()
    if (!teamDoc.exists) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const teamData = teamDoc.data()

    // Check if user is already a member
    const existingMemberSnapshot = await adminDb
      .collection("team_members")
      .where("teamId", "==", id)
      .where("userId", "==", data.email) // This won't work - we need to check by email
      .limit(1)
      .get()

    // Check if there's already a pending invite
    const existingInviteSnapshot = await adminDb
      .collection("team_invites")
      .where("teamId", "==", id)
      .where("email", "==", data.email)
      .where("status", "==", "pending")
      .limit(1)
      .get()

    if (!existingInviteSnapshot.empty) {
      return NextResponse.json({ error: "Invite already sent to this email" }, { status: 400 })
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex")

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invite
    const inviteRef = await adminDb.collection("team_invites").add({
      teamId: id,
      teamName: teamData?.name || "Unknown Team",
      email: data.email,
      role: data.role,
      invitedBy: user.uid,
      invitedAt: now,
      expiresAt,
      status: "pending",
      token,
    })

    // Send invite email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteUrl = `${baseUrl}/invites/${token}`

    // Get inviter details
    const inviterRecord = await adminAuth.getUser(user.uid)
    const inviterName = inviterRecord.displayName || inviterRecord.email || "A team member"
    const inviterEmail = inviterRecord.email || ""

    // Generate professional email
    const emailHtml = teamInviteEmail({
      teamName: teamData?.name || "Unknown Team",
      inviterName,
      inviterEmail,
      role: data.role,
      inviteUrl,
      expiresAt,
      dashboardUrl: baseUrl,
    })

    await resend.emails.send({
      from: "CronNarc <noreply@cronnarc.com>",
      to: data.email,
      subject: `You've been invited to join ${teamData?.name} on CronNarc`,
      html: emailHtml,
    })

    const invite = await inviteRef.get()

    return NextResponse.json({
      invite: {
        id: invite.id,
        ...invite.data(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Error creating invite:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
