"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Monitor {
  name: string
  status: string
  lastPingAt: any
  createdAt: any
  statusPageTitle?: string
  statusPageDescription?: string
}

interface Analytics {
  uptime: {
    last30d: { uptime: number; downtime: number }
    last90d: { uptime: number; downtime: number }
  }
  incidents: {
    recent: Array<{
      id: string
      startedAt: any
      resolvedAt: any
      duration: number
    }>
  }
}

export default function PublicStatusPage() {
  const params = useParams()
  const slug = params.slug as string

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    if (slug) {
      fetchStatusData()

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchStatusData()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [slug])

  const fetchStatusData = async () => {
    try {
      const response = await fetch(`/api/status/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError("Status page not found or not enabled")
        } else {
          setError("Failed to load status page")
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      setMonitor(data.monitor)
      setAnalytics(data.analytics)
      setLastRefresh(new Date())
      setLoading(false)
    } catch (err) {
      console.error("Error fetching status:", err)
      setError("Failed to load status page")
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Never"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 1000 / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    )
  }

  if (error || !monitor || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Status Page Not Found</h1>
          <p className="text-gray-600">{error || "This status page does not exist or is not enabled."}</p>
        </div>
      </div>
    )
  }

  const statusColor = monitor.status === "HEALTHY" ? "green" : monitor.status === "LATE" ? "yellow" : "red"
  const statusText = monitor.status === "HEALTHY" ? "All Systems Operational" : monitor.status === "LATE" ? "Degraded Performance" : "System Down"

  // Calculate monitor age to determine which stats to show
  const createdDate = new Date(monitor.createdAt)
  const ageMs = new Date().getTime() - createdDate.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  // Only show time periods if monitor is old enough
  const show30d = ageDays >= 1 // Show after 1 day
  const show90d = ageDays >= 7 // Show after 7 days

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🕵️</span>
            <h1 className="text-2xl font-bold text-gray-900">{monitor.statusPageTitle || monitor.name}</h1>
          </div>
          {monitor.statusPageDescription && <p className="text-gray-600 ml-11">{monitor.statusPageDescription}</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Auto-refresh indicator */}
        {lastRefresh && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-blue-900">Auto-refreshing every 30 seconds • Last updated: {formatTimestamp(lastRefresh)}</p>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${statusColor === "green" ? "bg-green-500" : statusColor === "yellow" ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
            ></div>
            <h2 className="text-xl font-semibold text-gray-900">{statusText}</h2>
          </div>
          <p className="text-sm text-gray-600">Last checked: {formatTimestamp(monitor.lastPingAt)}</p>
        </div>

        {/* Uptime Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uptime</h2>
          <div className={`grid ${show30d && show90d ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            {show30d && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Last 30 Days</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.uptime.last30d.uptime.toFixed(2)}%</p>
              </div>
            )}
            {show90d && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Last 90 Days</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.uptime.last90d.uptime.toFixed(2)}%</p>
              </div>
            )}
            {!show30d && !show90d && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Monitor Age</p>
                <p className="text-lg text-gray-900">
                  {ageDays < 1 ? `${Math.floor((ageMs / (1000 * 60 * 60)) * 10) / 10} hours old` : `${Math.floor(ageDays * 10) / 10} days old`}
                </p>
                <p className="text-sm text-gray-500 mt-2">Uptime stats will appear after 24 hours</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Incidents</h2>
          {analytics.incidents.recent.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No incidents in the last 30 days 🎉</p>
          ) : (
            <div className="space-y-4">
              {analytics.incidents.recent.map(incident => (
                <div key={incident.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900">Service Disruption</p>
                    <span className="text-sm text-gray-600">{formatDuration(incident.duration)}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formatTimestamp(incident.startedAt)}
                    {incident.resolvedAt && ` - ${formatTimestamp(incident.resolvedAt)}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Powered by{" "}
            <a href="https://cronnarc.com" className="text-purple-600 hover:text-purple-700 font-semibold">
              CronNarc
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
