import { adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { withRateLimit } from "../../../../lib/with-rate-limit"
import { resetRateLimit } from "../../../../lib/rate-limiter-ip"

export async function POST(req: NextRequest) {
  // Check rate limit
  const rateLimitResult = await withRateLimit(req, "auth:login")
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  try {
    const { idToken } = await req.json()

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 })
    }

    // Verify the ID token and create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    // Set the session cookie
    const cookieStore = cookies()
    cookieStore.set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    })

    // Reset rate limit on successful auth
    await resetRateLimit(rateLimitResult.ip, "auth:login")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Session] Creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete("session")
  return NextResponse.json({ success: true })
}
