import { cookies } from 'next/headers'
import { adminAuth } from '@repo/firebase/admin'

export async function getServerUser() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    const user = await adminAuth.getUser(decodedClaims.uid)
    return user
  } catch (error) {
    return null
  }
}

export async function requireServerUser() {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

