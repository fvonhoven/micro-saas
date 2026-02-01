/**
 * Alert Channels System for CronNarc
 *
 * Supports multiple notification channels:
 * - Email
 * - Slack
 * - Discord
 * - Telegram
 * - Microsoft Teams
 * - Custom Webhooks
 */

export type AlertChannelType = "email" | "slack" | "discord" | "telegram" | "teams" | "webhook"

export interface AlertChannel {
  id: string
  type: AlertChannelType
  name: string
  enabled: boolean
  config: EmailConfig | SlackConfig | DiscordConfig | TelegramConfig | TeamsConfig | WebhookConfig
  createdAt: Date
  updatedAt: Date
}

export interface EmailConfig {
  email: string
}

export interface SlackConfig {
  webhookUrl: string
}

export interface DiscordConfig {
  webhookUrl: string
}

export interface TelegramConfig {
  botToken: string
  chatId: string
}

export interface TeamsConfig {
  webhookUrl: string
}

export interface WebhookConfig {
  url: string
  method?: "POST" | "GET"
  headers?: Record<string, string>
  includeDetails?: boolean
}

export interface AlertPayload {
  monitorId: string
  monitorName: string
  monitorSlug: string
  event: "down" | "recovery" | "paused" | "resumed"
  timestamp: string
  details?: {
    lastPingAt?: string
    expectedBy?: string
    currentTime?: string
    downtimeMinutes?: number
    wentDownAt?: string
    recoveredAt?: string
  }
}

/**
 * Send alert to email channel
 */
export async function sendEmailAlert(config: EmailConfig, payload: AlertPayload, emailHtml: string, subject: string): Promise<boolean> {
  try {
    const { Resend } = await import("resend")
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

    if (!resend) {
      console.error("Resend not configured")
      return false
    }

    await resend.emails.send({
      from: "CronNarc <noreply@cronnarc.com>",
      to: config.email,
      subject,
      html: emailHtml,
    })

    return true
  } catch (error) {
    console.error("Email alert failed:", error)
    return false
  }
}

/**
 * Get the base URL for the application
 */
function getBaseUrl(): string {
  // In browser context (Next.js client-side)
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // In server context, check environment variables
  // NEXT_PUBLIC_APP_URL is set in .env.local and Netlify
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Fallback to localhost for development
  return "http://localhost:3000"
}

/**
 * Send alert to Slack channel
 */
export async function sendSlackAlert(config: SlackConfig, payload: AlertPayload): Promise<boolean> {
  try {
    const color = payload.event === "down" ? "#dc2626" : payload.event === "recovery" ? "#10b981" : "#f59e0b"

    const emoji = payload.event === "down" ? "🚨" : payload.event === "recovery" ? "✅" : payload.event === "paused" ? "⏸️" : "▶️"

    const text =
      payload.event === "down"
        ? `Monitor *${payload.monitorName}* is DOWN`
        : payload.event === "recovery"
          ? `Monitor *${payload.monitorName}* has recovered`
          : payload.event === "paused"
            ? `Monitor *${payload.monitorName}* has been paused`
            : `Monitor *${payload.monitorName}* has been resumed`

    const fields: Array<{ title: string; value: string; short: boolean }> = []

    if (payload.details?.lastPingAt) {
      fields.push({ title: "Last Ping", value: payload.details.lastPingAt, short: true })
    }
    if (payload.details?.expectedBy) {
      fields.push({ title: "Expected By", value: payload.details.expectedBy, short: true })
    }
    if (payload.details?.downtimeMinutes !== undefined) {
      const hours = Math.floor(payload.details.downtimeMinutes / 60)
      const minutes = payload.details.downtimeMinutes % 60
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      fields.push({ title: "Downtime", value: duration, short: true })
    }

    const baseUrl = getBaseUrl()
    const monitorUrl = `${baseUrl}/dashboard/monitors/${payload.monitorId}`

    const slackPayload = {
      text: `${emoji} ${text}`,
      attachments: [
        {
          color,
          fields,
          footer: "CronNarc",
          ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
          actions: [
            {
              type: "button",
              text: "View Monitor",
              url: monitorUrl,
            },
          ],
        },
      ],
    }

    console.log("Sending Slack alert to:", config.webhookUrl)
    console.log("Slack payload:", JSON.stringify(slackPayload, null, 2))

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Slack API error:", response.status, errorText)
      return false
    }

    console.log("Slack alert sent successfully")
    return true
  } catch (error) {
    console.error("Slack alert failed:", error)
    return false
  }
}

/**
 * Send alert to Discord channel
 */
