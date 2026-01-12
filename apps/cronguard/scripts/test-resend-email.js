#!/usr/bin/env node

/**
 * Test script to verify Resend email configuration
 *
 * Usage:
 *   node scripts/test-resend-email.js your-email@example.com
 */

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" })

const { Resend } = require("resend")

const recipientEmail = process.argv[2]

if (!recipientEmail) {
  console.error("❌ Error: Please provide a recipient email address")
  console.log("Usage: node scripts/test-resend-email.js your-email@example.com")
  process.exit(1)
}

if (!process.env.RESEND_API_KEY) {
  console.error("❌ Error: RESEND_API_KEY environment variable is not set")
  console.log("Make sure you have a .env.local file with RESEND_API_KEY")
  process.exit(1)
}

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.log("📧 Testing Resend email configuration...\n")
  console.log(`Sender: CronNarc <noreply@cronnarc.com>`)
  console.log(`Recipient: ${recipientEmail}\n`)

  try {
    const result = await resend.emails.send({
      from: "CronNarc <noreply@cronnarc.com>",
      to: recipientEmail,
      subject: "🧪 Test Email from CronNarc",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Test Email</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #111827; margin-top: 0;">Email Configuration Test</h2>
              <p style="color: #374151; line-height: 1.6;">
                This is a test email from <strong>CronNarc</strong> to verify your Resend email configuration.
              </p>
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0; color: #065f46;">
                  ✅ <strong>Success!</strong> If you're reading this, your email configuration is working correctly.
                </p>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                <strong>Sender:</strong> CronNarc &lt;noreply@cronnarc.com&gt;<br>
                <strong>Sent via:</strong> Resend
              </p>
            </div>
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Powered by <strong style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">CronNarc</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    console.log("✅ Email sent successfully!\n")
    console.log("Response:", JSON.stringify(result, null, 2))
    console.log("\n📬 Check your inbox at:", recipientEmail)
    console.log('\n💡 If you received the email from "CronNarc <noreply@cronnarc.com>", your configuration is correct!')
    console.log('💡 If you received it from "onboarding@resend.dev", you need to verify your domain in Resend.')
  } catch (error) {
    console.error("❌ Error sending email:", error.message)

    if (error.message.includes("domain")) {
      console.log("\n💡 Domain not verified. Steps to fix:")
      console.log("1. Go to https://resend.com/domains")
      console.log("2. Add and verify cronnarc.com")
      console.log("3. Add the required DNS records")
      console.log("4. Wait for verification (can take a few minutes)")
    }

    process.exit(1)
  }
}

testEmail()
