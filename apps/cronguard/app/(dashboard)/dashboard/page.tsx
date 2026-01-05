"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@repo/firebase/client"

const MINUTE_OPTIONS = [1, 2, 5, 10, 15, 30, 60]

interface Monitor {
  id: string
  name: string
  slug: string
  status: string
  expectedInterval: number
  gracePeriod?: number
  alertEmail?: string
  lastPingAt: any
  nextExpectedAt?: any
}

// Helper function to convert Firestore timestamp to Date
function toDate(timestamp: any): Date | null {
  if (!timestamp) return null

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp

  // If it has a toDate method (Firestore Timestamp)
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate()
  }

  // If it has seconds property (serialized Firestore Timestamp)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000)
  }

  // If it's a string or number
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    return new Date(timestamp)
  }

  return null
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loadingMonitors, setLoadingMonitors] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    intervalMinutes: 60 as number | "custom",
    customInterval: "",
    gracePeriodMinutes: 5 as number | "custom",
    customGracePeriod: "",
    alertEmail: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMonitors()
    }
  }, [user])

  const fetchMonitors = async () => {
    try {
      const response = await fetch("/api/monitors")
      const data = await response.json()
      setMonitors(data.monitors || [])
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setLoadingMonitors(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Delete session cookie
      await fetch("/api/auth/session", { method: "DELETE" })
      // Sign out from Firebase
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return

    try {
      await fetch(`/api/monitors/${id}`, { method: "DELETE" })
      setMonitors(monitors.filter(m => m.id !== id))
      setOpenMenuId(null)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Failed to delete monitor")
    }
  }

  const handleTogglePause = async (monitor: Monitor) => {
    try {
      const newStatus = monitor.status === "PAUSED" ? "HEALTHY" : "PAUSED"
      await fetch(`/api/monitors/${monitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      setMonitors(monitors.map(m => (m.id === monitor.id ? { ...m, status: newStatus } : m)))
      setOpenMenuId(null)
    } catch (error) {
      console.error("Toggle pause error:", error)
      alert("Failed to update monitor")
    }
  }

  const handleStartRename = (monitor: Monitor) => {
    setEditingId(monitor.id)
    setEditName(monitor.name)
    setOpenMenuId(null)
  }

  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) return

    try {
      await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      })
      setMonitors(monitors.map(m => (m.id === id ? { ...m, name: editName } : m)))
      setEditingId(null)
    } catch (error) {
      console.error("Rename error:", error)
      alert("Failed to rename monitor")
    }
  }

  const handleOpenEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor)

    // Convert seconds to minutes for display
    const intervalMinutes = monitor.expectedInterval / 60
    const gracePeriodMinutes = (monitor.gracePeriod || 300) / 60

    // Check if it's a preset value or custom
    const isIntervalPreset = MINUTE_OPTIONS.includes(intervalMinutes)
    const isGracePeriodPreset = MINUTE_OPTIONS.includes(gracePeriodMinutes)

    setEditForm({
      name: monitor.name,
      intervalMinutes: isIntervalPreset ? intervalMinutes : "custom",
      customInterval: isIntervalPreset ? "" : String(intervalMinutes),
      gracePeriodMinutes: isGracePeriodPreset ? gracePeriodMinutes : "custom",
      customGracePeriod: isGracePeriodPreset ? "" : String(gracePeriodMinutes),
      alertEmail: monitor.alertEmail || "",
    })
    setEditModalOpen(true)
    setOpenMenuId(null)
  }

  const handleSaveEdit = async () => {
    if (!editingMonitor || !editForm.name.trim()) return

    try {
      // Convert minutes to seconds
      const expectedInterval = editForm.intervalMinutes === "custom" ? Number(editForm.customInterval) * 60 : editForm.intervalMinutes * 60

      const gracePeriod = editForm.gracePeriodMinutes === "custom" ? Number(editForm.customGracePeriod) * 60 : editForm.gracePeriodMinutes * 60

      await fetch(`/api/monitors/${editingMonitor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          expectedInterval,
          gracePeriod,
          alertEmail: editForm.alertEmail,
        }),
      })
      setMonitors(
        monitors.map(m =>
          m.id === editingMonitor.id ? { ...m, name: editForm.name, expectedInterval, gracePeriod, alertEmail: editForm.alertEmail } : m,
        ),
      )
      setEditModalOpen(false)
      setEditingMonitor(null)
    } catch (error) {
      console.error("Edit error:", error)
      alert("Failed to update monitor")
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "bg-green-100 text-green-800"
      case "LATE":
        return "bg-yellow-100 text-yellow-800"
      case "DOWN":
        return "bg-red-100 text-red-800"
      case "PAUSED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">CronGuard</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link href="/dashboard/monitors/new">
              <Button>New Monitor</Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
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
          <div className="grid gap-6">
            {monitors.map(monitor => (
              <div key={monitor.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {editingId === monitor.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="px-3 py-1 border rounded"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter") handleSaveRename(monitor.id)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                        />
                        <Button size="sm" onClick={() => handleSaveRename(monitor.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{monitor.name}</h3>

                        {/* Monitor Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {/* Interval & Grace */}
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-500">Interval</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {monitor.expectedInterval >= 60 ? `${monitor.expectedInterval / 60} min` : `${monitor.expectedInterval} sec`}
                              </p>
                            </div>
                            <div className="mx-2 text-gray-300">•</div>
                            <div>
                              <p className="text-xs text-gray-500">Grace</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {monitor.gracePeriod >= 60 ? `${monitor.gracePeriod / 60} min` : `${monitor.gracePeriod} sec`}
                              </p>
                            </div>
                          </div>

                          {/* Alert Email */}
                          {monitor.alertEmail && (
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Alert Email</p>
                                <p className="text-sm font-semibold text-gray-900">{monitor.alertEmail}</p>
                              </div>
                            </div>
                          )}

                          {/* Last Ping */}
                          {monitor.lastPingAt && toDate(monitor.lastPingAt) && (
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Last Ping</p>
                                <p className="text-sm font-semibold text-gray-900">{toDate(monitor.lastPingAt)!.toLocaleString()}</p>
                              </div>
                            </div>
                          )}

                          {/* Next Expected */}
                          {monitor.nextExpectedAt && toDate(monitor.nextExpectedAt) && (
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Next Expected</p>
                                <p className="text-sm font-semibold text-gray-900">{toDate(monitor.nextExpectedAt)!.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Ping URL */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 mb-1">Ping URL</p>
                              <code className="block bg-white px-3 py-2 rounded border border-gray-300 text-xs text-gray-800 font-mono break-all">
                                {typeof window !== "undefined" && window.location.origin}/api/ping/{monitor.slug}
                              </code>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/api/ping/${monitor.slug}`)
                                  setCopiedId(monitor.id)
                                  setTimeout(() => setCopiedId(null), 2000)
                                }}
                                className="flex-shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Copy to clipboard"
                              >
                                {copiedId === monitor.id ? (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                              </button>
                              {copiedId === monitor.id && (
                                <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap animate-fade-in">
                                  Copied to clipboard!
                                  <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusColor(monitor.status)}`}>{monitor.status}</span>
                    <div className="relative">
                      <button onClick={() => setOpenMenuId(openMenuId === monitor.id ? null : monitor.id)} className="p-2 hover:bg-gray-100 rounded">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === monitor.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                            <button
                              onClick={() => handleOpenEdit(monitor)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span>📝</span> Edit
                            </button>
                            <button
                              onClick={() => handleStartRename(monitor)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span>✏️</span> Rename
                            </button>
                            <button
                              onClick={() => handleTogglePause(monitor)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span>{monitor.status === "PAUSED" ? "▶️" : "⏸️"}</span>
                              {monitor.status === "PAUSED" ? "Resume" : "Pause"}
                            </button>
                            <button
                              onClick={() => handleDelete(monitor.id)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                            >
                              <span>🗑️</span> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingMonitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Monitor</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monitor Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Daily backup job"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expected Interval (minutes)</label>
                  <select
                    value={editForm.intervalMinutes}
                    onChange={e => setEditForm({ ...editForm, intervalMinutes: e.target.value === "custom" ? "custom" : Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {MINUTE_OPTIONS.map(min => (
                      <option key={min} value={min}>
                        {min} {min === 1 ? "minute" : "minutes"}
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                  {editForm.intervalMinutes === "custom" && (
                    <input
                      type="number"
                      value={editForm.customInterval}
                      onChange={e => setEditForm({ ...editForm, customInterval: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md mt-2"
                      placeholder="Enter minutes"
                      min={1}
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">How often should this job check in?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Grace Period (minutes)</label>
                  <select
                    value={editForm.gracePeriodMinutes}
                    onChange={e => setEditForm({ ...editForm, gracePeriodMinutes: e.target.value === "custom" ? "custom" : Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {MINUTE_OPTIONS.map(min => (
                      <option key={min} value={min}>
                        {min} {min === 1 ? "minute" : "minutes"}
                      </option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                  {editForm.gracePeriodMinutes === "custom" && (
                    <input
                      type="number"
                      value={editForm.customGracePeriod}
                      onChange={e => setEditForm({ ...editForm, customGracePeriod: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md mt-2"
                      placeholder="Enter minutes"
                      min={0}
                    />
                  )}
                  <p className="text-sm text-gray-600 mt-1">How long to wait before marking as DOWN?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Alert Email</label>
                  <input
                    type="email"
                    value={editForm.alertEmail}
                    onChange={e => setEditForm({ ...editForm, alertEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSaveEdit}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditModalOpen(false)
                      setEditingMonitor(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
