"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@repo/firebase/client"
import { UsageWarningBanner } from "../../../components/UsageWarningBanner"
import { UpgradeModal } from "../../../components/UpgradeModal"
import { TeamSelector } from "../../../components/TeamSelector"
import { PaymentWarningBanner } from "../../../components/PaymentWarningBanner"
import { EmailVerificationBanner } from "../../../components/EmailVerificationBanner"

const MINUTE_OPTIONS = [1, 2, 5, 10, 15, 30, 60]

const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
]

interface Monitor {
  id: string
  name: string
  slug: string
  status: string
  expectedInterval: number
  gracePeriod?: number
  alertEmail?: string
  timezone?: string
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
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedMonitors, setSelectedMonitors] = useState<Set<string>>(new Set())
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [monitorUsage, setMonitorUsage] = useState<any>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState<{
    type: "personal" | "team"
    teamId?: string
    teamName?: string
  }>({ type: "personal" })
  const [paymentStatus, setPaymentStatus] = useState<"active" | "past_due" | "canceled" | null>(null)
  const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState<Date | null>(null)
  const [emailVerified, setEmailVerified] = useState(true) // Default to true to avoid flash
  const [editForm, setEditForm] = useState({
    name: "",
    intervalMinutes: 1 as number | "custom",
    customInterval: "",
    gracePeriodMinutes: 5 as number | "custom",
    customGracePeriod: "",
    alertEmail: "",
    timezone: "UTC",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMonitors()
      fetchUserPlan()
      fetchMonitorUsage()
    }
  }, [user, currentWorkspace])

  // Refresh plan data when returning from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("session_id")) {
      // User just completed checkout, refresh plan data
      setTimeout(() => {
        fetchUserPlan()
      }, 2000) // Wait 2 seconds for webhook to process

      // Clean up URL
      window.history.replaceState({}, "", "/dashboard")
    }
  }, [])

  const fetchUserPlan = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/user/plan")
      const data = await response.json()

      if (data.plan) {
        setCurrentPlan(data.plan)
      }

      // Set payment status and grace period
      if (data.paymentStatus) {
        setPaymentStatus(data.paymentStatus)
      }
      if (data.gracePeriodEndsAt) {
        setGracePeriodEndsAt(new Date(data.gracePeriodEndsAt))
      }

      // Set email verification status
      setEmailVerified(data.emailVerified ?? true)
    } catch (error) {
      console.error("Error fetching user plan:", error)
    }
  }

  const fetchMonitors = async () => {
    try {
      // Add teamId query param if in team workspace
      const url = currentWorkspace.type === "team" && currentWorkspace.teamId ? `/api/monitors?teamId=${currentWorkspace.teamId}` : "/api/monitors"

      const response = await fetch(url)
      const data = await response.json()
      setMonitors(data.monitors || [])
      // Refresh usage after fetching monitors
      fetchMonitorUsage()
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setLoadingMonitors(false)
    }
  }

  const fetchMonitorUsage = async () => {
    try {
      const response = await fetch("/api/monitors/usage")
      const data = await response.json()
      setMonitorUsage(data)

      // Track analytics event if at or near limit
      if (data.warnings?.atLimit && typeof window !== "undefined" && (window as any).clarity) {
        ;(window as any).clarity("event", "monitors_at_limit")
      } else if (data.warnings?.nearLimit && typeof window !== "undefined" && (window as any).clarity) {
        ;(window as any).clarity("event", "monitors_near_limit")
      }
    } catch (error) {
      console.error("Failed to fetch monitor usage:", error)
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

  const handleWorkspaceChange = (workspace: { type: "personal" | "team"; teamId?: string; teamName?: string }) => {
    setCurrentWorkspace(workspace)
    setLoadingMonitors(true)
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
      timezone: monitor.timezone || "UTC",
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
          timezone: editForm.timezone,
        }),
      })
      setMonitors(
        monitors.map(m =>
          m.id === editingMonitor.id
            ? { ...m, name: editForm.name, expectedInterval, gracePeriod, alertEmail: editForm.alertEmail, timezone: editForm.timezone }
            : m,
        ),
      )
      setEditModalOpen(false)
      setEditingMonitor(null)
    } catch (error) {
      console.error("Edit error:", error)
      alert("Failed to update monitor")
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No portal URL returned")
      }
    } catch (error) {
      console.error("Billing portal error:", error)
      alert("Failed to open billing portal. Please try again.")
    }
  }

  const handleBulkPause = async () => {
    if (selectedMonitors.size === 0) return
    if (!confirm(`Are you sure you want to pause ${selectedMonitors.size} monitor(s)?`)) return

    try {
      await Promise.all(
        Array.from(selectedMonitors).map(id =>
          fetch(`/api/monitors/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PAUSED" }),
          }),
        ),
      )
      setMonitors(monitors.map(m => (selectedMonitors.has(m.id) ? { ...m, status: "PAUSED" } : m)))
      setSelectedMonitors(new Set())
    } catch (error) {
      console.error("Bulk pause error:", error)
      alert("Failed to pause some monitors")
    }
  }

  const handleBulkResume = async () => {
    if (selectedMonitors.size === 0) return
    if (!confirm(`Are you sure you want to resume ${selectedMonitors.size} monitor(s)?`)) return

    try {
      await Promise.all(
        Array.from(selectedMonitors).map(id =>
          fetch(`/api/monitors/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "HEALTHY" }),
          }),
        ),
      )
      setMonitors(monitors.map(m => (selectedMonitors.has(m.id) ? { ...m, status: "HEALTHY" } : m)))
      setSelectedMonitors(new Set())
    } catch (error) {
      console.error("Bulk resume error:", error)
      alert("Failed to resume some monitors")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMonitors.size === 0) return
    if (!confirm(`Are you sure you want to DELETE ${selectedMonitors.size} monitor(s)? This action cannot be undone.`)) return

    try {
      await Promise.all(Array.from(selectedMonitors).map(id => fetch(`/api/monitors/${id}`, { method: "DELETE" })))
      setMonitors(monitors.filter(m => !selectedMonitors.has(m.id)))
      setSelectedMonitors(new Set())
    } catch (error) {
      console.error("Bulk delete error:", error)
      alert("Failed to delete some monitors")
    }
  }

  const toggleSelectMonitor = (id: string) => {
    const newSelected = new Set(selectedMonitors)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMonitors(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedMonitors.size === filteredMonitors.length) {
      setSelectedMonitors(new Set())
    } else {
      setSelectedMonitors(new Set(filteredMonitors.map(m => m.id)))
    }
  }

  // Filter monitors based on search and status
  const filteredMonitors = monitors.filter(monitor => {
    const matchesSearch = monitor.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || monitor.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              CronNarc
            </Link>
            <TeamSelector onWorkspaceChange={handleWorkspaceChange} />
          </div>
          <div className="flex gap-4 items-center">
            {currentPlan && (
              <div className="text-sm">
                <span className="text-gray-600">Plan: </span>
                <span className="font-semibold">{currentPlan.name}</span>
                {currentPlan.monthlyPrice > 0 && (
                  <button onClick={handleManageBilling} className="ml-2 text-blue-600 hover:underline">
                    Manage
                  </button>
                )}
              </div>
            )}
            {currentPlan && currentPlan.monthlyPrice === 0 && (
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </Link>
            )}

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    {currentPlan && <p className="text-xs text-gray-500 mt-1">{currentPlan.name} Plan</p>}
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <Link href="/pricing" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Upgrade Plan
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Your Monitors</h2>
            <Link
              href={
                currentWorkspace.type === "team" && currentWorkspace.teamId
                  ? `/dashboard/monitors/new?teamId=${currentWorkspace.teamId}`
                  : "/dashboard/monitors/new"
              }
            >
              <button className="p-1 rounded-full hover:bg-gray-100 transition-colors" title="Create new monitor">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m-4-4h8" />
                </svg>
              </button>
            </Link>
          </div>
          {currentPlan && (
            <div className="text-sm text-gray-600">
              {monitors.length} / {currentPlan.limits.monitors === -1 ? "∞" : currentPlan.limits.monitors} monitors used
            </div>
          )}
        </div>

        {/* Email Verification Banner */}
        <EmailVerificationBanner emailVerified={emailVerified} />

        {/* Payment Warning Banner */}
        <PaymentWarningBanner paymentStatus={paymentStatus} gracePeriodEndsAt={gracePeriodEndsAt} />

        {/* Usage Warning Banner */}
        {monitorUsage && monitorUsage.usage && (
          <UsageWarningBanner
            usage={monitorUsage.usage.active}
            limit={monitorUsage.usage.limit}
            percentage={monitorUsage.usage.percentage}
            planName={monitorUsage.plan.name}
            suggestedTier={monitorUsage.suggestedTier}
          />
        )}

        {/* Search and Filters */}
        {monitors.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search monitors..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="HEALTHY">✅ Healthy</option>
                  <option value="DOWN">🚨 Down</option>
                  <option value="LATE">⚠️ Late</option>
                  <option value="PAUSED">⏸️ Paused</option>
                  <option value="PENDING">⏳ Pending</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredMonitors.length} of {monitors.length} monitor{monitors.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedMonitors.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-blue-900">{selectedMonitors.size} monitor(s) selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBulkPause}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
              >
                <span>⏸️</span> Pause Selected
              </button>
              <button
                onClick={handleBulkResume}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <span>▶️</span> Resume Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <span>🗑️</span> Delete Selected
              </button>
              <button
                onClick={() => setSelectedMonitors(new Set())}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {loadingMonitors ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">Loading monitors...</p>
            </div>
          </div>
        ) : monitors.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-600 mb-4 text-lg">You don't have any monitors yet.</p>
            <p className="text-gray-500 mb-6">Create your first monitor to start tracking your cron jobs and scheduled tasks.</p>
            <Link href="/dashboard/monitors/new">
              <Button>Create Your First Monitor</Button>
            </Link>
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 mb-4 text-lg">No monitors match your filters</p>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
              className="text-blue-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            {filteredMonitors.length > 1 && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedMonitors.size === filteredMonitors.length && filteredMonitors.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={toggleSelectAll}>
                  Select all {filteredMonitors.length} monitor{filteredMonitors.length !== 1 ? "s" : ""}
                </label>
              </div>
            )}

            <div className="grid gap-6">
              {filteredMonitors.map(monitor => (
                <div key={monitor.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedMonitors.has(monitor.id)}
                        onChange={() => toggleSelectMonitor(monitor.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

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
                          <Link href={`/dashboard/monitors/${monitor.id}`} className="group">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                              {monitor.name}
                              <svg
                                className="w-5 h-5 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </h3>
                          </Link>

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
                                  {(monitor.gracePeriod || 300) >= 60
                                    ? `${(monitor.gracePeriod || 300) / 60} min`
                                    : `${monitor.gracePeriod || 300} sec`}
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
                        <button
                          onClick={() => setOpenMenuId(openMenuId === monitor.id ? null : monitor.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
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
          </>
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

                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    value={editForm.timezone}
                    onChange={e => setEditForm({ ...editForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {COMMON_TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">Email timestamps will use this timezone</p>
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

      {/* Upgrade Modal */}
      {showUpgradeModal && monitorUsage && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={monitorUsage.plan.name}
          currentLimit={monitorUsage.usage.limit}
          currentUsage={monitorUsage.usage.active}
          suggestedTier={monitorUsage.suggestedTier}
          reason={monitorUsage.warnings.atLimit ? "limit_reached" : "near_limit"}
        />
      )}
    </div>
  )
}
