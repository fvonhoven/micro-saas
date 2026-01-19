import type Stripe from "stripe"
import { adminDb } from "@repo/firebase/admin"
import { stripe } from "./stripe"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId) {
        console.error("No userId in session metadata")
        return
      }

      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await adminDb
          .collection("users")
          .doc(userId)
          .update({
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
      }
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) {
        console.error("No userId in subscription metadata")
        return
      }

      await adminDb
        .collection("users")
        .doc(userId)
        .update({
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) {
        console.error("No userId in subscription metadata")
        return
      }

      // Update user subscription status
      await adminDb.collection("users").doc(userId).update({
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        paymentStatus: "canceled",
        gracePeriodEndsAt: null,
      })

      // Pause all user's monitors
      const monitorsSnapshot = await adminDb.collection("monitors").where("userId", "==", userId).get()

      if (!monitorsSnapshot.empty) {
        const batch = adminDb.batch()
        let pausedCount = 0

        monitorsSnapshot.docs.forEach(doc => {
          // Only pause monitors that aren't already paused
          if (doc.data().status !== "PAUSED") {
            batch.update(doc.ref, { status: "PAUSED" })
            pausedCount++
          }
        })

        await batch.commit()
        console.log(`Subscription canceled for user ${userId}, paused ${pausedCount} monitors`)
      }

      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Find user by Stripe customer ID
      const usersSnapshot = await adminDb.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get()

      if (usersSnapshot.empty) {
        console.error("No user found for customer:", customerId)
        return
      }

      const userDoc = usersSnapshot.docs[0]
      const userId = userDoc.id
      const userData = userDoc.data()

      // Set grace period (7 days from now)
      const gracePeriodEndsAt = new Date()
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 7)

      await adminDb.collection("users").doc(userId).update({
        paymentStatus: "past_due",
        gracePeriodEndsAt,
        lastPaymentFailedAt: new Date(),
      })

      // Send payment failed email
      if (userData.email) {
        await sendPaymentFailedEmail({
          email: userData.email,
          gracePeriodEndsAt,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
        })
      }

      console.log(`Payment failed for user ${userId}, grace period until ${gracePeriodEndsAt.toISOString()}`)
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Find user by Stripe customer ID
      const usersSnapshot = await adminDb.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get()

      if (usersSnapshot.empty) {
        console.error("No user found for customer:", customerId)
        return
      }

      const userDoc = usersSnapshot.docs[0]
      const userId = userDoc.id

      // Clear payment failure status
      await adminDb.collection("users").doc(userId).update({
        paymentStatus: "active",
        gracePeriodEndsAt: null,
        lastPaymentFailedAt: null,
      })

      console.log(`Payment succeeded for user ${userId}, grace period cleared`)
      break
    }

    case "invoice.payment_action_required": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Find user by Stripe customer ID
      const usersSnapshot = await adminDb.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get()

      if (usersSnapshot.empty) {
        console.error("No user found for customer:", customerId)
        return
      }

      const userDoc = usersSnapshot.docs[0]
      const userData = userDoc.data()

      // Send action required email
      if (userData.email) {
        await sendPaymentActionRequiredEmail({
          email: userData.email,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
        })
      }

      console.log(`Payment action required for customer ${customerId}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

/**
 * Send payment failed email
 */
async function sendPaymentFailedEmail({ email, gracePeriodEndsAt, invoiceUrl }: { email: string; gracePeriodEndsAt: Date; invoiceUrl?: string }) {
  const gracePeriodFormatted = gracePeriodEndsAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .warning-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <p>We were unable to process your recent payment for your CronNarc subscription.</p>

      <div class="warning-box">
        <p style="margin: 0; color: #991b1b; font-weight: 600;">
          Your account will remain active until <strong>${gracePeriodFormatted}</strong>
        </p>
      </div>

      <p>To avoid any interruption to your service, please update your payment method as soon as possible.</p>

      ${invoiceUrl ? `<p style="text-align: center;"><a href="${invoiceUrl}" class="button">Update Payment Method</a></p>` : ""}

      <p><strong>What happens next?</strong></p>
      <ul>
        <li>Your monitors will continue to work normally during the grace period</li>
        <li>We'll automatically retry charging your card</li>
        <li>If payment isn't received by ${gracePeriodFormatted}, your monitors will be paused</li>
      </ul>

      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

      <p>Best regards,<br>The CronNarc Team</p>
    </div>
    <div class="footer">
      <p>🕵️ CronNarc - Keeping your cron jobs in check</p>
    </div>
  </div>
</body>
</html>
  `

  await resend.emails.send({
    from: "CronNarc <noreply@cronnarc.com>",
    to: email,
    subject: "⚠️ Payment Failed - Action Required",
    html,
  })
}

/**
 * Send payment action required email
 */
async function sendPaymentActionRequiredEmail({ email, invoiceUrl }: { email: string; invoiceUrl?: string }) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .info-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🔐 Payment Action Required</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <p>Your bank requires additional authentication to process your CronNarc subscription payment.</p>

      <div class="info-box">
        <p style="margin: 0; color: #92400e; font-weight: 600;">
          Please complete the authentication to continue your subscription.
        </p>
      </div>

      ${invoiceUrl ? `<p style="text-align: center;"><a href="${invoiceUrl}" class="button">Complete Authentication</a></p>` : ""}

      <p>This is a security measure required by your bank to protect your payment. The process only takes a moment.</p>

      <p>If you have any questions, please contact our support team.</p>

      <p>Best regards,<br>The CronNarc Team</p>
    </div>
    <div class="footer">
      <p>🕵️ CronNarc - Keeping your cron jobs in check</p>
    </div>
  </div>
</body>
</html>
  `

  await resend.emails.send({
    from: "CronNarc <noreply@cronnarc.com>",
    to: email,
    subject: "🔐 Payment Authentication Required",
    html,
  })
}
