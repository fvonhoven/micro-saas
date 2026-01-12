import { stripe } from "./stripe"
import { Product, getPlanFromPriceId } from "./plans"

export interface UserSubscription {
  stripePriceId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  stripeCurrentPeriodEnd?: Date | null
}

/**
 * Create a Stripe checkout session for a user to subscribe to a plan
 */
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}

/**
 * Create a Stripe billing portal session for a user to manage their subscription
 */
export async function createBillingPortalSession({ customerId, returnUrl }: { customerId: string; returnUrl: string }) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get the current plan for a user based on their subscription
 */
export function getUserPlan(product: Product, user: UserSubscription) {
  return getPlanFromPriceId(product, user.stripePriceId)
}

/**
 * Check if a user has an active subscription
 */
export function hasActiveSubscription(user: UserSubscription): boolean {
  if (!user.stripeCurrentPeriodEnd) {
    return false
  }

  const periodEnd = user.stripeCurrentPeriodEnd instanceof Date ? user.stripeCurrentPeriodEnd : new Date(user.stripeCurrentPeriodEnd)

  return periodEnd > new Date()
}

/**
 * Update a user's subscription to a new plan
 * @param immediate - If true, apply changes immediately with proration. If false, apply at end of period.
 */
export async function updateSubscription({
  subscriptionId,
  newPriceId,
  immediate = true,
}: {
  subscriptionId: string
  newPriceId: string
  immediate?: boolean
}) {
  // Retrieve the current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update the subscription with the new price
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: immediate ? "always_invoice" : "none", // Charge/credit immediately or at period end
    billing_cycle_anchor: immediate ? "now" : "unchanged", // Reset billing cycle or keep current
  })

  return updatedSubscription
}

/**
 * Preview the proration amount for a subscription change
 * Returns the amount that will be charged (positive) or credited (negative) in cents
 */
export async function previewProration({ subscriptionId, newPriceId }: { subscriptionId: string; newPriceId: string }) {
  // Retrieve the current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Create an upcoming invoice preview with the new price
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    subscription_items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    subscription_proration_behavior: "always_invoice",
  })

  // Calculate the proration amount
  // This includes the credit for unused time on the old plan and the charge for the new plan
  const prorationAmount = upcomingInvoice.amount_due

  return {
    amount: prorationAmount, // Amount in cents
    amountDue: prorationAmount / 100, // Amount in dollars
    currency: upcomingInvoice.currency,
    periodStart: new Date(upcomingInvoice.period_start * 1000),
    periodEnd: new Date(upcomingInvoice.period_end * 1000),
    lines: upcomingInvoice.lines.data.map(line => ({
      description: line.description,
      amount: line.amount,
      proration: line.proration,
    })),
  }
}

/**
 * Cancel a user's subscription immediately
 */
export async function cancelSubscription({ subscriptionId }: { subscriptionId: string }) {
  const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId)
  return canceledSubscription
}
