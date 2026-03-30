export interface TierLimits {
  scans_per_day: number;
  scans_per_month: number;
  listings_per_month: number;
  price_monthly: number;
  stripe_price_id: string | null;
}

export const TIERS: Record<string, TierLimits> = {
  free: {
    scans_per_day: 2,
    scans_per_month: 60,
    listings_per_month: 60,
    price_monthly: 0,
    stripe_price_id: null,
  },
  premium: {
    scans_per_day: 25,
    scans_per_month: 200,
    listings_per_month: 200,
    price_monthly: 9.99,
    stripe_price_id: process.env.STRIPE_PREMIUM_PRICE_ID || '',
  },
  pro: {
    scans_per_day: 100,
    scans_per_month: 1000,
    listings_per_month: 1000,
    price_monthly: 29.99,
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || '',
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIERS[tier] || TIERS.free;
}
