import { adminDb, adminStorage } from "@repo/firebase/admin"
import { getUserPlan } from "@repo/billing"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
})

async function takeScreenshot(url: string): Promise<Buffer> {
  // Use Browserless API for screenshots
  const response = await fetch(`https://chrome.browserless.io/screenshot?token=${process.env.BROWSERLESS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      options: {
        fullPage: false,
        type: "png",
      },
    }),
  })

  if (!response.ok) {
    throw new Error("Screenshot failed")
  }

  return Buffer.from(await response.arrayBuffer())
}

export async function GET(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 })
    }

    const keysSnapshot = await adminDb.collection("apiKeys").where("key", "==", apiKey).limit(1).get()

    if (keysSnapshot.empty) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const keyDoc = keysSnapshot.docs[0]!
    const keyData = keyDoc.data()
    const userId = keyData.userId

    // Check plan limits
    const userDoc = await adminDb.collection("users").doc(userId).get()
    const userData = userDoc.data()
    const currentPlan = getUserPlan("snipshot", {
      stripePriceId: userData?.stripePriceId,
      stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
    })

    // Calculate current month's usage
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let monthlyUsage = 0
    const usageSnapshot = await keyDoc.ref.collection("usage").get()

    for (const usageDoc of usageSnapshot.docs) {
      const usageDate = new Date(usageDoc.id)
      if (usageDate >= monthStart && usageDate <= monthEnd) {
        monthlyUsage += usageDoc.data().screenshots || 0
      }
    }

    // Check if user has reached their limit
    if (monthlyUsage >= currentPlan.limits.screenshots) {
      return NextResponse.json(
        {
          error: "Screenshot limit reached",
          message: `Your ${currentPlan.name} plan allows ${currentPlan.limits.screenshots} screenshots per month. Upgrade to capture more.`,
          limit: currentPlan.limits.screenshots,
          current: monthlyUsage,
        },
        { status: 403 },
      )
    }

    // Rate limiting
    const { success } = await ratelimit.limit(apiKey)
    if (!success) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }

    // Get URL parameter
    const url = new URL(req.url).searchParams.get("url")
    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    // Generate cache key
    const cacheKey = crypto.createHash("sha256").update(url).digest("hex")

    // Check cache
    const cachedSnapshot = await adminDb.collection("screenshots").where("cacheKey", "==", cacheKey).limit(1).get()

    if (!cachedSnapshot.empty) {
      const cached = cachedSnapshot.docs[0]!.data()

      // Update last used
      await keyDoc.ref.update({ lastUsedAt: new Date() })

      return NextResponse.json({
        url: cached.cdnUrl,
        cached: true,
      })
    }

    // Take screenshot
    const screenshot = await takeScreenshot(url)

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket()
    const filename = `screenshots/${cacheKey}.png`
    const file = bucket.file(filename)

    await file.save(screenshot, {
      metadata: {
        contentType: "image/png",
      },
    })

    // Make public
    await file.makePublic()
    const cdnUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`

    // Save to Firestore
    await adminDb.collection("screenshots").add({
      apiKeyId: keyDoc.id,
      url,
      cacheKey,
      cdnUrl,
      status: "completed",
      createdAt: new Date(),
    })

    // Update usage stats
    const today = new Date().toISOString().split("T")[0]!
    const usageRef = keyDoc.ref.collection("usage").doc(today)
    const usageDoc = await usageRef.get()

    if (usageDoc.exists) {
      await usageRef.update({
        screenshots: (usageDoc.data()?.screenshots || 0) + 1,
      })
    } else {
      await usageRef.set({ screenshots: 1 })
    }

    // Update last used
    await keyDoc.ref.update({ lastUsedAt: new Date() })

    return NextResponse.json({
      url: cdnUrl,
      cached: false,
    })
  } catch (error) {
    console.error("Screenshot error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
