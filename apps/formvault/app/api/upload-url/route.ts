import { adminStorage, adminDb } from "@repo/firebase/admin"
import { getUserPlan } from "@repo/billing"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const uploadUrlSchema = z.object({
  filename: z.string(),
  submissionId: z.string(),
  contentType: z.string(),
  fileSize: z.number(), // in bytes
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = uploadUrlSchema.parse(body)

    // Find the form owner from the submission
    const formsSnapshot = await adminDb.collection("forms").get()
    let userId: string | null = null

    for (const formDoc of formsSnapshot.docs) {
      const submissionDoc = await formDoc.ref.collection("submissions").doc(data.submissionId).get()

      if (submissionDoc.exists) {
        userId = formDoc.data().userId
        break
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check storage limits
    const userDoc = await adminDb.collection("users").doc(userId).get()
    const userData = userDoc.data()
    const currentPlan = getUserPlan("formvault", {
      stripePriceId: userData?.stripePriceId,
      stripeCurrentPeriodEnd: userData?.stripeCurrentPeriodEnd,
    })

    // Calculate current storage usage
    const bucket = adminStorage.bucket()
    const [files] = await bucket.getFiles({ prefix: `submissions/` })

    let totalBytes = 0
    for (const file of files) {
      const [metadata] = await file.getMetadata()
      if (metadata.name?.includes(userId)) {
        const size = typeof metadata.size === "string" ? metadata.size : String(metadata.size || 0)
        totalBytes += parseInt(size)
      }
    }

    const currentGB = totalBytes / (1024 * 1024 * 1024)
    const newFileGB = data.fileSize / (1024 * 1024 * 1024)

    if (currentGB + newFileGB > currentPlan.limits.storageGB) {
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `Your ${currentPlan.name} plan allows ${currentPlan.limits.storageGB}GB storage. Upgrade to upload more files.`,
          limit: currentPlan.limits.storageGB,
          current: currentGB,
        },
        { status: 403 },
      )
    }

    const path = `submissions/${data.submissionId}/${Date.now()}-${data.filename}`
    const file = bucket.file(path)

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: data.contentType,
    })

    return NextResponse.json({ uploadUrl: url, path })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("Upload URL error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
