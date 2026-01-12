import { adminDb, adminAuth } from "@repo/firebase/admin"
import { getUserPlan } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { cookies } from "next/headers"
import { monitorCreationRateLimiter, getClientIp } from "@/lib/rate-limiter"

const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  expectedInterval: z
    .number()
    .min(60)
    .max(86400 * 7), // 1 min to 7 days
  gracePeriod: z.number().min(0).max(3600), // 0 to 1 hour
  alertEmail: z.string().email().optional(),
  alertSlack: z.string().url().optional(),
  timezone: z.string().optional(),
  teamId: z.string().optional(), // Optional team ID for team monitors
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

export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if filtering by team
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("teamId")

  let monitorsSnapshot

  if (teamId) {
    // Verify user is a member of this team
    const membershipSnapshot = await adminDb.collection("team_members").where("teamId", "==", teamId).where("userId", "==", user.uid).limit(1).get()

    if (membershipSnapshot.empty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get team monitors
    monitorsSnapshot = await adminDb.collection("monitors").where("teamId", "==", teamId).orderBy("createdAt", "desc").get()
  } else {
    // Get personal monitors (where teamId is null or doesn't exist)
    monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", user.uid).orderBy("createdAt", "desc").get()

    // Filter out team monitors (those with teamId field)
    const personalMonitors = monitorsSnapshot.docs.filter(doc => !doc.data().teamId)

    const monitors = personalMonitors.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ monitors })
  }

  const monitors = monitorsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json({ monitors })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check email verification for free tier users
  const authUser = await adminAuth.getUser(user.uid)
  if (!authUser.emailVerified) {
    return NextResponse.json({ error: "Please verify your email address before creating monitors" }, { status: 403 })
  }

  // Rate limiting - check both user ID and IP address
  const clientIp = getClientIp(req)
  const rateLimitKey = `${user.uid}:${clientIp}`

  if (!monitorCreationRateLimiter.check(rateLimitKey)) {
    const resetTime = monitorCreationRateLimiter.getResetTime(rateLimitKey)
    const resetDate = resetTime ? new Date(resetTime) : new Date()

    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        resetAt: resetDate.toISOString(),
      },
      { status: 429 },
    )
  }

  try {
    const body = await req.json()
    const data = createMonitorSchema.parse(body)

    // If teamId is provided, verify user is a member and can create monitors
    let isTeamMonitor = false
    let teamRole = null

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

      teamRole = membershipSnapshot.docs[0].data().role

      // Check if user can create monitors (viewer role cannot)
      if (teamRole === "viewer") {
        return NextResponse.json({ error: "Viewers cannot create monitors" }, { status: 403 })
      }

      isTeamMonitor = true
    }

    // Check plan limits
    let currentPlan
    let monitorsSnapshot
    let monitorCount

    if (isTeamMonitor) {
      // For team monitors, check team's plan
      const teamDoc = await adminDb.collection("teams").doc(data.teamId!).get()
      const teamData = teamDoc.data()

      currentPlan = getUserPlan("cronguard", {
        stripePriceId: teamData?.stripePriceId,
        stripeCurrentPeriodEnd: teamData?.stripeCurrentPeriodEnd,
      })

      // Count team's monitors
      monitorsSnapshot = await adminDb.collection("monitors").where("teamId", "==", data.teamId).get()
      monitorCount = monitorsSnapshot.size
    } else {
      // For personal monitors, check user's plan
      const userDoc = await adminDb.collection("users").doc(user.uid).get()
      const userData = userDoc.data()

      currentPlan = getUserPlan("cronguard", {
        stripePriceId: userData?.stripePriceId,
        stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
      })

      // Count user's personal monitors (exclude team monitors)
      monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", user.uid).get()
      const personalMonitors = monitorsSnapshot.docs.filter(doc => !doc.data().teamId)
      monitorCount = personalMonitors.length
    }

    // Check if user has reached their limit
    if (currentPlan.limits.monitors !== -1 && monitorCount >= currentPlan.limits.monitors) {
      return NextResponse.json(
        {
          error: "Monitor limit reached",
          message: `Your ${currentPlan.name} plan allows ${currentPlan.limits.monitors} monitors. Upgrade to create more.`,
          limit: currentPlan.limits.monitors,
          current: monitorCount,
        },
        { status: 403 },
      )
    }

    // Check if interval meets plan requirements
    const minIntervalSeconds = (currentPlan.limits.minCheckIntervalMinutes || 5) * 60
    if (data.expectedInterval < minIntervalSeconds) {
      return NextResponse.json(
        {
          error: "Check interval too short",
          message: `Your ${currentPlan.name} plan requires a minimum ${currentPlan.limits.minCheckIntervalMinutes}-minute check interval. Upgrade to Pro for 1-minute checks.`,
          minInterval: currentPlan.limits.minCheckIntervalMinutes,
        },
        { status: 403 },
      )
    }

    // Generate unique slug
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`

    const now = new Date()
    const nextExpectedAt = new Date(now.getTime() + data.expectedInterval * 1000)

    const monitorData: any = {
      userId: user.uid,
      name: data.name,
      slug,
      expectedInterval: data.expectedInterval,
      gracePeriod: data.gracePeriod,
      status: "PENDING",
      lastPingAt: null,
      nextExpectedAt,
      alertEmail: data.alertEmail || null,
      alertSlack: data.alertSlack || null,
      timezone: data.timezone || "UTC",
      createdAt: now,
      createdBy: user.uid, // Track who created the monitor
    }

    // Add team fields if this is a team monitor
    if (isTeamMonitor && data.teamId) {
      monitorData.teamId = data.teamId
    }

    const monitorRef = await adminDb.collection("monitors").add(monitorData)

    const monitor = await monitorRef.get()

    return NextResponse.json({
      monitor: { id: monitor.id, ...monitor.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create monitor error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
