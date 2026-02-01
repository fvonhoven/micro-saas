"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Monitor {
  id: string
  name: string
  description: string | null
  status: string
  lastPingAt: string | null
  uptime30d: number
}

interface StatusGroupData {
  group: {
    name: string
    description: string | null
    customTitle: string | null
    customDescription: string | null
  }
  overallStatus: string
  monitors: Monitor[]
  stats: {
    total: number
    operational: number
    degraded: number
    down: number
  }
}

export default function StatusGroupPage() {
  const params = useParams()
  const slug = params.slug as string

  const [data, setData] = useState<StatusGroupData | null>(null)
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
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/status-group/${slug}?_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError("Status page not found or not enabled")
        } else {
          setError("Failed to load status page")
        }
        setLoading(false)
        return
      }

      const responseData = await response.json()
      setData(responseData)
      setLastRefresh(new Date())
      setLoading(false)
    } catch (err) {
      console.error("Error fetching status:", err)
      setError("Failed to load status page")
      setLoading(false)
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500"
      case "degraded_performance":
        return "bg-yellow-500"
      case "partial_outage":
        return "bg-orange-500"
      case "major_outage":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOverallStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "All Systems Operational"
      case "degraded_performance":
        return "Degraded Performance"
      case "partial_outage":
        return "Partial Outage"
      case "major_outage":
        return "Major Outage"
      default:
        return "Unknown Status"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "bg-green-500"
      case "LATE":
        return "bg-yellow-500"
      case "DOWN":
        return "bg-red-500"
      case "PAUSED":
        return "bg-gray-500"
      case "PENDING":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "Operational"
      case "RUNNING":
        return "Running"
      case "LATE":
        return "Degraded"
      case "DOWN":
        return "Down"
      case "FAILED":
        return "Failed"
      case "PAUSED":
        return "Paused"
      case "PENDING":
        return "Pending"
      default:
        return "Unknown"
    }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Never"
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status page...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || "Failed to load status page"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.group.customTitle || data.group.name}</h1>
          {(data.group.customDescription || data.group.description) && (
            <p className="text-gray-600">{data.group.customDescription || data.group.description}</p>
          )}
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${getOverallStatusColor(data.overallStatus)}`}></div>
            <h2 className="text-2xl font-semibold text-gray-900">{getOverallStatusText(data.overallStatus)}</h2>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">{data.stats.operational}</span> operational
            </div>
            {data.stats.degraded > 0 && (
              <div>
                <span className="font-medium text-yellow-600">{data.stats.degraded}</span> degraded
              </div>
            )}
            {data.stats.down > 0 && (
              <div>
                <span className="font-medium text-red-600">{data.stats.down}</span> down
              </div>
            )}
          </div>
        </div>

        {/* Monitors List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
          <div className="space-y-4">
            {data.monitors.map(monitor => (
              <div key={monitor.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(monitor.status)}`}></div>
                      <h4 className="font-medium text-gray-900">{monitor.name}</h4>
                      <span
                        className={`text-sm px-2 py-0.5 rounded ${monitor.status === "HEALTHY" ? "bg-green-100 text-green-800" : monitor.status === "RUNNING" ? "bg-blue-100 text-blue-800" : monitor.status === "LATE" ? "bg-yellow-100 text-yellow-800" : monitor.status === "DOWN" || monitor.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {getStatusText(monitor.status)}
                      </span>
                    </div>
                    {monitor.description && <p className="text-sm text-gray-600 ml-6">{monitor.description}</p>}
                    <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">30-day uptime:</span> {monitor.uptime30d.toFixed(2)}%
                      </div>
                      <div>
                        <span className="font-medium">Last check:</span> {formatTimestamp(monitor.lastPingAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {lastRefresh && <p>Last updated: {formatTimestamp(lastRefresh.toISOString())}</p>}
          <p className="mt-1">Auto-refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  )
}
