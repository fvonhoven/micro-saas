import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { handleStripeWebhook } from "@repo/billing"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    )
  }

  console.log(`Received webhook event: ${event.type}`)

  try {
    await handleStripeWebhook(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Error handling webhook:", err)
    return NextResponse.json(
      { error: `Webhook handler failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    )
  }
}

