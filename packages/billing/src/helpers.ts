import { stripe } from './stripe'
import { Product, getPlanFromPriceId } from './plans'

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
    mode: 'subscription',
    payment_method_types: ['card'],
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
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
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

  const periodEnd = user.stripeCurrentPeriodEnd instanceof Date 
    ? user.stripeCurrentPeriodEnd 
    : new Date(user.stripeCurrentPeriodEnd)

  return periodEnd > new Date()
}

