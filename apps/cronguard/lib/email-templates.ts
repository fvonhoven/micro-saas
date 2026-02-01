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

/**
 * Monitor Failed Email Template
 */
interface MonitorFailedEmailProps {
  monitorName: string
  monitorUrl: string
  failureMessage?: string
  currentTime: string
  dashboardUrl: string
}

export function monitorFailedEmail({ monitorName, monitorUrl, failureMessage, currentTime, dashboardUrl }: MonitorFailedEmailProps): string {
  const content = `
    <div class="alert-box">
      <h1 style="margin-top: 0;">❌ Monitor Failed</h1>
      <p style="margin-bottom: 0; font-size: 18px;">
        Your monitor <strong>${monitorName}</strong> has reported a failure and is now marked as <strong style="color: #dc2626;">FAILED</strong>.
      </p>
    </div>

    <p>Your cron job explicitly reported a failure. This indicates the job ran but encountered an error during execution.</p>

    ${
      failureMessage
        ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 6px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b; font-family: monospace;">
        <strong>Error Message:</strong><br>
        ${failureMessage}
      </p>
    </div>
    `
        : ""
    }

    <table class="info-table">
      <tr>
        <td>Monitor Name</td>
        <td>${monitorName}</td>
      </tr>
      <tr>
        <td>Failed At</td>
        <td>${currentTime}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td><strong style="color: #dc2626;">FAILED</strong></td>
      </tr>
    </table>

    <p style="margin-top: 32px; text-align: center;">
      <a href="${monitorUrl}" class="button">View Monitor Details</a>
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
      <strong>Next Steps:</strong><br>
      1. Review the error message above<br>
      2. Check application logs for more details<br>
      3. Fix the underlying issue<br>
      4. Test your cron job manually<br>
      5. Monitor will auto-recover on next successful ping
    </p>
  `

  return emailLayout({
    title: `❌ Monitor Failed: ${monitorName}`,
    previewText: `${monitorName} has reported a failure.${failureMessage ? ` Error: ${failureMessage}` : ""}`,
    content: content.replace("{{dashboardUrl}}", dashboardUrl),
  })
}

/**
 * Team Invite Email Template
 */
interface TeamInviteEmailProps {
  teamName: string
  inviterName: string
  inviterEmail: string
  role: string
  inviteUrl: string
  expiresAt: Date
  dashboardUrl: string
}

export function teamInviteEmail({ teamName, inviterName, inviterEmail, role, inviteUrl, expiresAt, dashboardUrl }: TeamInviteEmailProps): string {
  const expiresAtFormatted = expiresAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const roleDescriptions: Record<string, string> = {
    viewer: "View monitors and receive alerts (read-only access)",
    member: "Create and manage monitors",
    admin: "Full team management including inviting members",
  }

  const roleDescription = roleDescriptions[role] || "Team member"

  const content = `
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #1e40af; font-size: 20px;">👥 You've Been Invited!</h2>
      <p style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 500;">Join ${teamName} on CronNarc</p>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join their team on CronNarc.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Team</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${teamName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Your Role</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px; text-transform: capitalize;">${role}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Invited By</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${inviterName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px;">
          <strong style="color: #6b7280; font-size: 14px;">Expires</strong>
        </td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${expiresAtFormatted}</span>
        </td>
      </tr>
    </table>

    <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #0c4a6e; line-height: 1.6;">
        <strong>As a ${role}:</strong> ${roleDescription}
      </p>
    </div>

    <table style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="padding: 0; text-align: center;">
          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 24px;">
      Or copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #667eea; text-decoration: none; word-break: break-all;">${inviteUrl}</a>
    </p>

    <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin-top: 32px;">
      <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
        <strong>⏰ This invitation expires on ${expiresAtFormatted}.</strong> Make sure to accept it before then!
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px;">
      <strong>💡 What is CronNarc?</strong><br>
      CronNarc is a cron job monitoring service that helps teams ensure their scheduled tasks are running reliably.
      Get instant alerts when jobs fail to check in, and collaborate with your team to maintain uptime.
    </p>
  `

  return emailLayout({
    title: `You've been invited to join ${teamName} on CronNarc`,
    previewText: `${inviterName} has invited you to join ${teamName} on CronNarc as a ${role}.`,
    content: content.replace(/{{dashboardUrl}}/g, dashboardUrl),
  })
}

/**
 * Upgrade confirmation email
 */
