import { adminDb } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // Find monitor by slug
    const monitorsSnapshot = await adminDb.collection("monitors").where("slug", "==", slug).limit(1).get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]!
    const monitor = monitorDoc.data()

    // If paused, acknowledge but don't update
    if (monitor.status === "PAUSED") {
      return NextResponse.json({ status: "paused" })
    }

    const now = new Date()
    const nextExpectedAt = new Date(now.getTime() + monitor.expectedInterval * 1000)
    const wasDown = monitor.status === "DOWN" || monitor.status === "LATE"

    // Update monitor and create ping record in a batch
    const batch = adminDb.batch()

    batch.update(monitorDoc.ref, {
      lastPingAt: now,
      nextExpectedAt: nextExpectedAt,
      status: "HEALTHY",
    })

    batch.create(monitorDoc.ref.collection("pings").doc(), {
      receivedAt: now,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      userAgent: req.headers.get("user-agent"),
    })

    await batch.commit()

    // Send recovery email if monitor was down
    if (wasDown && monitor.alertEmail && resend) {
      try {
        // Find the most recent unresolved incident
        const incidentsSnapshot = await monitorDoc.ref
          .collection("incidents")
          .where("resolvedAt", "==", null)
          .orderBy("startedAt", "desc")
          .limit(1)
          .get()

        if (!incidentsSnapshot.empty) {
          const incidentDoc = incidentsSnapshot.docs[0]!
          const incident = incidentDoc.data()

          // Mark incident as resolved
          await incidentDoc.ref.update({
            resolvedAt: now,
            duration: now.getTime() - incident.startedAt.toDate().getTime(),
          })

          // Send recovery email
          await resend.emails.send({
            from: "CronGuard <alerts@cronguard.com>",
            to: monitor.alertEmail,
            subject: `✅ Monitor Recovered: ${monitor.name}`,
            html: `
              <h1>Monitor Recovered</h1>
              <p>Your monitor <strong>${monitor.name}</strong> has recovered and is now HEALTHY.</p>
              <p>Downtime: ${Math.round((now.getTime() - incident.startedAt.toDate().getTime()) / 1000 / 60)} minutes</p>
              <p>Recovered at: ${now.toLocaleString()}</p>
            `,
          })
        }
      } catch (emailError) {
        console.error(`Failed to send recovery email for ${monitor.name}:`, emailError)
      }
    }

    return NextResponse.json({
      status: "ok",
      next: nextExpectedAt.toISOString(),
    })
  } catch (error) {
    console.error("Ping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Support GET requests too for easier testing
export const GET = POST
