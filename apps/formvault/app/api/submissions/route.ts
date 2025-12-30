import { adminDb } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const createSubmissionSchema = z.object({
  token: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSubmissionSchema.parse(body)

    // Find access link by token
    const formsSnapshot = await adminDb.collection('forms').get()

    for (const formDoc of formsSnapshot.docs) {
      const accessLinksSnapshot = await formDoc.ref
        .collection('accessLinks')
        .where('token', '==', data.token)
        .limit(1)
        .get()

      if (!accessLinksSnapshot.empty) {
        const accessLinkDoc = accessLinksSnapshot.docs[0]!
        const accessLink = accessLinkDoc.data()

        // Validate
        if (new Date(accessLink.expiresAt.toDate()) < new Date()) {
          return NextResponse.json(
            { error: 'Link has expired' },
            { status: 403 }
          )
        }

        if (accessLink.useCount >= accessLink.maxUses) {
          return NextResponse.json(
            { error: 'Link has reached maximum uses' },
            { status: 403 }
          )
        }

        const submissionId = nanoid(16)
        const now = new Date()

        // Create submission
        await formDoc.ref.collection('submissions').doc(submissionId).set({
          accessLinkId: accessLinkDoc.id,
          clientName: accessLink.clientName,
          clientEmail: accessLink.clientEmail,
          files: [],
          submittedAt: now,
        })

        // Increment use count
        await accessLinkDoc.ref.update({
          useCount: accessLink.useCount + 1,
        })

        return NextResponse.json({ submissionId })
      }
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

