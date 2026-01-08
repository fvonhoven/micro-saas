"use client"

import { useState, useEffect } from "react"
import type { AlertChannel, AlertChannelType } from "@/lib/alert-channels"

interface AlertChannelsProps {
  monitorId: string
  onUpdate?: () => void
}

export function AlertChannels({ monitorId, onUpdate }: AlertChannelsProps) {
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingChannel, setAddingChannel] = useState(false)

  // Form state
  const [channelType, setChannelType] = useState<AlertChannelType>("email")
  const [channelName, setChannelName] = useState("")
  const [email, setEmail] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [customMethod, setCustomMethod] = useState<"POST" | "GET">("POST")
  const [includeDetails, setIncludeDetails] = useState(true)

  useEffect(() => {
    fetchChannels()
  }, [monitorId])

  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/monitors/${monitorId}/channels`)
      const data = await response.json()
      setChannels(data.channels || [])
    } catch (error) {
      console.error("Failed to fetch channels:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChannel = async () => {
    setAddingChannel(true)
    try {
      let config: any

      switch (channelType) {
        case "email":
          config = { email }
          break
        case "slack":
          config = { webhookUrl }
          break
        case "discord":
          config = { webhookUrl }
          break
        case "webhook":
          config = {
            url: customUrl,
            method: customMethod,
            includeDetails,
          }
          break
      }

      const response = await fetch(`/api/monitors/${monitorId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: channelType,
          name: channelName,
          enabled: true,
          config,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add channel")
      }

      // Reset form
      setChannelName("")
      setEmail("")
      setWebhookUrl("")
      setCustomUrl("")
      setShowAddForm(false)

      // Refresh channels
      await fetchChannels()
      onUpdate?.()
    } catch (error) {
      console.error("Failed to add channel:", error)
      alert("Failed to add alert channel")
    } finally {
      setAddingChannel(false)
    }
  }

  const handleToggleChannel = async (channelId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/monitors/${monitorId}/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle channel")
      }

      await fetchChannels()
      onUpdate?.()
    } catch (error) {
      console.error("Failed to toggle channel:", error)
      alert("Failed to update channel")
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this alert channel?")) {
      return
    }

    try {
      const response = await fetch(`/api/monitors/${monitorId}/channels/${channelId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete channel")
      }

      await fetchChannels()
      onUpdate?.()
    } catch (error) {
      console.error("Failed to delete channel:", error)
      alert("Failed to delete channel")
    }
  }

  const getChannelIcon = (type: AlertChannelType) => {
    switch (type) {
      case "email":
        return "📧"
      case "slack":
        return "💬"
      case "discord":
        return "🎮"
      case "webhook":
        return "🔗"
    }
  }

  const getChannelConfig = (channel: AlertChannel) => {
    switch (channel.type) {
      case "email":
        return (channel.config as any).email
      case "slack":
      case "discord":
        return (channel.config as any).webhookUrl
      case "webhook":
        return (channel.config as any).url
    }
  }

  if (loading) {
    return <div className="text-gray-600">Loading alert channels...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Alert Channels</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          {showAddForm ? "Cancel" : "+ Add Channel"}
        </button>
      </div>

      <p className="text-sm text-gray-600">Configure where you want to receive alerts when this monitor goes down or recovers.</p>

      {/* Add Channel Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <h4 className="font-medium text-gray-900">Add Alert Channel</h4>

          {/* Channel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel Type</label>
            <select
              value={channelType}
              onChange={e => setChannelType(e.target.value as AlertChannelType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="email">📧 Email</option>
              <option value="slack">💬 Slack</option>
              <option value="discord">🎮 Discord</option>
              <option value="webhook">🔗 Custom Webhook</option>
            </select>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
            <input
              type="text"
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              placeholder="e.g., Team Email, #alerts channel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Email Config */}
          {channelType === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alerts@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Slack/Discord Config */}
          {(channelType === "slack" || channelType === "discord") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder={channelType === "slack" ? "https://hooks.slack.com/services/..." : "https://discord.com/api/webhooks/..."}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {channelType === "slack" ? (
                  <>
                    <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      Create a Slack app
                    </a>{" "}
                    to get your webhook URL
                  </>
                ) : (
                  <>Create a webhook in Discord: Server Settings → Integrations → Webhooks</>
                )}
              </p>
            </div>
          )}

          {/* Webhook Config */}
          {channelType === "webhook" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://your-api.com/webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                <select
                  value={customMethod}
                  onChange={e => setCustomMethod(e.target.value as "POST" | "GET")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeDetails"
                  checked={includeDetails}
                  onChange={e => setIncludeDetails(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="includeDetails" className="text-sm text-gray-700">
                  Include full event details in payload
                </label>
              </div>
            </>
          )}

          <button
            onClick={handleAddChannel}
            disabled={
              addingChannel ||
              !channelName ||
              (channelType === "email" && !email) ||
              ((channelType === "slack" || channelType === "discord") && !webhookUrl) ||
              (channelType === "webhook" && !customUrl)
            }
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {addingChannel ? "Adding..." : "Add Channel"}
          </button>
        </div>
      )}

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No alert channels configured yet.</p>
          <p className="text-sm text-gray-500 mt-1">Add a channel to start receiving alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map(channel => (
            <div
              key={channel.id}
              className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-2xl">{getChannelIcon(channel.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase">{channel.type}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{getChannelConfig(channel)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleChannel(channel.id, channel.enabled)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    channel.enabled ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {channel.enabled ? "Enabled" : "Disabled"}
                </button>
                <button onClick={() => handleDeleteChannel(channel.id)} className="text-red-600 hover:text-red-700 p-2">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
