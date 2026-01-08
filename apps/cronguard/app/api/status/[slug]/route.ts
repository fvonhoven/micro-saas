import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]
    const monitor = monitorDoc.data()

    // Check if status page is enabled
    if (!monitor.statusPageEnabled) {
      return NextResponse.json({ error: "Status page not enabled" }, { status: 404 })
    }

    // Get analytics data (last 30d and 90d uptime + recent incidents)
    const now = new Date()
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get creation date for clamping
    const createdAt = monitor.createdAt?.toDate ? monitor.createdAt.toDate() : new Date(monitor.createdAt)

    // Calculate uptime for 30d and 90d
    const calculateUptime = async (startDate: Date) => {
      const effectiveStart = createdAt > startDate ? createdAt : startDate
      const totalPeriod = now.getTime() - effectiveStart.getTime()

      // Get all incidents that overlap with this period
      const incidentsSnapshot = await monitorDoc.ref
        .collection("incidents")
        .where("startedAt", ">=", effectiveStart)
        .orderBy("startedAt", "asc")
        .get()

      // Merge overlapping incidents
      const periods: Array<{ start: number; end: number }> = []
      incidentsSnapshot.docs.forEach(doc => {
        const incident = doc.data()
        const start = incident.startedAt.toDate().getTime()
        const end = incident.resolvedAt ? incident.resolvedAt.toDate().getTime() : now.getTime()

        // Only include if it overlaps with our time window
        if (end >= effectiveStart.getTime() && start <= now.getTime()) {
          const clampedStart = Math.max(start, effectiveStart.getTime())
          const clampedEnd = Math.min(end, now.getTime())
          periods.push({ start: clampedStart, end: clampedEnd })
        }
      })

      // Sort and merge overlapping periods
      periods.sort((a, b) => a.start - b.start)
      const merged: Array<{ start: number; end: number }> = []
      for (const period of periods) {
        if (merged.length === 0) {
          merged.push(period)
        } else {
          const last = merged[merged.length - 1]
          if (period.start <= last.end) {
            // Overlapping, extend the last period
            last.end = Math.max(last.end, period.end)
          } else {
            // Non-overlapping, add new period
            merged.push(period)
          }
        }
      }

      // Calculate total downtime
      const totalDowntime = merged.reduce((sum, period) => sum + (period.end - period.start), 0)
      const uptime = totalPeriod > 0 ? ((totalPeriod - totalDowntime) / totalPeriod) * 100 : 100

      return {
        uptime,
        downtime: totalDowntime,
      }
    }

    const [uptime30d, uptime90d] = await Promise.all([calculateUptime(last30d), calculateUptime(last90d)])

    // Get recent incidents (last 30 days)
    const recentIncidentsSnapshot = await monitorDoc.ref
      .collection("incidents")
      .where("startedAt", ">=", last30d)
      .orderBy("startedAt", "desc")
      .limit(10)
      .get()

    const recentIncidents = recentIncidentsSnapshot.docs.map(doc => {
      const incident = doc.data()
      const startedAt = incident.startedAt.toDate()
      const resolvedAt = incident.resolvedAt ? incident.resolvedAt.toDate() : null
      const duration = resolvedAt ? resolvedAt.getTime() - startedAt.getTime() : now.getTime() - startedAt.getTime()

      return {
        id: doc.id,
        startedAt: startedAt.toISOString(),
        resolvedAt: resolvedAt ? resolvedAt.toISOString() : null,
        duration,
      }
    })

    // Return public data only
    return NextResponse.json({
      monitor: {
        name: monitor.name,
        status: monitor.status,
        lastPingAt: monitor.lastPingAt ? monitor.lastPingAt.toDate().toISOString() : null,
        createdAt: createdAt.toISOString(),
        statusPageTitle: monitor.statusPageTitle || null,
        statusPageDescription: monitor.statusPageDescription || null,
      },
      analytics: {
        uptime: {
          last30d: uptime30d,
          last90d: uptime90d,
        },
        incidents: {
          recent: recentIncidents,
        },
      },
    })
  } catch (error) {
    console.error("Status page error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

