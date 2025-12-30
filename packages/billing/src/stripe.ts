import Stripe from "stripe"

// Lazy initialization to avoid build-time errors when env vars aren't set
let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not set")
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
        typescript: true,
      })
    }
    return _stripe[prop as keyof Stripe]
  },
})
