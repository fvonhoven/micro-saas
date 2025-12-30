export const PLANS = {
  cronguard: {
    starter: {
      name: 'Starter',
      priceId: process.env.STRIPE_CRONGUARD_STARTER_PRICE_ID || 'price_cronguard_starter',
      price: 9,
      limits: { monitors: 5 },
    },
    pro: {
      name: 'Pro',
      priceId: process.env.STRIPE_CRONGUARD_PRO_PRICE_ID || 'price_cronguard_pro',
      price: 29,
      limits: { monitors: 25 },
    },
    team: {
      name: 'Team',
      priceId: process.env.STRIPE_CRONGUARD_TEAM_PRICE_ID || 'price_cronguard_team',
      price: 79,
      limits: { monitors: -1 }, // unlimited
    },
  },
  formvault: {
    solo: {
      name: 'Solo',
      priceId: process.env.STRIPE_FORMVAULT_SOLO_PRICE_ID || 'price_formvault_solo',
      price: 24,
      limits: { storageGB: 10 },
    },
    pro: {
      name: 'Pro',
      priceId: process.env.STRIPE_FORMVAULT_PRO_PRICE_ID || 'price_formvault_pro',
      price: 49,
      limits: { storageGB: 50 },
    },
    agency: {
      name: 'Agency',
      priceId: process.env.STRIPE_FORMVAULT_AGENCY_PRICE_ID || 'price_formvault_agency',
      price: 99,
      limits: { storageGB: 500 },
    },
  },
  snipshot: {
    starter: {
      name: 'Starter',
      priceId: process.env.STRIPE_SNIPSHOT_STARTER_PRICE_ID || 'price_snipshot_starter',
      price: 19,
      limits: { screenshots: 500 },
    },
    pro: {
      name: 'Pro',
      priceId: process.env.STRIPE_SNIPSHOT_PRO_PRICE_ID || 'price_snipshot_pro',
      price: 49,
      limits: { screenshots: 2500 },
    },
    scale: {
      name: 'Scale',
      priceId: process.env.STRIPE_SNIPSHOT_SCALE_PRICE_ID || 'price_snipshot_scale',
      price: 99,
      limits: { screenshots: 10000 },
    },
  },
} as const

export type Product = keyof typeof PLANS
export type Plan<P extends Product> = keyof typeof PLANS[P]

