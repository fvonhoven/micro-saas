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
          <div className="grid gap-4">
            {monitors.map(monitor => (
              <div key={monitor.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
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
                      <h3 className="text-lg font-semibold">{monitor.name}</h3>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Ping URL:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {typeof window !== "undefined" && window.location.origin}/api/ping/{monitor.slug}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(monitor.status)}`}>{monitor.status}</span>
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
