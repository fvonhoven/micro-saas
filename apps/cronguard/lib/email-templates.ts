/**
 * Professional email templates for CronNarc
 */

interface EmailLayoutProps {
  title: string
  previewText: string
  content: string
}

/**
 * Base email layout with CronNarc branding
 */
export function emailLayout({ title, previewText, content }: EmailLayoutProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      margin: 8px 0 0 0;
    }
    .content {
      padding: 40px 24px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 12px;
      margin: 4px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .alert-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .info-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #374151;
      width: 40%;
    }
    .info-table td:last-child {
      color: #6b7280;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .preview-text {
      display: none;
      font-size: 1px;
      color: #ffffff;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <span class="preview-text">${previewText}</span>
  <div class="email-container">
    <div class="header">
      <h1 class="logo">🕵️ CronNarc</h1>
      <p class="tagline">Keeping your cron jobs in check</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">CronNarc - Cron Job Monitoring</p>
      <p class="footer-text">You're receiving this because you configured alerts for this monitor.</p>
      <p class="footer-text" style="margin-top: 16px;">
        <a href="{{dashboardUrl}}" style="color: #667eea; text-decoration: none; margin-right: 16px;">View Dashboard</a>
        <a href="{{dashboardUrl}}/terms" style="color: #9ca3af; text-decoration: none; margin-right: 12px; font-size: 12px;">Terms</a>
        <a href="{{dashboardUrl}}/privacy" style="color: #9ca3af; text-decoration: none; font-size: 12px;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

interface MonitorDownEmailProps {
  monitorName: string
  monitorUrl: string
  lastPingAt: string | null
  expectedBy: string
  currentTime: string
  dashboardUrl: string
}

/**
 * Email template for monitor down alerts
 */
export function monitorDownEmail({ monitorName, monitorUrl, lastPingAt, expectedBy, currentTime, dashboardUrl }: MonitorDownEmailProps): string {
  const content = `
    <div class="alert-box">
      <h1 style="margin-top: 0;">🚨 Monitor Down</h1>
      <p style="margin-bottom: 0; font-size: 18px;">
        Your monitor <strong>${monitorName}</strong> has not checked in and is now marked as <strong style="color: #dc2626;">DOWN</strong>.
      </p>
    </div>

    <p>Your cron job failed to send a ping within the expected timeframe. This could indicate:</p>
    <ul style="color: #4b5563; line-height: 1.8; margin: 16px 0;">
      <li>The cron job is not running</li>
      <li>The cron job encountered an error</li>
      <li>Network connectivity issues</li>
      <li>Server or application downtime</li>
    </ul>

    <table class="info-table">
      <tr>
        <td>Monitor Name</td>
        <td>${monitorName}</td>
      </tr>
      <tr>
        <td>Last Ping</td>
        <td>${lastPingAt || "Never"}</td>
      </tr>
      <tr>
        <td>Expected By</td>
        <td>${expectedBy}</td>
      </tr>
      <tr>
        <td>Current Time</td>
        <td>${currentTime}</td>
      </tr>
    </table>

    <p style="margin-top: 32px; text-align: center;">
      <a href="${monitorUrl}" class="button">View Monitor Details</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
      <strong>Next Steps:</strong><br>
      1. Check if your cron job is running<br>
      2. Review application logs for errors<br>
      3. Verify network connectivity<br>
      4. Send a test ping to verify recovery
    </p>
  `

  return emailLayout({
    title: `🚨 Monitor Down: ${monitorName}`,
    previewText: `${monitorName} has not checked in and is now marked as DOWN.`,
    content: content.replace("{{dashboardUrl}}", dashboardUrl),
  })
}

interface MonitorRecoveryEmailProps {
  monitorName: string
  monitorUrl: string
  wentDownAt: string
  recoveredAt: string
  downtimeMinutes: number
  dashboardUrl: string
}

/**
 * Email template for monitor recovery notifications
 */
export function monitorRecoveryEmail({
  monitorName,
  monitorUrl,
  wentDownAt,
  recoveredAt,
  downtimeMinutes,
  dashboardUrl,
}: MonitorRecoveryEmailProps): string {
  // Format downtime duration
  const formatDowntime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours !== 1 ? "s" : ""}`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} day${days !== 1 ? "s" : ""}`
  }

  const content = `
    <div class="success-box">
      <h1 style="margin-top: 0;">✅ Monitor Recovered</h1>
      <p style="margin-bottom: 0; font-size: 18px;">
        Your monitor <strong>${monitorName}</strong> has recovered and is now <strong style="color: #16a34a;">HEALTHY</strong>.
      </p>
    </div>

    <p>Great news! Your cron job has successfully checked in and the incident has been resolved.</p>

    <table class="info-table">
      <tr>
        <td>Monitor Name</td>
        <td>${monitorName}</td>
      </tr>
      <tr>
        <td>Went Down</td>
        <td>${wentDownAt}</td>
      </tr>
      <tr>
        <td>Recovered</td>
        <td>${recoveredAt}</td>
      </tr>
      <tr>
        <td>Total Downtime</td>
        <td><strong style="color: #dc2626;">${formatDowntime(downtimeMinutes)}</strong></td>
      </tr>
    </table>

    <p style="margin-top: 32px; text-align: center;">
      <a href="${monitorUrl}" class="button">View Monitor Details</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px;">
      <strong>💡 Tip:</strong> Review your monitor's analytics to identify patterns and prevent future incidents.
      Consider adjusting grace periods if you're experiencing frequent false alerts.
    </p>
  `

  return emailLayout({
    title: `✅ Monitor Recovered: ${monitorName}`,
    previewText: `${monitorName} has recovered and is now HEALTHY. Downtime: ${formatDowntime(downtimeMinutes)}`,
    content: content.replace("{{dashboardUrl}}", dashboardUrl),
  })
}

