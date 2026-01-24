"use client"

import { useEffect, useState } from "react"

interface DailyUptime {
  date: string
  uptime: number
}

interface UptimeChartProps {
  slug: string
}

export default function UptimeChart({ slug }: UptimeChartProps) {
  const [dailyUptime, setDailyUptime] = useState<DailyUptime[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredDay, setHoveredDay] = useState<DailyUptime | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/status/${slug}/history`)
        if (response.ok) {
          const data = await response.json()
          setDailyUptime(data.dailyUptime || [])
        }
      } catch (error) {
        console.error("Failed to fetch uptime history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [slug])

  const getBarColor = (uptime: number): string => {
    if (uptime >= 99.9) return "bg-green-500"
    if (uptime >= 95) return "bg-yellow-500"
    if (uptime >= 50) return "bg-orange-500"
    return "bg-red-500"
  }

  const getBarColorHex = (uptime: number): string => {
    if (uptime >= 99.9) return "#10b981"
    if (uptime >= 95) return "#eab308"
    if (uptime >= 50) return "#f97316"
    return "#ef4444"
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">90-Day Uptime History</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (dailyUptime.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">90-Day Uptime History</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">90-Day Uptime History</h2>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>≥99.9%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>95-99.9%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>50-95%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>&lt;50%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end gap-[2px] h-32">
          {dailyUptime.map((day, index) => (
            <div
              key={day.date}
              className="flex-1 relative group cursor-pointer"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`${getBarColor(day.uptime)} rounded-sm transition-opacity hover:opacity-80`}
                style={{
                  height: `${Math.max(day.uptime, 2)}%`,
                }}
              ></div>

              {/* Tooltip */}
              {hoveredDay?.date === day.date && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                  <div className="font-semibold">{formatDate(day.date)}</div>
                  <div>{day.uptime.toFixed(2)}% uptime</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{dailyUptime.length > 0 ? formatDate(dailyUptime[0].date) : ""}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Each bar represents one day. Hover over a bar to see details.
        </p>
      </div>
    </div>
  )
}

