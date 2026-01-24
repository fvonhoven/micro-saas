import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Generate SVG badge for monitor status
 * Public endpoint - no authentication required
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(req.url)
    const style = searchParams.get("style") || "flat" // flat, flat-square, for-the-badge

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return generateBadge("monitor", "not found", "#9ca3af", style)
    }

    const monitor = monitorsSnapshot.docs[0].data()

    // Check if status page is enabled (badges only work if status page is public)
    if (!monitor.statusPageEnabled) {
      return generateBadge("monitor", "private", "#9ca3af", style)
    }

    // Generate badge based on status
    const { label, message, color } = getStatusBadgeData(monitor.status)

    return generateBadge(label, message, color, style)
  } catch (error) {
    console.error("Badge generation error:", error)
    return generateBadge("monitor", "error", "#9ca3af", "flat")
  }
}

/**
 * Get badge data based on monitor status
 */
function getStatusBadgeData(status: string): { label: string; message: string; color: string } {
  switch (status) {
    case "HEALTHY":
      return { label: "status", message: "healthy", color: "#10b981" } // green-500
    case "LATE":
      return { label: "status", message: "late", color: "#eab308" } // yellow-500
    case "DOWN":
      return { label: "status", message: "down", color: "#ef4444" } // red-500
    case "PAUSED":
      return { label: "status", message: "paused", color: "#6b7280" } // gray-500
    case "PENDING":
      return { label: "status", message: "pending", color: "#3b82f6" } // blue-500
    default:
      return { label: "status", message: "unknown", color: "#9ca3af" } // gray-400
  }
}

/**
 * Generate SVG badge
 */
function generateBadge(label: string, message: string, color: string, style: string): NextResponse {
  const labelWidth = measureText(label) + 20
  const messageWidth = measureText(message) + 20
  const totalWidth = labelWidth + messageWidth

  let svg: string

  if (style === "flat-square") {
    svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="0" fill="#fff"/>
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
  } else {
    // Default: flat style with rounded corners
    svg = `
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
  }

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, s-maxage=60", // Cache for 1 minute
      "Access-Control-Allow-Origin": "*", // Allow CORS for embedding
    },
  })
}

/**
 * Approximate text width calculation (rough estimate)
 */
function measureText(text: string): number {
  // Average character width is ~7px for 11px font
  return text.length * 7
}

