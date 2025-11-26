/**
 * Stripe Products and Pricing Configuration
 * Defines subscription tiers for MyFPnA Suite
 */

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

/**
 * Feature limits by subscription tier
 */
export const TIER_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxScenarios: 1,
    maxLineItemsPerScenario: 10,
    aiForecasting: false,
    advancedAnalytics: false,
    excelExport: false,
    apiAccess: false,
    prioritySupport: false,
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    maxScenarios: Infinity,
    maxLineItemsPerScenario: Infinity,
    aiForecasting: true,
    advancedAnalytics: true,
    excelExport: true,
    apiAccess: false,
    prioritySupport: false,
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    maxScenarios: Infinity,
    maxLineItemsPerScenario: Infinity,
    aiForecasting: true,
    advancedAnalytics: true,
    excelExport: true,
    apiAccess: true,
    prioritySupport: true,
  },
} as const;

/**
 * Stripe product and price configuration
 * These will be created in Stripe Dashboard
 */
export const STRIPE_PRODUCTS = {
  PRO_MONTHLY: {
    name: 'MyFPnA Pro',
    description: 'Unlimited scenarios, AI forecasting, and advanced analytics',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly', // Replace with actual Stripe Price ID
    amount: 2900, // $29.00 in cents
    currency: 'usd',
    interval: 'month' as const,
    tier: SUBSCRIPTION_TIERS.PRO,
  },
  PRO_ANNUAL: {
    name: 'MyFPnA Pro (Annual)',
    description: 'Unlimited scenarios, AI forecasting, and advanced analytics - Save 20%',
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
    amount: 27840, // $278.40 in cents (20% discount)
    currency: 'usd',
    interval: 'year' as const,
    tier: SUBSCRIPTION_TIERS.PRO,
  },
  ENTERPRISE_MONTHLY: {
    name: 'MyFPnA Enterprise',
    description: 'All Pro features plus API access and priority support',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    amount: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month' as const,
    tier: SUBSCRIPTION_TIERS.ENTERPRISE,
  },
  ENTERPRISE_ANNUAL: {
    name: 'MyFPnA Enterprise (Annual)',
    description: 'All Pro features plus API access and priority support - Save 20%',
    priceId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_enterprise_annual',
    amount: 95040, // $950.40 in cents (20% discount)
    currency: 'usd',
    interval: 'year' as const,
    tier: SUBSCRIPTION_TIERS.ENTERPRISE,
  },
} as const;

/**
 * Helper function to check if a user has access to a feature
 */
export function hasFeatureAccess(tier: SubscriptionTier, feature: keyof typeof TIER_LIMITS[typeof SUBSCRIPTION_TIERS.FREE]): boolean {
  const limits = TIER_LIMITS[tier];
  return limits[feature] as boolean;
}

/**
 * Helper function to get scenario limit for a tier
 */
export function getScenarioLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].maxScenarios;
}

/**
 * Helper function to get line item limit for a tier
 */
export function getLineItemLimit(tier: SubscriptionTier): number {
  return TIER_LIMITS[tier].maxLineItemsPerScenario;
}
