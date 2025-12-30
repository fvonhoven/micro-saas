import { adminDb } from '@repo/firebase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Find monitor by slug
    const monitorsSnapshot = await adminDb
      .collection('monitors')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (monitorsSnapshot.empty) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
    }

    const monitorDoc = monitorsSnapshot.docs[0]!
    const monitor = monitorDoc.data()

    // If paused, acknowledge but don't update
    if (monitor.status === 'PAUSED') {
      return NextResponse.json({ status: 'paused' })
    }

    const now = new Date()
    const nextExpectedAt = new Date(
      now.getTime() + monitor.expectedInterval * 1000
    )

    // Update monitor and create ping record in a batch
    const batch = adminDb.batch()

    batch.update(monitorDoc.ref, {
      lastPingAt: now,
      nextExpectedAt: nextExpectedAt,
      status: 'HEALTHY',
    })

    batch.create(monitorDoc.ref.collection('pings').doc(), {
      receivedAt: now,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
    })

    await batch.commit()

    return NextResponse.json({
      status: 'ok',
      next: nextExpectedAt.toISOString(),
    })
  } catch (error) {
    console.error('Ping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Support GET requests too for easier testing
export const GET = POST

