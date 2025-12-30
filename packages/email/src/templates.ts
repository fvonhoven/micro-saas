export const templates = {
  cronguard: {
    monitorDown: (monitorName: string, downSince: Date) => ({
      subject: `🚨 Monitor Down: ${monitorName}`,
      html: `
        <h1>Monitor Alert</h1>
        <p>Your monitor <strong>${monitorName}</strong> has not checked in and is now marked as DOWN.</p>
        <p>Down since: ${downSince.toLocaleString()}</p>
        <p>Please check your cron job immediately.</p>
      `,
    }),
    monitorRecovered: (monitorName: string) => ({
      subject: `✅ Monitor Recovered: ${monitorName}`,
      html: `
        <h1>Monitor Recovered</h1>
        <p>Your monitor <strong>${monitorName}</strong> has recovered and is now HEALTHY.</p>
      `,
    }),
  },
  formvault: {
    accessLink: (formName: string, link: string, expiresAt: Date) => ({
      subject: `Upload documents to ${formName}`,
      html: `
        <h1>Document Upload Request</h1>
        <p>You've been invited to upload documents to <strong>${formName}</strong>.</p>
        <p><a href="${link}">Click here to upload</a></p>
        <p>This link expires on ${expiresAt.toLocaleString()}</p>
      `,
    }),
    submissionReceived: (formName: string, clientName: string, fileCount: number) => ({
      subject: `New submission for ${formName}`,
      html: `
        <h1>New Submission</h1>
        <p><strong>${clientName}</strong> has submitted ${fileCount} file(s) to <strong>${formName}</strong>.</p>
      `,
    }),
  },
  snipshot: {
    apiKeyCreated: (keyName: string, apiKey: string) => ({
      subject: `Your SnipShot API Key: ${keyName}`,
      html: `
        <h1>API Key Created</h1>
        <p>Your API key <strong>${keyName}</strong> has been created.</p>
        <p>API Key: <code>${apiKey}</code></p>
        <p><strong>Keep this key secure. It will not be shown again.</strong></p>
      `,
    }),
  },
}