interface UpgradeConfirmationEmailProps {
  oldPlanName: string
  newPlanName: string
  newPlanPrice: number
  billingCycle: "monthly" | "annual"
  prorationAmount: number
  nextBillingDate: Date
  immediate: boolean
  dashboardUrl: string
}

export function upgradeConfirmationEmail({
  oldPlanName,
  newPlanName,
  newPlanPrice,
  billingCycle,
  prorationAmount,
  nextBillingDate,
  immediate,
  dashboardUrl,
}: UpgradeConfirmationEmailProps): string {
  const nextBillingFormatted = nextBillingDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const content = `
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #065f46; font-size: 20px;">🎉 Plan Upgrade Successful!</h2>
      <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 500;">
        ${immediate ? "Your plan has been upgraded immediately" : "Your plan upgrade is scheduled"}
      </p>
    </div>

    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
      ${
        immediate
          ? `Congratulations! Your CronNarc plan has been upgraded from <strong>${oldPlanName}</strong> to <strong>${newPlanName}</strong>.`
          : `Your CronNarc plan will be upgraded from <strong>${oldPlanName}</strong> to <strong>${newPlanName}</strong> at the end of your current billing period.`
      }
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f9fafb; border-radius: 6px;">
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Previous Plan</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${oldPlanName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">New Plan</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #10b981; font-size: 14px; font-weight: 600;">${newPlanName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Billing Cycle</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px; text-transform: capitalize;">${billingCycle}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">New Price</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #111827; font-size: 14px;">$${newPlanPrice}/${billingCycle === "monthly" ? "mo" : "yr"}</span>
        </td>
      </tr>
      ${
        immediate && prorationAmount > 0
          ? `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
          <strong style="color: #6b7280; font-size: 14px;">Prorated Charge</strong>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <span style="color: #10b981; font-size: 14px; font-weight: 600;">$${prorationAmount.toFixed(2)}</span>
        </td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="padding: 12px 16px;">
          <strong style="color: #6b7280; font-size: 14px;">Next Billing Date</strong>
        </td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="color: #111827; font-size: 14px;">${nextBillingFormatted}</span>
        </td>
      </tr>
    </table>

    ${
      immediate && prorationAmount > 0
        ? `
    <div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
        <strong>💳 Prorated Charge:</strong> You've been charged $${prorationAmount.toFixed(2)} for the upgrade. This amount represents the difference between your old and new plan for the remainder of your current billing period.
      </p>
    </div>
    `
        : ""
    }

    <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">
        ✨ What's New with ${newPlanName}:
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #0c4a6e; line-height: 1.8;">
        ${
          newPlanName === "Starter"
            ? `
        <li>Up to 5 monitors</li>
        <li>5-minute check intervals</li>
        <li>Email alerts</li>
        `
            : newPlanName === "Pro"
              ? `
        <li>Up to 25 monitors</li>
        <li>1-minute check intervals</li>
        <li>Email, Slack & webhook alerts</li>
        <li>Advanced analytics</li>
        `
              : newPlanName === "Team"
                ? `
        <li>Up to 100 monitors</li>
        <li>1-minute check intervals</li>
        <li>Email, Slack & webhook alerts</li>
        <li>Team collaboration</li>
        <li>Advanced analytics</li>
        <li>Priority support</li>
        `
                : ""
        }
      </ul>
    </div>

    <table style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="padding: 0; text-align: center;">
          <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #6b7280; margin-top: 32px; background-color: #f9fafb; padding: 16px; border-radius: 6px;">
      <strong>Questions?</strong> If you have any questions about your upgrade or billing, please don't hesitate to contact our support team.
    </p>
  `

  return emailLayout({
    title: `Plan Upgraded to ${newPlanName}!`,
    previewText: `Your CronNarc plan has been ${immediate ? "upgraded" : "scheduled for upgrade"} to ${newPlanName}.`,
    content: content.replace(/{{dashboardUrl}}/g, dashboardUrl),
  })
}

/**
 * Downgrade confirmation email
 */
export function downgradeConfirmationEmail({
  newPlanName,
  archivedCount,
  appliesAt,
  dashboardUrl,
}: {
  newPlanName: string
  archivedCount: number
  appliesAt: Date
  dashboardUrl: string
}): string {
  const appliesAtFormatted = appliesAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const content = `
    <h1 style="font-size: 24px; font-weight: 700; color: #1f2937; margin: 0 0 16px 0;">
      Plan Downgrade Scheduled
    </h1>

    <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 16px 0;">
      Hi there,
    </p>

    <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 16px 0;">
      Your plan downgrade to <strong>${newPlanName}</strong> has been scheduled and will take effect on
      <strong>${appliesAtFormatted}</strong> at the end of your current billing period.
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-size: 14px; line-height: 20px; color: #92400e; margin: 0;">
        <strong>⚠️ Important:</strong> ${archivedCount} monitor${archivedCount !== 1 ? "s have" : " has"} been archived and will be
        automatically deleted in 30 days. You can restore archived monitors by upgrading your plan before the deletion date.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 16px 0;">
      <strong>What happens next:</strong>
    </p>

    <ul style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 24px 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Your current plan remains active until ${appliesAtFormatted}</li>
      <li style="margin-bottom: 8px;">Archived monitors are paused and will not send alerts</li>
      <li style="margin-bottom: 8px;">After 30 days, archived monitors will be permanently deleted</li>
      <li style="margin-bottom: 8px;">You can upgrade anytime to restore archived monitors</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="{{dashboardUrl}}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Dashboard
      </a>
    </div>

    <p style="font-size: 14px; line-height: 20px; color: #6b7280; margin: 24px 0 0 0;">
      If you have any questions or need to make changes, please visit your
      <a href="{{dashboardUrl}}/profile" style="color: #667eea; text-decoration: none;">account settings</a>.
    </p>
  `

  return emailLayout({
    title: `Plan Downgrade Scheduled - ${newPlanName}`,
    previewText: `Your plan downgrade to ${newPlanName} has been scheduled for ${appliesAtFormatted}.`,
    content: content.replace(/{{dashboardUrl}}/g, dashboardUrl),
  })
}

/**
 * Subscriber Monitor Down Email Template
 */
interface SubscriberMonitorDownEmailProps {
  monitorName: string
  statusPageUrl: string
  lastPingAt: string | null
  unsubscribeUrl: string
}

export function subscriberMonitorDownEmail({ monitorName, statusPageUrl, lastPingAt, unsubscribeUrl }: SubscriberMonitorDownEmailProps): string {
  const content = `
    <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
      🚨 Service Down: ${monitorName}
    </h2>

    <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 24px 0;">
      The service you're monitoring has stopped responding and is now marked as <strong style="color: #dc2626;">DOWN</strong>.
    </p>

    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-size: 14px; color: #991b1b; margin: 0;">
        <strong>Last Check-in:</strong> ${lastPingAt || "Never"}
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${statusPageUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Status Page
      </a>
    </div>

    <p style="font-size: 14px; line-height: 20px; color: #6b7280; margin: 24px 0 0 0;">
      You're receiving this because you subscribed to updates for ${monitorName}.
      <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
    </p>
  `

  return emailLayout({
    title: `🚨 Service Down: ${monitorName}`,
    previewText: `${monitorName} has stopped responding and is now marked as DOWN.`,
    content,
  })
}

/**
 * Subscriber Monitor Recovery Email Template
 */
interface SubscriberMonitorRecoveryEmailProps {
  monitorName: string
  statusPageUrl: string
  downtimeMinutes: number
  unsubscribeUrl: string
}

export function subscriberMonitorRecoveryEmail({
  monitorName,
  statusPageUrl,
  downtimeMinutes,
  unsubscribeUrl,
}: SubscriberMonitorRecoveryEmailProps): string {
  const content = `
    <h2 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
      ✅ Service Recovered: ${monitorName}
    </h2>

    <p style="font-size: 16px; line-height: 24px; color: #4b5563; margin: 0 0 24px 0;">
      Good news! The service has recovered and is now <strong style="color: #059669;">HEALTHY</strong>.
    </p>

    <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <p style="font-size: 14px; color: #065f46; margin: 0;">
        <strong>Total Downtime:</strong> ${downtimeMinutes} minutes
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${statusPageUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Status Page
      </a>
    </div>

    <p style="font-size: 14px; line-height: 20px; color: #6b7280; margin: 24px 0 0 0;">
      You're receiving this because you subscribed to updates for ${monitorName}.
      <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
    </p>
  `

  return emailLayout({
    title: `✅ Service Recovered: ${monitorName}`,
    previewText: `${monitorName} has recovered after ${downtimeMinutes} minutes of downtime.`,
    content,
  })
}