/**
 * Monitor Paused Email Template
 */
interface MonitorPausedEmailProps {
  monitorName: string
  monitorUrl: string
  pausedBy: string
  dashboardUrl: string
}

export function monitorPausedEmail({ monitorName, monitorUrl, pausedBy, dashboardUrl }: MonitorPausedEmailProps): string {
  const content = `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #92400e; font-size: 20px;">⏸️ Monitor Paused</h2>
      <p style="margin: 0; color: #78350f; font-size: 16px; font-weight: 500;">${monitorName}</p>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      Your monitor <strong>${monitorName}</strong> has been paused and will not send alerts until resumed.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Monitor</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${monitorName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Status</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #6b7280; font-size: 14px; font-weight: 600;">PAUSED</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px;">
          <strong style="color: #6b7280; font-size: 14px;">Paused By</strong>
        </td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${pausedBy}</span>
        </td>
      </tr>
    </table>

    <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
        <strong>⚠️ Important:</strong> While paused, this monitor will not check for missed pings or send down alerts.
        Remember to resume monitoring when your maintenance is complete.
      </p>
    </div>

    <table style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="padding: 0;">
          <a href="${monitorUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Monitor Details
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px;">
      <strong>💡 Tip:</strong> Use the pause feature during planned maintenance windows to avoid false alerts.
      Don't forget to resume monitoring when you're done!
    </p>
  `

  return emailLayout({
    title: `⏸️ Monitor Paused: ${monitorName}`,
    previewText: `${monitorName} has been paused and will not send alerts until resumed.`,
    content: content.replace("{{dashboardUrl}}", dashboardUrl),
  })
}

/**
 * Monitor Resumed Email Template
 */
interface MonitorResumedEmailProps {
  monitorName: string
  monitorUrl: string
  resumedBy: string
  dashboardUrl: string
}

export function monitorResumedEmail({ monitorName, monitorUrl, resumedBy, dashboardUrl }: MonitorResumedEmailProps): string {
  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #065f46; font-size: 20px;">▶️ Monitor Resumed</h2>
      <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 500;">${monitorName}</p>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      Your monitor <strong>${monitorName}</strong> has been resumed and is now actively monitoring for missed pings.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Monitor</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${monitorName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Status</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #10b981; font-size: 14px; font-weight: 600;">ACTIVE</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px;">
          <strong style="color: #6b7280; font-size: 14px;">Resumed By</strong>
        </td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${resumedBy}</span>
        </td>
      </tr>
    </table>

    <div style="background-color: #dbeafe; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
        <strong>✅ Monitoring Active:</strong> Your monitor is now checking for missed pings and will send alerts if your cron job fails to check in.
      </p>
    </div>

    <table style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="padding: 0;">
          <a href="${monitorUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Monitor Details
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px;">
      <strong>💡 Tip:</strong> Make sure your cron job is configured to ping this monitor at the expected interval.
      Check the monitor details page for the ping URL.
    </p>
  `

  return emailLayout({
    title: `▶️ Monitor Resumed: ${monitorName}`,
    previewText: `${monitorName} has been resumed and is now actively monitoring.`,
    content: content.replace("{{dashboardUrl}}", dashboardUrl),
  })
}
