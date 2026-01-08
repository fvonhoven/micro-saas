/**
 * Generate HTML preview of email templates
 * Run with: node preview-emails.js
 */

// Since we can't directly import TypeScript, we'll inline the templates here
// This is just for preview purposes

function emailLayout({ title, previewText, content }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
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
        <a href="http://localhost:3000/dashboard" style="color: #667eea; text-decoration: none;">View Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function monitorDownEmail({ monitorName, monitorUrl, lastPingAt, expectedBy, currentTime, dashboardUrl }) {
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
    content,
  })
}

function monitorRecoveryEmail({ monitorName, monitorUrl, wentDownAt, recoveredAt, downtimeMinutes, dashboardUrl }) {
  const formatDowntime = minutes => {
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
    content,
  })
}

// Generate sample emails
const fs = require("fs")
const path = require("path")

const downHtml = monitorDownEmail({
  monitorName: "Daily Backup Job",
  monitorUrl: "http://localhost:3000/dashboard/monitors/abc123",
  lastPingAt: "Jan 6, 2026, 2:30 PM",
  expectedBy: "Jan 6, 2026, 3:00 PM",
  currentTime: "Jan 6, 2026, 3:15 PM",
  dashboardUrl: "http://localhost:3000/dashboard",
})

const recoveryHtml = monitorRecoveryEmail({
  monitorName: "Daily Backup Job",
  monitorUrl: "http://localhost:3000/dashboard/monitors/abc123",
  wentDownAt: "Jan 6, 2026, 3:00 PM",
  recoveredAt: "Jan 6, 2026, 4:30 PM",
  downtimeMinutes: 90,
  dashboardUrl: "http://localhost:3000/dashboard",
})

// Save to files
fs.writeFileSync(path.join(__dirname, "email-preview-down.html"), downHtml)
fs.writeFileSync(path.join(__dirname, "email-preview-recovery.html"), recoveryHtml)

console.log("✅ Email previews generated!")
console.log("📧 Down alert: email-preview-down.html")
console.log("📧 Recovery: email-preview-recovery.html")
console.log("\nOpen these files in your browser to preview the emails.")
