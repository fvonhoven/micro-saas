import { adminDb, adminAuth } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
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

  const keysSnapshot = await adminDb
    .collection('apiKeys')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const keys = keysSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      key: data.key.substring(0, 8) + '...' + data.key.substring(data.key.length - 4), // Masked
      lastUsedAt: data.lastUsedAt,
      createdAt: data.createdAt,
    }
  })

  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createKeySchema.parse(body)

    const apiKey = `ss_${nanoid(32)}`
    const now = new Date()

    const keyRef = await adminDb.collection('apiKeys').add({
      userId: user.uid,
      name: data.name,
      key: apiKey,
      lastUsedAt: null,
      createdAt: now,
    })

    const keyDoc = await keyRef.get()

    return NextResponse.json({
      key: {
        id: keyDoc.id,
        name: data.name,
        key: apiKey, // Only shown once
        createdAt: now,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
    }

    const keyDoc = await adminDb.collection('apiKeys').doc(keyId).get()

    if (!keyDoc.exists || keyDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    await keyDoc.ref.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API key error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

