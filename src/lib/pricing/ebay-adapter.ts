/**
 * Wraps the existing eBay pricing lookup to match the waterfall interface.
 * Separated so the original ebay/pricing.ts stays intact for direct use.
 */
import type { CardAnalysis } from '../types/card';
import type { PricingData } from '../types/pricing';
import { lookupPricing } from '../ebay/pricing';

export async function lookupEbayPricing(card: CardAnalysis): Promise<PricingData | null> {
  try {
    const result = await lookupPricing(card);
    // Only return if we actually got real data
    if (result.sample_size > 0) return result;
    return null;
  } catch (err) {
    console.error('[eBay Adapter] Lookup failed:', err);
    return null;
  }
}
