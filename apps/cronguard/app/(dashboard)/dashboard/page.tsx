'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@repo/auth'
import { Button } from '@repo/ui'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Monitor {
  id: string
  name: string
  slug: string
  status: string
  expectedInterval: number
  lastPingAt: any
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loadingMonitors, setLoadingMonitors] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMonitors()
    }
  }, [user])

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/monitors')
      const data = await response.json()
      setMonitors(data.monitors || [])
    } catch (error) {
      console.error('Failed to fetch monitors:', error)
    } finally {
      setLoadingMonitors(false)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-green-100 text-green-800'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'DOWN':
        return 'bg-red-100 text-red-800'
      case 'PAUSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">CronGuard</h1>
          <div className="flex gap-4">
            <Link href="/dashboard/monitors/new">
              <Button>New Monitor</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Monitors</h2>

        {loadingMonitors ? (
          <p>Loading monitors...</p>
        ) : monitors.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 mb-4">You don't have any monitors yet.</p>
            <Link href="/dashboard/monitors/new">
              <Button>Create Your First Monitor</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {monitors.map((monitor) => (
              <div key={monitor.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{monitor.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ping URL: <code className="bg-gray-100 px-2 py-1 rounded">
                        {typeof window !== 'undefined' && window.location.origin}/api/ping/{monitor.slug}
                      </code>
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitor.status)}`}>
                    {monitor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

