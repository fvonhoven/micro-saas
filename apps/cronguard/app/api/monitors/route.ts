import { adminDb, adminAuth } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  expectedInterval: z.number().min(60).max(86400 * 7), // 1 min to 7 days
  gracePeriod: z.number().min(0).max(3600), // 0 to 1 hour
  alertEmail: z.string().email().optional(),
  alertSlack: z.string().url().optional(),
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

  const monitorsSnapshot = await adminDb
    .collection('monitors')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const monitors = monitorsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json({ monitors })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromSession(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createMonitorSchema.parse(body)

    // Generate unique slug
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

    const now = new Date()
    const nextExpectedAt = new Date(now.getTime() + data.expectedInterval * 1000)

    const monitorRef = await adminDb.collection('monitors').add({
      userId: user.uid,
      name: data.name,
      slug,
      expectedInterval: data.expectedInterval,
      gracePeriod: data.gracePeriod,
      status: 'PENDING',
      lastPingAt: null,
      nextExpectedAt,
      alertEmail: data.alertEmail || null,
      alertSlack: data.alertSlack || null,
      createdAt: now,
    })

    const monitor = await monitorRef.get()

    return NextResponse.json({
      monitor: { id: monitor.id, ...monitor.data() },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create monitor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

