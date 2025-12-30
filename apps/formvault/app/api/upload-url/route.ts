import { adminStorage } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const uploadUrlSchema = z.object({
  filename: z.string(),
  submissionId: z.string(),
  contentType: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = uploadUrlSchema.parse(body)

    const bucket = adminStorage.bucket()
    const path = `submissions/${data.submissionId}/${Date.now()}-${data.filename}`
    const file = bucket.file(path)

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: data.contentType,
    })

    return NextResponse.json({ uploadUrl: url, path })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Upload URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

