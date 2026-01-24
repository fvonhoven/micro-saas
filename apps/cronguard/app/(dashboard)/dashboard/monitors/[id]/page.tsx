"use client"

import { useEffect, useState } from "react"
import { useAuthContext } from "@repo/auth"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ToastContainer, useToast } from "@/components/Toast"
import { AlertChannels } from "@/components/AlertChannels"
import { signOut } from "firebase/auth"
import { auth } from "@repo/firebase/client"

interface Analytics {
  uptime: {
    last24h: { uptime: number; downtime: number }
    last7d: { uptime: number; downtime: number }
    last30d: { uptime: number; downtime: number }
    last90d: { uptime: number; downtime: number }
    allTime: { uptime: number; downtime: number }
  }
  pings: {
    total: number
    recent: Array<{
      receivedAt: any
      ipAddress: string
    }>
  }
  incidents: {
    total: number
    totalDowntime: number
    averageDuration: number
    recent: Array<{
      id: string
      startedAt: any
      resolvedAt: any
      duration: number
    }>
  }
  currentStatus: {
    status: string
    lastPingAt: any
    nextExpectedAt: any
  }
}

interface Monitor {
  id: string
  name: string
  slug: string
  status: string
  expectedInterval: number
  gracePeriod: number
  alertEmail?: string
  timezone?: string
  createdAt: any
}

