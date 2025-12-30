import { adminDb } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Find access link by token across all forms
    const formsSnapshot = await adminDb.collection('forms').get()

    for (const formDoc of formsSnapshot.docs) {
      const accessLinksSnapshot = await formDoc.ref
        .collection('accessLinks')
        .where('token', '==', token)
        .limit(1)
        .get()

      if (!accessLinksSnapshot.empty) {
        const accessLinkDoc = accessLinksSnapshot.docs[0]!
        const accessLink = accessLinkDoc.data()

        // Check if expired
        if (new Date(accessLink.expiresAt.toDate()) < new Date()) {
          return NextResponse.json(
            { error: 'Link has expired' },
            { status: 403 }
          )
        }

        // Check if max uses reached
        if (accessLink.useCount >= accessLink.maxUses) {
          return NextResponse.json(
            { error: 'Link has reached maximum uses' },
            { status: 403 }
          )
        }

        const form = formDoc.data()

        return NextResponse.json({
          form: {
            name: form.name,
            description: form.description,
            maxFileSize: form.maxFileSize,
          },
          accessLink: {
            clientName: accessLink.clientName,
            clientEmail: accessLink.clientEmail,
            expiresAt: accessLink.expiresAt.toDate(),
            maxUses: accessLink.maxUses,
            useCount: accessLink.useCount,
          },
        })
      }
    }

    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  } catch (error) {
    console.error('Validate token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

