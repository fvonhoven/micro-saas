import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Generate SVG badge for monitor uptime percentage
 * Public endpoint - no authentication required
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(req.url)
    const style = searchParams.get("style") || "flat"
    const period = searchParams.get("period") || "30d" // 30d or 90d

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return generateBadge("uptime", "not found", "#9ca3af", style)
    }

    const monitorDoc = monitorsSnapshot.docs[0]
    const monitor = monitorDoc.data()

    // Check if status page is enabled
    if (!monitor.statusPageEnabled) {
      return generateBadge("uptime", "private", "#9ca3af", style)
    }

    // Calculate uptime
    const now = new Date()
    const periodDays = period === "90d" ? 90 : 30
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Get creation date for clamping
    const createdAt = monitor.createdAt?.toDate ? monitor.createdAt.toDate() : new Date(monitor.createdAt)
    const clampedStart = startDate < createdAt ? createdAt : startDate

    const uptime = await calculateUptime(monitorDoc.ref, clampedStart, now)

    // Generate badge
    const uptimePercent = uptime.uptime.toFixed(2)
    const color = getUptimeColor(uptime.uptime)

    return generateBadge("uptime", `${uptimePercent}%`, color, style)
  } catch (error) {
    console.error("Uptime badge generation error:", error)
    return generateBadge("uptime", "error", "#9ca3af", "flat")
  }
}

/**
 * Calculate uptime percentage for a time period
 */
async function calculateUptime(
  monitorRef: FirebaseFirestore.DocumentReference,
  startDate: Date,
  endDate: Date
): Promise<{ uptime: number; downtime: number }> {
  const incidentsSnapshot = await monitorRef
    .collection("incidents")
    .where("startedAt", ">=", startDate)
    .orderBy("startedAt", "asc")
    .get()

  const totalPeriod = endDate.getTime() - startDate.getTime()

  if (incidentsSnapshot.empty) {
    return { uptime: 100, downtime: 0 }
  }

  // Calculate downtime periods
  const periods: Array<{ start: number; end: number }> = []

  for (const doc of incidentsSnapshot.docs) {
    const incident = doc.data()
    const startedAt = incident.startedAt.toDate()
    const resolvedAt = incident.resolvedAt ? incident.resolvedAt.toDate() : endDate

    const start = Math.max(startedAt.getTime(), startDate.getTime())
    const end = Math.min(resolvedAt.getTime(), endDate.getTime())

    if (start < end) {
      periods.push({ start, end })
    }
  }

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

  // Calculate total downtime
  const totalDowntime = merged.reduce((sum, period) => sum + (period.end - period.start), 0)
  const uptime = totalPeriod > 0 ? ((totalPeriod - totalDowntime) / totalPeriod) * 100 : 100

  return { uptime, downtime: totalDowntime }
}

/**
 * Get color based on uptime percentage
 */
function getUptimeColor(uptime: number): string {
  if (uptime >= 99.9) return "#10b981" // green-500
  if (uptime >= 99.0) return "#eab308" // yellow-500
  if (uptime >= 95.0) return "#f97316" // orange-500
  return "#ef4444" // red-500
}

/**
 * Generate SVG badge
 */
function generateBadge(label: string, message: string, color: string, style: string): NextResponse {
  const labelWidth = measureText(label) + 20
  const messageWidth = measureText(message) + 20
  const totalWidth = labelWidth + messageWidth

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${messageWidth}v20H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="13">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="13">${message}</text>
  </g>
</svg>
  `.trim()

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300", // Cache for 5 minutes
      "Access-Control-Allow-Origin": "*",
    },
  })
}

function measureText(text: string): number {
  return text.length * 7
}

