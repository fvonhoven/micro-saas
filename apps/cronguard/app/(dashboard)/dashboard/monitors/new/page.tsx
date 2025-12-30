'use client'

import { useState } from 'react'
import { Button } from '@repo/ui'
import { useRouter } from 'next/navigation'

export default function NewMonitorPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [expectedInterval, setExpectedInterval] = useState(3600) // 1 hour default
  const [gracePeriod, setGracePeriod] = useState(300) // 5 minutes default
  const [alertEmail, setAlertEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          expectedInterval,
          gracePeriod,
          alertEmail: alertEmail || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create monitor')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create monitor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">CronGuard</h1>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Create New Monitor</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monitor Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Daily backup job"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Expected Interval (seconds)
            </label>
            <input
              type="number"
              value={expectedInterval}
              onChange={(e) => setExpectedInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min={60}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              How often should this job check in? (e.g., 3600 = 1 hour)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Grace Period (seconds)
            </label>
            <input
              type="number"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min={0}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              How long to wait before marking as DOWN? (e.g., 300 = 5 minutes)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alert Email</label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Monitor'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

