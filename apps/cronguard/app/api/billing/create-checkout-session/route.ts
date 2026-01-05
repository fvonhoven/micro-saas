import { adminAuth } from "@repo/firebase/admin"
import { createCheckoutSession, PLANS } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"

const createCheckoutSchema = z.object({
  planId: z.enum(["starter", "pro", "team"]),
  billingCycle: z.enum(["monthly", "annual"]),
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

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createCheckoutSchema.parse(body)

    // Get the price ID from the plan configuration
    const plan = PLANS.cronguard[data.planId]
    if (!plan || !("monthlyPriceId" in plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = data.billingCycle === "monthly" ? plan.monthlyPriceId : plan.annualPriceId

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "http://localhost:3000"

    const session = await createCheckoutSession({
      priceId,
      userId: user.uid,
      userEmail: user.email || "",
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Create checkout session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
