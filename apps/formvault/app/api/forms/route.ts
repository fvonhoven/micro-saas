import { adminDb, adminAuth } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

const createFormSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxFileSize: z.number().min(1).max(100), // MB
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

export async function GET(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formsSnapshot = await adminDb
    .collection('forms')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const forms = formsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json({ forms })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createFormSchema.parse(body)

    const slug = nanoid(10)
    const now = new Date()

    const formRef = await adminDb.collection('forms').add({
      userId: user.uid,
      name: data.name,
      slug,
      description: data.description || '',
      maxFileSize: data.maxFileSize,
      status: 'ACTIVE',
      createdAt: now,
    })

    const form = await formRef.get()

    return NextResponse.json({
      form: { id: form.id, ...form.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create form error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

