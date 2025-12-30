import type Stripe from 'stripe'
import { adminDb } from '@repo/firebase/admin'
import { stripe } from './stripe'

export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId) {
        console.error('No userId in session metadata')
        return
      }

      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await adminDb
          .collection('users')
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

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) {
        console.error('No userId in subscription metadata')
        return
      }

      await adminDb
        .collection('users')
        .doc(userId)
        .update({
          stripePriceId: subscription.items.data[0]?.price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId

      if (!userId) {
        console.error('No userId in subscription metadata')
        return
      }

      await adminDb
        .collection('users')
        .doc(userId)
        .update({
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        })
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

