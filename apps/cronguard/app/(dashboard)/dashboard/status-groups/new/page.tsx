"use client"

import { useAuthContext } from "@repo/auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Monitor {
  id: string
  name: string
  status: string
}

export default function NewStatusGroupPage() {
  const { user, loading: authLoading } = useAuthContext()
  const router = useRouter()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([])

  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    } else if (user) {
      fetchMonitors()
    }
  }, [user, authLoading, router])

  const fetchMonitors = async () => {
    try {
      const response = await fetch("/api/monitors")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data.monitors)
      }
    } catch (error) {
      console.error("Error fetching monitors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedMonitorIds.length === 0) {
      alert("Please select at least one monitor")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/status-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          customTitle: customTitle || undefined,
          customDescription: customDescription || undefined,
          enabled,
          monitorIds: selectedMonitorIds,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/status-groups")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create status group")
      }
    } catch (error) {
      console.error("Error creating status group:", error)
      alert("Failed to create status group")
    } finally {
      setCreating(false)
    }
  }

  const toggleMonitor = (id: string) => {
    if (selectedMonitorIds.includes(id)) {
      setSelectedMonitorIds(selectedMonitorIds.filter(mid => mid !== id))
    } else {
      setSelectedMonitorIds([...selectedMonitorIds, id])
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Status Group</h1>
        <p className="mt-2 text-gray-600">Group multiple monitors into a single public status page</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Production Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="All production infrastructure and services"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                Enable public status page
              </label>
            </div>
          </div>
        </div>

        {/* Customization */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customization (Optional)</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Page Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty to use group name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Page Description</label>
              <textarea
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty to use group description"
              />
            </div>
          </div>
        </div>

        {/* Monitor Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Monitors *</h2>

          {monitors.length === 0 ? (
            <p className="text-gray-600">No monitors available. Create a monitor first.</p>
          ) : (
            <div className="space-y-2">
              {monitors.map(monitor => (
                <label key={monitor.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMonitorIds.includes(monitor.id)}
                    onChange={() => toggleMonitor(monitor.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">{monitor.name}</span>
                  <span
                    className={`ml-auto text-xs px-2 py-1 rounded ${monitor.status === "HEALTHY" ? "bg-green-100 text-green-800" : monitor.status === "LATE" ? "bg-yellow-100 text-yellow-800" : monitor.status === "DOWN" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {monitor.status}
                  </span>
                </label>
              ))}
            </div>
          )}

          {selectedMonitorIds.length > 0 && <p className="mt-4 text-sm text-gray-600">{selectedMonitorIds.length} monitor(s) selected</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating || selectedMonitorIds.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Status Group"}
          </button>
        </div>
      </form>
    </div>
  )
}
