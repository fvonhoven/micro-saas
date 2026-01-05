// Client-safe plan metadata (no environment variables)
export const PLAN_METADATA = {
  cronguard: {
    free: {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { monitors: 2 },
    },
    starter: {
      name: "Starter",
      monthlyPrice: 15,
      annualPrice: 11, // 25% discount ($15 * 0.75 = $11.25, rounded to $11)
      limits: { monitors: 5 },
    },
    pro: {
      name: "Pro",
      monthlyPrice: 39,
      annualPrice: 29, // 25% discount ($39 * 0.75 = $29.25, rounded to $29)
      limits: { monitors: 25 },
    },
    team: {
      name: "Team",
      monthlyPrice: 99,
      annualPrice: 74, // 25% discount ($99 * 0.75 = $74.25, rounded to $74)
      limits: { monitors: 100 }, // capped at 100
    },
  },
  formvault: {
    free: {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { storageGB: 1 },
    },
    solo: {
      name: "Solo",
      monthlyPrice: 29,
      annualPrice: 23, // 20% discount (~$23.20, rounded to $23)
      limits: { storageGB: 10 },
    },
    pro: {
      name: "Pro",
      monthlyPrice: 59,
      annualPrice: 47, // 20% discount (~$47.20, rounded to $47)
      limits: { storageGB: 50 },
    },
    agency: {
      name: "Agency",
      monthlyPrice: 119,
      annualPrice: 95, // 20% discount (~$95.20, rounded to $95)
      limits: { storageGB: 500 },
    },
  },
  snipshot: {
    free: {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { screenshots: 100 },
    },
    starter: {
      name: "Starter",
      monthlyPrice: 25,
      annualPrice: 20, // 20% discount
      limits: { screenshots: 500 },
    },
    pro: {
      name: "Pro",
      monthlyPrice: 59,
      annualPrice: 47, // 20% discount (~$47.20, rounded to $47)
      limits: { screenshots: 2500 },
    },
    scale: {
      name: "Scale",
      monthlyPrice: 119,
      annualPrice: 95, // 20% discount (~$95.20, rounded to $95)
      limits: { screenshots: 10000 },
    },
  },
} as const

// Server-side PLANS with Stripe price IDs (uses process.env)
export const PLANS = {
  cronguard: {
    free: {
      name: "Free",
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { monitors: 2 },
    },
    starter: {
      name: "Starter",
      monthlyPriceId: process.env.STRIPE_CRONGUARD_STARTER_MONTHLY_PRICE_ID || "price_cronguard_starter_monthly",
      annualPriceId: process.env.STRIPE_CRONGUARD_STARTER_ANNUAL_PRICE_ID || "price_cronguard_starter_annual",
      monthlyPrice: 15,
      annualPrice: 11,
      limits: { monitors: 5 },
    },
    pro: {
      name: "Pro",
      monthlyPriceId: process.env.STRIPE_CRONGUARD_PRO_MONTHLY_PRICE_ID || "price_cronguard_pro_monthly",
      annualPriceId: process.env.STRIPE_CRONGUARD_PRO_ANNUAL_PRICE_ID || "price_cronguard_pro_annual",
      monthlyPrice: 39,
      annualPrice: 29,
      limits: { monitors: 25 },
    },
    team: {
      name: "Team",
      monthlyPriceId: process.env.STRIPE_CRONGUARD_TEAM_MONTHLY_PRICE_ID || "price_cronguard_team_monthly",
      annualPriceId: process.env.STRIPE_CRONGUARD_TEAM_ANNUAL_PRICE_ID || "price_cronguard_team_annual",
      monthlyPrice: 99,
      annualPrice: 74,
      limits: { monitors: 100 },
    },
  },
  formvault: {
    free: {
      name: "Free",
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { storageGB: 1 },
    },
    solo: {
      name: "Solo",
      monthlyPriceId: process.env.STRIPE_FORMVAULT_SOLO_MONTHLY_PRICE_ID || "price_formvault_solo_monthly",
      annualPriceId: process.env.STRIPE_FORMVAULT_SOLO_ANNUAL_PRICE_ID || "price_formvault_solo_annual",
      monthlyPrice: 29,
      annualPrice: 23,
      limits: { storageGB: 10 },
    },
    pro: {
      name: "Pro",
      monthlyPriceId: process.env.STRIPE_FORMVAULT_PRO_MONTHLY_PRICE_ID || "price_formvault_pro_monthly",
      annualPriceId: process.env.STRIPE_FORMVAULT_PRO_ANNUAL_PRICE_ID || "price_formvault_pro_annual",
      monthlyPrice: 59,
      annualPrice: 47,
      limits: { storageGB: 50 },
    },
    agency: {
      name: "Agency",
      monthlyPriceId: process.env.STRIPE_FORMVAULT_AGENCY_MONTHLY_PRICE_ID || "price_formvault_agency_monthly",
      annualPriceId: process.env.STRIPE_FORMVAULT_AGENCY_ANNUAL_PRICE_ID || "price_formvault_agency_annual",
      monthlyPrice: 119,
      annualPrice: 95,
      limits: { storageGB: 500 },
    },
  },
  snipshot: {
    free: {
      name: "Free",
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      limits: { screenshots: 100 },
    },
    starter: {
      name: "Starter",
      monthlyPriceId: process.env.STRIPE_SNIPSHOT_STARTER_MONTHLY_PRICE_ID || "price_snipshot_starter_monthly",
      annualPriceId: process.env.STRIPE_SNIPSHOT_STARTER_ANNUAL_PRICE_ID || "price_snipshot_starter_annual",
      monthlyPrice: 25,
      annualPrice: 20,
      limits: { screenshots: 500 },
    },
    pro: {
      name: "Pro",
      monthlyPriceId: process.env.STRIPE_SNIPSHOT_PRO_MONTHLY_PRICE_ID || "price_snipshot_pro_monthly",
      annualPriceId: process.env.STRIPE_SNIPSHOT_PRO_ANNUAL_PRICE_ID || "price_snipshot_pro_annual",
      monthlyPrice: 59,
      annualPrice: 47,
      limits: { screenshots: 2500 },
    },
    scale: {
      name: "Scale",
      monthlyPriceId: process.env.STRIPE_SNIPSHOT_SCALE_MONTHLY_PRICE_ID || "price_snipshot_scale_monthly",
      annualPriceId: process.env.STRIPE_SNIPSHOT_SCALE_ANNUAL_PRICE_ID || "price_snipshot_scale_annual",
      monthlyPrice: 119,
      annualPrice: 95,
      limits: { screenshots: 10000 },
    },
  },
} as const

export type Product = keyof typeof PLAN_METADATA
export type Plan<P extends Product> = keyof (typeof PLAN_METADATA)[P]

// Helper function to get plan from price ID (server-side only)
export function getPlanFromPriceId(product: Product, priceId: string | null | undefined) {
  if (!priceId) {
    return PLANS[product].free
  }

  const plans = PLANS[product]
  for (const [key, plan] of Object.entries(plans)) {
    if ("monthlyPriceId" in plan && (plan.monthlyPriceId === priceId || plan.annualPriceId === priceId)) {
      return plan
    }
    if ("priceId" in plan && plan.priceId === priceId) {
      return plan
    }
  }

  // Default to free if price ID not found
  return PLANS[product].free
}

// Helper function to get all plans for a product as an array (client-safe)
export function getPlansArray(product: Product) {
  return Object.entries(PLAN_METADATA[product]).map(([key, plan]) => ({
    id: key,
    ...plan,
  }))
}