export default function MonitorDetailsPage() {
  const { user, loading: authLoading } = useAuthContext()
  const router = useRouter()
  const params = useParams()
  const monitorId = params.id as string

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusPageEnabled, setStatusPageEnabled] = useState(false)
  const [statusPageTitle, setStatusPageTitle] = useState("")
  const [statusPageDescription, setStatusPageDescription] = useState("")
  const [savingStatusPage, setSavingStatusPage] = useState(false)
  const [hasStatusPageChanges, setHasStatusPageChanges] = useState(false)
  const [copiedTooltip, setCopiedTooltip] = useState(false)
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null)

  // Store original values to detect changes
  const [originalStatusPageEnabled, setOriginalStatusPageEnabled] = useState(false)
  const [originalStatusPageTitle, setOriginalStatusPageTitle] = useState("")
  const [originalStatusPageDescription, setOriginalStatusPageDescription] = useState("")
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const { toasts, addToast, removeToast } = useToast()

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && monitorId) {
      fetchMonitorData()
    }
  }, [user, monitorId])

  const fetchMonitorData = async () => {
    try {
      // Fetch monitor details
      const monitorResponse = await fetch("/api/monitors")
      const monitorData = await monitorResponse.json()
      const foundMonitor = monitorData.monitors?.find((m: any) => m.id === monitorId)

      if (!foundMonitor) {
        router.push("/dashboard")
        return
      }

      setMonitor(foundMonitor)

      // Set status page values and originals
      const enabled = foundMonitor.statusPageEnabled || false
      const title = foundMonitor.statusPageTitle || ""
      const description = foundMonitor.statusPageDescription || ""

      setStatusPageEnabled(enabled)
      setStatusPageTitle(title)
      setStatusPageDescription(description)

      setOriginalStatusPageEnabled(enabled)
      setOriginalStatusPageTitle(title)
      setOriginalStatusPageDescription(description)

      // Fetch analytics
      const analyticsResponse = await fetch(`/api/monitors/${monitorId}/analytics`)
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData.analytics)
    } catch (error) {
      console.error("Failed to fetch monitor data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Detect changes to enable/disable save button
  useEffect(() => {
    const hasChanges =
      statusPageEnabled !== originalStatusPageEnabled ||
      statusPageTitle !== originalStatusPageTitle ||
      statusPageDescription !== originalStatusPageDescription

    setHasStatusPageChanges(hasChanges)
  }, [statusPageEnabled, statusPageTitle, statusPageDescription, originalStatusPageEnabled, originalStatusPageTitle, originalStatusPageDescription])

  const handleSaveStatusPage = async () => {
    setSavingStatusPage(true)
    try {
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusPageEnabled,
          statusPageTitle: statusPageTitle || undefined,
          statusPageDescription: statusPageDescription || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status page settings")
      }

      // Update original values to match current values
      setOriginalStatusPageEnabled(statusPageEnabled)
      setOriginalStatusPageTitle(statusPageTitle)
      setOriginalStatusPageDescription(statusPageDescription)
      setHasStatusPageChanges(false)

      addToast("Status page settings saved successfully!", "success")
    } catch (error) {
      console.error("Error saving status page:", error)
      addToast("Failed to save status page settings", "error")
    } finally {
      setSavingStatusPage(false)
    }
  }

  const copyStatusPageUrl = () => {
    const url = `${window.location.origin}/status/${monitor?.slug}`
    navigator.clipboard.writeText(url)

    // Show tooltip
    setCopiedTooltip(true)
    setTimeout(() => setCopiedTooltip(false), 2000)
  }

  const copyBadgeCode = (type: "status" | "uptime") => {
    const baseUrl = window.location.origin
    const slug = monitor?.slug
    let code = ""

    if (type === "status") {
      code = `![Monitor Status](${baseUrl}/api/badge/${slug})`
    } else {
      code = `![Uptime](${baseUrl}/api/badge/${slug}/uptime?period=30d)`
    }

    navigator.clipboard.writeText(code)
    setCopiedBadge(type)
    setTimeout(() => setCopiedBadge(null), 2000)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!monitor || !analytics) {
    return null
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  const parseTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null

    let date: Date

    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate()
    }
    // Handle Firestore Timestamp object with seconds/nanoseconds
    else if (timestamp._seconds !== undefined) {
      date = new Date(timestamp._seconds * 1000)
    }
    // Handle ISO string or timestamp number
    else {
      date = new Date(timestamp)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null
    }

    return date
  }

  const formatDate = (timestamp: any) => {
    const date = parseTimestamp(timestamp)
    if (!date) return "Never"

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "text-green-600 bg-green-50"
      case "LATE":
        return "text-yellow-600 bg-yellow-50"
      case "DOWN":
        return "text-red-600 bg-red-50"
      case "PAUSED":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-blue-600 bg-blue-50"
    }
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return "text-green-600"
    if (uptime >= 99) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            CronNarc
          </Link>

          {/* Profile Avatar Dropdown */}
          {user && (
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
                  </div>
                  <button
                    onClick={() => {
                      router.push("/dashboard")
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Dashboard
                  </button>
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
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{monitor.name}</h1>
              <p className="text-gray-600 mt-1">
                Created {formatDate(monitor.createdAt)}
                {(() => {
                  const createdDate = parseTimestamp(monitor.createdAt)
                  if (!createdDate) return ""

                  const ageMs = new Date().getTime() - createdDate.getTime()
                  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))
                  const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                  const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60))

                  if (ageDays > 0) {
                    return ` • ${ageDays}d ${ageHours}h old`
                  } else if (ageHours > 0) {
                    return ` • ${ageHours}h ${ageMinutes}m old`
                  } else {
                    return ` • ${ageMinutes}m old`
                  }
                })()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(analytics.currentStatus.status)}`}>
              {analytics.currentStatus.status}
            </span>
          </div>
        </div>

        {/* Uptime Stats Grid */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Uptime Statistics</h2>
            <p className="text-gray-600">
              Uptime shows the percentage of time your monitor was healthy (not experiencing downtime).
              <span className="font-semibold"> 100% = perfect</span>,<span className="font-semibold"> 99.9% = excellent</span>,
              <span className="font-semibold"> 99% = good</span>.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: "Last 24 Hours", stats: analytics.uptime.last24h, periodMs: 24 * 60 * 60 * 1000, alwaysShow: true },
              { label: "Last 7 Days", stats: analytics.uptime.last7d, periodMs: 7 * 24 * 60 * 60 * 1000, alwaysShow: false },
              { label: "Last 30 Days", stats: analytics.uptime.last30d, periodMs: 30 * 24 * 60 * 60 * 1000, alwaysShow: false },
              { label: "Last 90 Days", stats: analytics.uptime.last90d, periodMs: 90 * 24 * 60 * 60 * 1000, alwaysShow: false },
              { label: "All Time", stats: analytics.uptime.allTime, periodMs: null, alwaysShow: true },
            ]
              .filter(stat => {
                // Always show "Last 24 Hours" and "All Time"
                if (stat.alwaysShow) return true
                // Only show other periods when monitor is old enough
                const createdDate = parseTimestamp(monitor.createdAt)
                if (!createdDate) return false
                const monitorAge = new Date().getTime() - createdDate.getTime()
                return monitorAge >= stat.periodMs!
              })
              .map((stat, idx) => {
                const downtimeMs = stat.stats.downtime || 0

                // Calculate time units from milliseconds
                const totalSeconds = Math.floor(downtimeMs / 1000)
                const totalMinutes = Math.floor(totalSeconds / 60)
                const totalHours = Math.floor(totalMinutes / 60)
                const totalDays = Math.floor(totalHours / 24)

                // Calculate remainder for display
                const hours = totalHours % 24
                const minutes = totalMinutes % 60

                let downtimeDisplay = ""
                if (totalDays > 0) {
                  downtimeDisplay = `${totalDays}d ${hours}h down`
                } else if (totalHours > 0) {
                  downtimeDisplay = `${totalHours}h ${minutes}m down`
                } else if (totalMinutes > 0) {
                  downtimeDisplay = `${totalMinutes}m down`
                } else if (downtimeMs > 0) {
                  downtimeDisplay = "< 1m down"
                }

                return (
                  <div key={idx} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-xl transition-shadow">
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold ${getUptimeColor(stat.stats.uptime)}`}>{stat.stats.uptime.toFixed(2)}%</p>
                    {downtimeDisplay && <p className="text-xs text-red-600 mt-1 font-medium">{downtimeDisplay}</p>}
                    {stat.stats.uptime === 100 && <p className="text-xs text-green-600 mt-1 font-semibold">Perfect! ✨</p>}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Monitor Info */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Monitor Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ping URL</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded block mt-1 break-all">
                {typeof window !== "undefined" ? `${window.location.origin}/api/ping/${monitor.slug}` : ""}
              </code>
            </div>
            <div>
              <p className="text-sm text-gray-600">Check Interval</p>
              <p className="font-semibold mt-1">
                {monitor.expectedInterval >= 60 ? `${monitor.expectedInterval / 60} minutes` : `${monitor.expectedInterval} seconds`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Grace Period</p>
              <p className="font-semibold mt-1">
                {monitor.gracePeriod >= 60 ? `${monitor.gracePeriod / 60} minutes` : `${monitor.gracePeriod} seconds`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Alert Email</p>
              <p className="font-semibold mt-1">{monitor.alertEmail || "Not configured"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Ping</p>
              <p className="font-semibold mt-1">{formatDate(analytics.currentStatus.lastPingAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Expected</p>
              <p className="font-semibold mt-1">{formatDate(analytics.currentStatus.nextExpectedAt)}</p>
            </div>
          </div>
        </div>

        {/* Status Page Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Public Status Page</h2>
          <p className="text-gray-600 mb-4">Share your monitor's uptime with your team or customers via a public status page.</p>

          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="statusPageEnabled"
                checked={statusPageEnabled}
                onChange={e => setStatusPageEnabled(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="statusPageEnabled" className="font-semibold text-gray-900">
                Enable Public Status Page
              </label>
            </div>

            {statusPageEnabled && (
              <>
                {/* Status Page URL */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Status Page URL</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 break-all">
                      {typeof window !== "undefined" ? `${window.location.origin}/status/${monitor.slug}` : ""}
                    </code>
                    <div className="relative">
                      <button
                        onClick={copyStatusPageUrl}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
                      >
                        Copy URL
                      </button>
                      {copiedTooltip && (
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded whitespace-nowrap">
                          Copied!
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Title (optional)</label>
                  <input
                    type="text"
                    value={statusPageTitle}
                    onChange={e => setStatusPageTitle(e.target.value)}
                    placeholder={monitor.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use monitor name</p>
                </div>

                {/* Custom Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Page Description (optional)</label>
                  <textarea
                    value={statusPageDescription}
                    onChange={e => setStatusPageDescription(e.target.value)}
                    placeholder="e.g., Real-time status of our backup service"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Status Badges */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📛 Embeddable Badges</h3>
                  <p className="text-xs text-gray-600 mb-4">Add these badges to your README, documentation, or website to show monitor status.</p>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">Status Badge</label>
                      <img src={`/api/badge/${monitor.slug}`} alt="Status Badge" className="h-5" />
                    </div>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-gray-300 break-all">
                        {typeof window !== "undefined" ? `![Monitor Status](${window.location.origin}/api/badge/${monitor.slug})` : ""}
                      </code>
                      <div className="relative">
                        <button
                          onClick={() => copyBadgeCode("status")}
                          className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          {copiedBadge === "status" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Uptime Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">Uptime Badge (30 days)</label>
                      <img src={`/api/badge/${monitor.slug}/uptime?period=30d`} alt="Uptime Badge" className="h-5" />
                    </div>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-gray-300 break-all">
                        {typeof window !== "undefined" ? `![Uptime](${window.location.origin}/api/badge/${monitor.slug}/uptime?period=30d)` : ""}
                      </code>
                      <div className="relative">
                        <button
                          onClick={() => copyBadgeCode("uptime")}
                          className="px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          {copiedBadge === "uptime" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveStatusPage}
              disabled={savingStatusPage || !hasStatusPageChanges}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingStatusPage ? "Saving..." : "Save Status Page Settings"}
            </button>
            {!hasStatusPageChanges && !savingStatusPage && <p className="text-sm text-gray-500 -mt-2">No changes to save</p>}
          </div>
        </div>

        {/* Alert Channels */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
          <AlertChannels monitorId={monitorId} />
        </div>

        {/* Incident History */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Incident History</h2>
          {analytics.incidents.total > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.incidents.total}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Downtime</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.incidents.totalDowntime)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.incidents.averageDuration)}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Started</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Resolved</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Duration</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.incidents.recent.map(incident => (
                      <tr key={incident.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{formatDate(incident.startedAt)}</td>
                        <td className="px-4 py-3 text-sm">{formatDate(incident.resolvedAt)}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{incident.duration ? formatDuration(incident.duration) : "Ongoing"}</td>
                        <td className="px-4 py-3 text-sm">
                          {incident.resolvedAt ? (
                            <span className="text-green-600 font-semibold">✓ Resolved</span>
                          ) : (
                            <span className="text-red-600 font-semibold">⚠ Ongoing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-600 text-center py-8">No incidents recorded. Great job! 🎉</p>
          )}
        </div>

        {/* Recent Pings */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Recent Pings</h2>
          {analytics.pings.recent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Timestamp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.pings.recent.map((ping, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(ping.receivedAt)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{ping.ipAddress || "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No pings received yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
