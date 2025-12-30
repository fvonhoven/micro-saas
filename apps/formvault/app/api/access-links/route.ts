import { adminDb, adminAuth } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'
import { resend } from '@repo/email'

const createAccessLinkSchema = z.object({
  formId: z.string(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  expiresInDays: z.number().min(1).max(30),
  maxUses: z.number().min(1).max(100).optional(),
})

async function getUserFromSession(req: NextRequest) {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createAccessLinkSchema.parse(body)

    // Verify form ownership
    const formDoc = await adminDb.collection('forms').doc(data.formId).get()
    if (!formDoc.exists || formDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const form = formDoc.data()!
    const token = nanoid(32)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000)

    const accessLinkRef = await adminDb
      .collection('forms')
      .doc(data.formId)
      .collection('accessLinks')
      .add({
        token,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        expiresAt,
        maxUses: data.maxUses || 1,
        useCount: 0,
        createdAt: now,
      })

    // Send email with magic link
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/submit/${token}`

    await resend.emails.send({
      from: 'FormVault <uploads@formvault.com>',
      to: data.clientEmail,
      subject: `Upload documents to ${form.name}`,
      html: `
        <h1>Document Upload Request</h1>
        <p>Hi ${data.clientName},</p>
        <p>You've been invited to upload documents to <strong>${form.name}</strong>.</p>
        <p><a href="${uploadUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Upload Documents</a></p>
        <p>Or copy this link: ${uploadUrl}</p>
        <p>This link expires on ${expiresAt.toLocaleString()}</p>
        ${form.description ? `<p>${form.description}</p>` : ''}
      `,
    })

    const accessLink = await accessLinkRef.get()

    return NextResponse.json({
      accessLink: { id: accessLink.id, ...accessLink.data() },
      uploadUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create access link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

