'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@repo/auth'
import { Button } from '@repo/ui'
import { useRouter } from 'next/navigation'

interface ApiKey {
  id: string
  name: string
  key: string
  lastUsedAt: any
  createdAt: any
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchKeys()
    }
  }, [user])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys')
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      })
      const data = await response.json()
      setCreatedKey(data.key.key)
      setNewKeyName('')
      setShowNewKey(false)
      fetchKeys()
    } catch (error) {
      console.error('Failed to create key:', error)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return

    try {
      await fetch(`/api/keys?id=${keyId}`, { method: 'DELETE' })
      fetchKeys()
    } catch (error) {
      console.error('Failed to delete key:', error)
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">SnipShot</h1>
          <Button onClick={() => setShowNewKey(true)}>New API Key</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your API Keys</h2>

        {createdKey && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">API Key Created!</h3>
            <p className="text-sm text-gray-600 mb-2">
              Save this key now - it won't be shown again.
            </p>
            <code className="bg-white px-3 py-2 rounded border block">
              {createdKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(createdKey)
                alert('Copied to clipboard!')
              }}
            >
              Copy to Clipboard
            </Button>
          </div>
        )}

        {showNewKey && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Production API"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Key</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewKey(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {loadingKeys ? (
          <p>Loading keys...</p>
        ) : keys.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 mb-4">You don't have any API keys yet.</p>
            <Button onClick={() => setShowNewKey(true)}>Create Your First API Key</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <div key={key.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{key.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Key: <code className="bg-gray-100 px-2 py-1 rounded">{key.key}</code>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Created: {new Date(key.createdAt.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

