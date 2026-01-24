import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/status-group/[slug]
 * Public API endpoint for status group data
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Find status group by slug
    const groupsSnapshot = await adminDb.collection("status_groups").where("slug", "==", slug).limit(1).get()

    if (groupsSnapshot.empty) {
      return NextResponse.json({ error: "Status group not found" }, { status: 404 })
    }

    const groupDoc = groupsSnapshot.docs[0]
    const group = groupDoc.data()

    // Check if status group is enabled
    if (!group.enabled) {
      return NextResponse.json({ error: "Status group not enabled" }, { status: 404 })
    }

    // Fetch all monitors in the group
    const monitorPromises = group.monitorIds.map((id: string) => adminDb.collection("monitors").doc(id).get())
    const monitorDocs = await Promise.all(monitorPromises)

    const now = new Date()
    const monitorsData = await Promise.all(
      monitorDocs.map(async monitorDoc => {
        if (!monitorDoc.exists) {
          return null
        }

        const monitor = monitorDoc.data()
        const createdAt = monitor?.createdAt?.toDate ? monitor.createdAt.toDate() : new Date(monitor?.createdAt)

        // Calculate 30-day uptime
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const effectiveStart = createdAt > last30d ? createdAt : last30d
        const totalPeriod = now.getTime() - effectiveStart.getTime()

        // Get incidents for uptime calculation
        const incidentsSnapshot = await monitorDoc.ref
          .collection("incidents")
          .where("startedAt", ">=", effectiveStart)
          .orderBy("startedAt", "asc")
          .get()

        // Calculate downtime
        const periods: Array<{ start: number; end: number }> = []
        incidentsSnapshot.docs.forEach((doc: any) => {
          const incident = doc.data()
          const start = incident.startedAt.toDate().getTime()
          const end = incident.resolvedAt ? incident.resolvedAt.toDate().getTime() : now.getTime()

          if (end >= effectiveStart.getTime() && start <= now.getTime()) {
            const clampedStart = Math.max(start, effectiveStart.getTime())
            const clampedEnd = Math.min(end, now.getTime())
            periods.push({ start: clampedStart, end: clampedEnd })
          }
        })

        // Merge overlapping periods
        periods.sort((a, b) => a.start - b.start)
        const merged: Array<{ start: number; end: number }> = []
        for (const period of periods) {
          if (merged.length === 0) {
            merged.push(period)
          } else {
            const last = merged[merged.length - 1]
            if (period.start <= last.end) {
              last.end = Math.max(last.end, period.end)
            } else {
              merged.push(period)
            }
          }
        }

        const totalDowntime = merged.reduce((sum, period) => sum + (period.end - period.start), 0)
        const uptime = totalPeriod > 0 ? ((totalPeriod - totalDowntime) / totalPeriod) * 100 : 100

        return {
          id: monitorDoc.id,
          name: monitor?.statusPageTitle || monitor?.name,
          description: monitor?.statusPageDescription || null,
          status: monitor?.status,
          lastPingAt: monitor?.lastPingAt ? monitor.lastPingAt.toDate().toISOString() : null,
          uptime30d: Math.round(uptime * 100) / 100,
        }
      }),
    )

    // Filter out null monitors (deleted monitors)
    const monitors = monitorsData.filter(m => m !== null)

    // Calculate overall system status
    let overallStatus = "operational"
    const downCount = monitors.filter(m => m.status === "DOWN").length
    const lateCount = monitors.filter(m => m.status === "LATE").length

    if (downCount > 0) {
      if (downCount === monitors.length) {
        overallStatus = "major_outage"
      } else {
        overallStatus = "partial_outage"
      }
    } else if (lateCount > 0) {
      overallStatus = "degraded_performance"
    }

    // Return public data
    return NextResponse.json(
      {
        group: {
          name: group.name,
          description: group.description || null,
          customTitle: group.customTitle || null,
          customDescription: group.customDescription || null,
        },
        overallStatus,
        monitors,
        stats: {
          total: monitors.length,
          operational: monitors.filter(m => m.status === "HEALTHY").length,
          degraded: lateCount,
          down: downCount,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=30, s-maxage=30, must-revalidate",
        },
      },
    )
  } catch (error) {
    console.error("Status group error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
