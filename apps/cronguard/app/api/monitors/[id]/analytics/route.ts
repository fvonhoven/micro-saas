import { adminDb, adminAuth } from "@repo/firebase/admin"
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

function calculateUptime(incidents: any[], startDate: Date, endDate: Date): { uptime: number; downtime: number } {
  const totalPeriod = endDate.getTime() - startDate.getTime()

  if (totalPeriod <= 0) return { uptime: 100, downtime: 0 }

  // Build list of downtime periods that overlap with our time window
  const downtimePeriods: Array<{ start: number; end: number }> = []

  for (const incident of incidents) {
    const incidentStart = incident.startedAt.toDate()
    const incidentEnd = incident.resolvedAt ? incident.resolvedAt.toDate() : new Date()

    // Only count downtime within the period
    const downtimeStart = Math.max(incidentStart.getTime(), startDate.getTime())
    const downtimeEnd = Math.min(incidentEnd.getTime(), endDate.getTime())

    if (downtimeStart < downtimeEnd) {
      downtimePeriods.push({ start: downtimeStart, end: downtimeEnd })
    }
  }

  // Sort periods by start time
  downtimePeriods.sort((a, b) => a.start - b.start)

  // Merge overlapping periods
  const mergedPeriods: Array<{ start: number; end: number }> = []
  for (const period of downtimePeriods) {
    if (mergedPeriods.length === 0) {
      mergedPeriods.push(period)
    } else {
      const lastPeriod = mergedPeriods[mergedPeriods.length - 1]!
      if (period.start <= lastPeriod.end) {
        // Overlapping - merge them
        lastPeriod.end = Math.max(lastPeriod.end, period.end)
      } else {
        // Non-overlapping - add as new period
        mergedPeriods.push(period)
      }
    }
  }

  // Calculate total downtime from merged periods
  let totalDowntime = 0
  for (const period of mergedPeriods) {
    totalDowntime += period.end - period.start
  }

  const uptime = ((totalPeriod - totalDowntime) / totalPeriod) * 100
  return {
    uptime: Math.max(0, Math.min(100, uptime)), // Clamp between 0-100
    downtime: totalDowntime, // in milliseconds
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = params

    // Get monitor and verify ownership
    const monitorDoc = await adminDb.collection("monitors").doc(id).get()

    if (!monitorDoc.exists) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitor = monitorDoc.data()

    if (monitor?.userId !== user.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const now = new Date()
    const createdAt = monitor.createdAt?.toDate() || now

    // Fetch all incidents
    const incidentsSnapshot = await monitorDoc.ref.collection("incidents").orderBy("startedAt", "desc").get()

    const incidents = incidentsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        startedAt: data.startedAt,
        resolvedAt: data.resolvedAt,
        duration: data.duration,
        alertsSent: data.alertsSent,
      }
    })

    // Fetch recent pings (last 100)
    const pingsSnapshot = await monitorDoc.ref.collection("pings").orderBy("receivedAt", "desc").limit(100).get()

    const pings = pingsSnapshot.docs.map(doc => doc.data())

    // Calculate uptime for different periods
    // For each period, use the LATER date (more recent) between period start and monitor creation
    // This ensures we don't calculate uptime before the monitor existed
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Use Math.max to get the LATER (more recent) date - the one closer to now
    // If monitor was created 2 days ago, and we want "last 7 days", we use creation date (2 days ago)
    // If monitor was created 10 days ago, and we want "last 7 days", we use 7 days ago
    const start24h = createdAt > last24h ? createdAt : last24h
    const start7d = createdAt > last7d ? createdAt : last7d
    const start30d = createdAt > last30d ? createdAt : last30d
    const start90d = createdAt > last90d ? createdAt : last90d

    const stats24h = calculateUptime(incidents, start24h, now)
    const stats7d = calculateUptime(incidents, start7d, now)
    const stats30d = calculateUptime(incidents, start30d, now)
    const stats90d = calculateUptime(incidents, start90d, now)
    const statsAllTime = calculateUptime(incidents, createdAt, now)

    const uptime = {
      last24h: {
        uptime: stats24h.uptime,
        downtime: stats24h.downtime,
      },
      last7d: {
        uptime: stats7d.uptime,
        downtime: stats7d.downtime,
      },
      last30d: {
        uptime: stats30d.uptime,
        downtime: stats30d.downtime,
      },
      last90d: {
        uptime: stats90d.uptime,
        downtime: stats90d.downtime,
      },
      allTime: {
        uptime: statsAllTime.uptime,
        downtime: statsAllTime.downtime,
      },
    }

    // Calculate incident statistics using merged periods to avoid counting overlaps
    // Build list of all downtime periods
    const allDowntimePeriods: Array<{ start: number; end: number }> = []
    for (const incident of incidents) {
      const incidentStart = incident.startedAt.toDate()
      const incidentEnd = incident.resolvedAt ? incident.resolvedAt.toDate() : new Date()
      allDowntimePeriods.push({ start: incidentStart.getTime(), end: incidentEnd.getTime() })
    }

    // Sort periods by start time
    allDowntimePeriods.sort((a, b) => a.start - b.start)

    // Merge overlapping periods
    const mergedAllPeriods: Array<{ start: number; end: number }> = []
    for (const period of allDowntimePeriods) {
      if (mergedAllPeriods.length === 0) {
        mergedAllPeriods.push(period)
      } else {
        const lastPeriod = mergedAllPeriods[mergedAllPeriods.length - 1]!
        if (period.start <= lastPeriod.end) {
          // Overlapping - merge them
          lastPeriod.end = Math.max(lastPeriod.end, period.end)
        } else {
          // Non-overlapping - add as new period
          mergedAllPeriods.push(period)
        }
      }
    }

    // Calculate total downtime from merged periods
    const totalDowntime = mergedAllPeriods.reduce((sum, period) => {
      return sum + (period.end - period.start)
    }, 0)

    const resolvedIncidents = incidents.filter(inc => inc.resolvedAt)
    const averageDuration = mergedAllPeriods.length > 0 ? totalDowntime / mergedAllPeriods.length : 0

    // Helper to convert Firestore timestamp to ISO string
    const toISOString = (timestamp: any) => {
      if (!timestamp) return null
      if (timestamp.toDate) return timestamp.toDate().toISOString()
      return timestamp
    }

    const analytics = {
      uptime,
      pings: {
        total: pings.length,
        recent: pings.slice(0, 20).map(p => ({
          receivedAt: toISOString(p.receivedAt),
          ipAddress: p.ipAddress,
        })),
      },
      incidents: {
        total: incidents.length,
        totalDowntime,
        averageDuration,
        recent: incidents.slice(0, 10).map(inc => ({
          id: inc.id,
          startedAt: toISOString(inc.startedAt),
          resolvedAt: toISOString(inc.resolvedAt),
          duration: inc.duration,
        })),
      },
      currentStatus: {
        status: monitor.status,
        lastPingAt: toISOString(monitor.lastPingAt),
        nextExpectedAt: toISOString(monitor.nextExpectedAt),
      },
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
