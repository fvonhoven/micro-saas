import { adminAuth } from "@repo/firebase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authRateLimiter, getClientIp } from "@/lib/rate-limiter"

export async function POST(req: NextRequest) {
  // Rate limiting for auth attempts
  const clientIp = getClientIp(req)

  if (!authRateLimiter.check(clientIp)) {
    const resetTime = authRateLimiter.getResetTime(clientIp)
    const resetDate = resetTime ? new Date(resetTime) : new Date()

    return NextResponse.json(
      {
        error: "Too many authentication attempts. Please try again later.",
        resetAt: resetDate.toISOString(),
      },
      { status: 429 },
    )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = cookies()
  cookieStore.delete("session")
  return NextResponse.json({ success: true })
}
