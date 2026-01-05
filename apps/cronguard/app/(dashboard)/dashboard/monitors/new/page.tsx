"use client"

import { useState, useEffect } from "react"
import { Button } from "@repo/ui"
import { useRouter } from "next/navigation"

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

export default function NewMonitorPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [intervalMinutes, setIntervalMinutes] = useState<number | "custom">(60) // 60 minutes default
  const [customInterval, setCustomInterval] = useState("")
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number | "custom">(5) // 5 minutes default
  const [customGracePeriod, setCustomGracePeriod] = useState("")
  const [alertEmail, setAlertEmail] = useState("")
  const [timezone, setTimezone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-detect user's timezone
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setTimezone(detectedTimezone)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Convert minutes to seconds
      const expectedInterval = intervalMinutes === "custom" ? Number(customInterval) * 60 : intervalMinutes * 60

      const gracePeriod = gracePeriodMinutes === "custom" ? Number(customGracePeriod) * 60 : gracePeriodMinutes * 60

      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          expectedInterval,
          gracePeriod,
          alertEmail: alertEmail || undefined,
          timezone: timezone || "UTC",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create monitor")
      }

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to create monitor")
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

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monitor Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Daily backup job"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expected Interval (minutes)</label>
            <select
              value={intervalMinutes}
              onChange={e => setIntervalMinutes(e.target.value === "custom" ? "custom" : Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              {MINUTE_OPTIONS.map(min => (
                <option key={min} value={min}>
                  {min} {min === 1 ? "minute" : "minutes"}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {intervalMinutes === "custom" && (
              <input
                type="number"
                value={customInterval}
                onChange={e => setCustomInterval(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mt-2"
                placeholder="Enter minutes"
                min={1}
                required
              />
            )}
            <p className="text-sm text-gray-600 mt-1">How often should this job check in?</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Grace Period (minutes)</label>
            <select
              value={gracePeriodMinutes}
              onChange={e => setGracePeriodMinutes(e.target.value === "custom" ? "custom" : Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              {MINUTE_OPTIONS.map(min => (
                <option key={min} value={min}>
                  {min} {min === 1 ? "minute" : "minutes"}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {gracePeriodMinutes === "custom" && (
              <input
                type="number"
                value={customGracePeriod}
                onChange={e => setCustomGracePeriod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mt-2"
                placeholder="Enter minutes"
                min={0}
                required
              />
            )}
            <p className="text-sm text-gray-600 mt-1">How long to wait before marking as DOWN?</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alert Email</label>
            <input
              type="email"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-1">Email timestamps will use this timezone</p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Monitor"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
