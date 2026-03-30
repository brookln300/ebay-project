import type { CardAnalysis } from '../types/card';
import type { PricingData } from '../types/pricing';
import { lookupZylaPricing } from './zyla-client';
import { lookupSCPPricing } from './sportscardspro-client';
import { lookupEbayPricing } from './ebay-adapter';

export type PricingSource = 'ebay' | 'zyla' | 'sportscardspro' | 'fallback';

export interface PricingResult {
  data: PricingData;
  source: PricingSource;
  sourcesAttempted: PricingSource[];
}

/**
 * Waterfall pricing lookup:
 *   1. eBay Browse API (best — real sold data)
 *   2. Zyla Labs Sports Card API (primary fallback)
 *   3. SportsCardsPro / PriceCharting (secondary fallback)
 *   4. Minimum defaults (last resort)
 */
export async function lookupPricingWaterfall(card: CardAnalysis): Promise<PricingResult> {
  const attempted: PricingSource[] = [];

  // 1. eBay API
  attempted.push('ebay');
  console.log('[Pricing] Trying eBay API...');
  const ebayResult = await lookupEbayPricing(card);
  if (ebayResult && ebayResult.sample_size > 0) {
    console.log(`[Pricing] eBay returned ${ebayResult.sample_size} comps`);
    return { data: ebayResult, source: 'ebay', sourcesAttempted: attempted };
  }

  // 2. Zyla Labs
  attempted.push('zyla');
  console.log('[Pricing] eBay empty, trying Zyla Labs...');
  const zylaResult = await lookupZylaPricing(card);
  if (zylaResult && zylaResult.sample_size > 0) {
    console.log(`[Pricing] Zyla returned ${zylaResult.sample_size} comps`);
    return { data: zylaResult, source: 'zyla', sourcesAttempted: attempted };
  }

  // 3. SportsCardsPro / PriceCharting
  attempted.push('sportscardspro');
  console.log('[Pricing] Zyla empty, trying SportsCardsPro...');
  const scpResult = await lookupSCPPricing(card);
  if (scpResult && scpResult.sample_size > 0) {
    console.log(`[Pricing] SportsCardsPro returned ${scpResult.sample_size} comps`);
    return { data: scpResult, source: 'sportscardspro', sourcesAttempted: attempted };
  }

  // 4. Fallback defaults
  attempted.push('fallback');
  console.log('[Pricing] All sources empty, using minimum defaults');
  return {
    data: {
      median: 0,
      average: 0,
      low: 0,
      high: 0,
      sample_size: 0,
      recent_sales: [],
      trend: 'stable',
      recommended_auction_start: 0.99,
      recommended_bin_price: 4.99,
    },
    source: 'fallback',
    sourcesAttempted: attempted,
  };
}
