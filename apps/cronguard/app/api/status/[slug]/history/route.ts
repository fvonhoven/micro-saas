import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Get daily uptime history for the last 90 days
 * GET /api/status/[slug]/history
 */
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
      return NextResponse.json({ error: "Status page not enabled" }, { status: 403 })
    }

    const now = new Date()
    const last90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const createdAt = monitor.createdAt?.toDate ? monitor.createdAt.toDate() : new Date(monitor.createdAt)

    // Get all incidents in the last 90 days
    const incidentsSnapshot = await monitorDoc.ref
      .collection("incidents")
      .where("startedAt", ">=", last90d)
      .orderBy("startedAt", "asc")
      .get()

    const incidents = incidentsSnapshot.docs.map(doc => {
      const incident = doc.data()
      return {
        startedAt: incident.startedAt.toDate(),
        resolvedAt: incident.resolvedAt ? incident.resolvedAt.toDate() : null,
      }
    })

    // Calculate daily uptime for the last 90 days
    const dailyUptime: Array<{ date: string; uptime: number }> = []

    for (let i = 89; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0)
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999)

      // Skip days before monitor was created
      if (dayEnd < createdAt) {
        continue
      }

      // Clamp to monitor creation date
      const effectiveStart = dayStart < createdAt ? createdAt : dayStart
      const totalPeriod = dayEnd.getTime() - effectiveStart.getTime()

      // Calculate downtime for this day
      let downtime = 0

      for (const incident of incidents) {
        const incidentStart = incident.startedAt
        const incidentEnd = incident.resolvedAt || now

        // Check if incident overlaps with this day
        if (incidentEnd >= effectiveStart && incidentStart <= dayEnd) {
          const overlapStart = Math.max(incidentStart.getTime(), effectiveStart.getTime())
          const overlapEnd = Math.min(incidentEnd.getTime(), dayEnd.getTime())
          downtime += overlapEnd - overlapStart
        }
      }

      const uptime = totalPeriod > 0 ? ((totalPeriod - downtime) / totalPeriod) * 100 : 100

      dailyUptime.push({
        date: dayStart.toISOString().split("T")[0], // YYYY-MM-DD format
        uptime: Math.round(uptime * 100) / 100, // Round to 2 decimal places
      })
    }

    return NextResponse.json(
      { dailyUptime },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300, s-maxage=300", // Cache for 5 minutes
        },
      }
    )
  } catch (error) {
    console.error("History API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