export async function sendDiscordAlert(config: DiscordConfig, payload: AlertPayload): Promise<boolean> {
  try {
    const color = payload.event === "down" ? 0xdc2626 : payload.event === "recovery" ? 0x10b981 : 0xf59e0b

    const emoji = payload.event === "down" ? "🚨" : payload.event === "recovery" ? "✅" : payload.event === "paused" ? "⏸️" : "▶️"

    const title =
      payload.event === "down"
        ? `Monitor Down: ${payload.monitorName}`
        : payload.event === "recovery"
          ? `Monitor Recovered: ${payload.monitorName}`
          : payload.event === "paused"
            ? `Monitor Paused: ${payload.monitorName}`
            : `Monitor Resumed: ${payload.monitorName}`

    const description =
      payload.event === "down"
        ? `Your monitor **${payload.monitorName}** has not checked in and is now marked as DOWN.`
        : payload.event === "recovery"
          ? `Your monitor **${payload.monitorName}** has recovered and is now HEALTHY.`
          : payload.event === "paused"
            ? `Your monitor **${payload.monitorName}** has been paused.`
            : `Your monitor **${payload.monitorName}** has been resumed.`

    const fields: Array<{ name: string; value: string; inline: boolean }> = []

    if (payload.details?.lastPingAt) {
      fields.push({ name: "Last Ping", value: payload.details.lastPingAt, inline: true })
    }
    if (payload.details?.expectedBy) {
      fields.push({ name: "Expected By", value: payload.details.expectedBy, inline: true })
    }
    if (payload.details?.downtimeMinutes !== undefined) {
      const hours = Math.floor(payload.details.downtimeMinutes / 60)
      const minutes = payload.details.downtimeMinutes % 60
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      fields.push({ name: "Downtime", value: duration, inline: true })
    }

    const baseUrl = getBaseUrl()
    const monitorUrl = `${baseUrl}/dashboard/monitors/${payload.monitorId}`

    const discordPayload = {
      content: `${emoji} **${title}**`,
      embeds: [
        {
          title,
          description,
          color,
          fields,
          footer: {
            text: "CronNarc",
          },
          timestamp: payload.timestamp,
          url: monitorUrl,
        },
      ],
    }

    console.log("Sending Discord alert to:", config.webhookUrl)
    console.log("Discord payload:", JSON.stringify(discordPayload, null, 2))

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Discord API error:", response.status, errorText)
      return false
    }

    console.log("Discord alert sent successfully")
    return true
  } catch (error) {
    console.error("Discord alert failed:", error)
    return false
  }
}

/**
 * Send alert to Telegram channel
 */
export async function sendTelegramAlert(config: TelegramConfig, payload: AlertPayload): Promise<boolean> {
  try {
    const emoji = payload.event === "down" ? "🚨" : payload.event === "recovery" ? "✅" : payload.event === "paused" ? "⏸️" : "▶️"

    const title =
      payload.event === "down"
        ? `Monitor Down: ${payload.monitorName}`
        : payload.event === "recovery"
          ? `Monitor Recovered: ${payload.monitorName}`
          : payload.event === "paused"
            ? `Monitor Paused: ${payload.monitorName}`
            : `Monitor Resumed: ${payload.monitorName}`

    const description =
      payload.event === "down"
        ? `Your monitor <b>${payload.monitorName}</b> has not checked in and is now marked as DOWN.`
        : payload.event === "recovery"
          ? `Your monitor <b>${payload.monitorName}</b> has recovered and is now HEALTHY.`
          : payload.event === "paused"
            ? `Your monitor <b>${payload.monitorName}</b> has been paused.`
            : `Your monitor <b>${payload.monitorName}</b> has been resumed.`

    let details = ""
    if (payload.details?.lastPingAt) {
      details += `\n📅 Last Ping: ${payload.details.lastPingAt}`
    }
    if (payload.details?.expectedBy) {
      details += `\n⏰ Expected By: ${payload.details.expectedBy}`
    }
    if (payload.details?.downtimeMinutes !== undefined) {
      const hours = Math.floor(payload.details.downtimeMinutes / 60)
      const minutes = payload.details.downtimeMinutes % 60
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      details += `\n⏱️ Downtime: ${duration}`
    }

    const baseUrl = getBaseUrl()
    const monitorUrl = `${baseUrl}/dashboard/monitors/${payload.monitorId}`

    const text = `${emoji} <b>${title}</b>\n\n${description}${details}\n\n<a href="${monitorUrl}">View Monitor</a>`

    const telegramPayload = {
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }

    console.log("Sending Telegram alert to chat:", config.chatId)

    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telegramPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Telegram API error:", response.status, errorText)
      return false
    }

    console.log("Telegram alert sent successfully")
    return true
  } catch (error) {
    console.error("Telegram alert failed:", error)
    return false
  }
}

/**
 * Send alert to Microsoft Teams channel
 */
export async function sendTeamsAlert(config: TeamsConfig, payload: AlertPayload): Promise<boolean> {
  try {
    const themeColor = payload.event === "down" ? "FF0000" : payload.event === "recovery" ? "10b981" : "f59e0b"

    const emoji = payload.event === "down" ? "🚨" : payload.event === "recovery" ? "✅" : payload.event === "paused" ? "⏸️" : "▶️"

    const title =
      payload.event === "down"
        ? `Monitor Down: ${payload.monitorName}`
        : payload.event === "recovery"
          ? `Monitor Recovered: ${payload.monitorName}`
          : payload.event === "paused"
            ? `Monitor Paused: ${payload.monitorName}`
            : `Monitor Resumed: ${payload.monitorName}`

    const facts: Array<{ name: string; value: string }> = []

    if (payload.details?.lastPingAt) {
      facts.push({ name: "Last Ping", value: payload.details.lastPingAt })
    }
    if (payload.details?.expectedBy) {
      facts.push({ name: "Expected By", value: payload.details.expectedBy })
    }
    if (payload.details?.downtimeMinutes !== undefined) {
      const hours = Math.floor(payload.details.downtimeMinutes / 60)
      const minutes = payload.details.downtimeMinutes % 60
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      facts.push({ name: "Downtime", value: duration })
    }

    const baseUrl = getBaseUrl()
    const monitorUrl = `${baseUrl}/dashboard/monitors/${payload.monitorId}`

    const teamsPayload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor,
      summary: title,
      sections: [
        {
          activityTitle: `${emoji} ${title}`,
          activitySubtitle: payload.monitorName,
          facts,
          markdown: true,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Monitor",
          targets: [
            {
              os: "default",
              uri: monitorUrl,
            },
          ],
        },
      ],
    }

    console.log("Sending Teams alert to:", config.webhookUrl)

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamsPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Teams API error:", response.status, errorText)
      return false
    }

    console.log("Teams alert sent successfully")
    return true
  } catch (error) {
    console.error("Teams alert failed:", error)
    return false
  }
}

/**
 * Send alert to custom webhook
 */
export async function sendWebhookAlert(config: WebhookConfig, payload: AlertPayload): Promise<boolean> {
  try {
    const method = config.method || "POST"
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "CronNarc/1.0",
      ...config.headers,
    }

    const body = config.includeDetails
      ? JSON.stringify(payload)
      : JSON.stringify({
          event: payload.event,
          monitorName: payload.monitorName,
          timestamp: payload.timestamp,
        })

    const response = await fetch(config.url, {
      method,
      headers,
      body: method === "POST" ? body : undefined,
    })

    return response.ok
  } catch (error) {
    console.error("Webhook alert failed:", error)
    return false
  }
}

/**
 * Send alert to all enabled channels for a monitor
 */
export async function sendAlertToChannels(
  channels: AlertChannel[],
  payload: AlertPayload,
  emailHtml?: string,
  emailSubject?: string,
): Promise<{ success: number; failed: number }> {
  console.log(`Sending alerts to ${channels.length} channels for event: ${payload.event}`)
  let success = 0
  let failed = 0

  for (const channel of channels) {
    if (!channel.enabled) {
      console.log(`Skipping disabled channel: ${channel.name} (${channel.type})`)
      continue
    }

    console.log(`Sending alert to ${channel.type} channel: ${channel.name}`)
    let result = false

    try {
      switch (channel.type) {
        case "email":
          if (emailHtml && emailSubject) {
            result = await sendEmailAlert(channel.config as EmailConfig, payload, emailHtml, emailSubject)
          } else {
            console.error("Email channel requires emailHtml and emailSubject")
          }
          break
        case "slack":
          result = await sendSlackAlert(channel.config as SlackConfig, payload)
          break
        case "discord":
          result = await sendDiscordAlert(channel.config as DiscordConfig, payload)
          break
        case "telegram":
          result = await sendTelegramAlert(channel.config as TelegramConfig, payload)
          break
        case "teams":
          result = await sendTeamsAlert(channel.config as TeamsConfig, payload)
          break
        case "webhook":
          result = await sendWebhookAlert(channel.config as WebhookConfig, payload)
          break
      }

      if (result) {
        console.log(`✅ Successfully sent alert to ${channel.type} channel: ${channel.name}`)
        success++
      } else {
        console.error(`❌ Failed to send alert to ${channel.type} channel: ${channel.name}`)
        failed++
      }
    } catch (error) {
      console.error(`❌ Exception sending alert to ${channel.type} channel (${channel.name}):`, error)
      failed++
    }
  }

  console.log(`Alert sending complete: ${success} succeeded, ${failed} failed`)
  return { success, failed }
}
