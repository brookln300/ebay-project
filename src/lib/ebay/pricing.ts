import type { CardAnalysis } from '../types/card';
import type { PricingData, SalesComp } from '../types/pricing';
import { getEbayClient } from './client';

function buildSearchQuery(card: CardAnalysis): string {
  const parts: string[] = [];
  if (card.year) parts.push(String(card.year));
  if (card.brand) parts.push(card.brand);
  if (card.set_name) parts.push(card.set_name);
  if (card.player_name) parts.push(card.player_name);
  if (card.parallel) parts.push(card.parallel);
  if (card.card_number) parts.push(`#${card.card_number}`);
  return parts.join(' ');
}

function calculateTrend(sales: SalesComp[]): 'up' | 'down' | 'stable' {
  if (sales.length < 4) return 'stable';

  const sorted = [...sales].sort(
    (a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avgFirst =
    firstHalf.reduce((sum, s) => sum + s.sale_price, 0) / firstHalf.length;
  const avgSecond =
    secondHalf.reduce((sum, s) => sum + s.sale_price, 0) / secondHalf.length;

  const pctChange = (avgSecond - avgFirst) / avgFirst;
  if (pctChange > 0.1) return 'up';
  if (pctChange < -0.1) return 'down';
  return 'stable';
}

export async function lookupPricing(card: CardAnalysis): Promise<PricingData> {
  const query = buildSearchQuery(card);
  const ebay = getEbayClient();

  let recentSales: SalesComp[] = [];

  try {
    // Search completed/sold listings via Browse API
    const result = await ebay.buy.browse.search({
      q: query,
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION},conditions:{UNSPECIFIED}',
      sort: '-date',
      limit: '30',
    });

    if (result.itemSummaries) {
      recentSales = result.itemSummaries.map((item: Record<string, unknown>) => ({
        sale_price: parseFloat((item.price as Record<string, string>)?.value || '0'),
        sale_date: (item.itemEndDate as string) || new Date().toISOString(),
        listing_title: (item.title as string) || '',
        item_condition: (item.condition as string) || 'Unspecified',
        is_graded: /PSA|BGS|SGC|CGC/i.test((item.title as string) || ''),
        grade_company: undefined,
        grade_value: undefined,
      }));
    }
  } catch (err) {
    console.error('eBay pricing lookup failed:', err);
  }

  // Fallback: generate estimates if no sales found
  if (recentSales.length === 0) {
    return {
      median: 0,
      average: 0,
      low: 0,
      high: 0,
      sample_size: 0,
      recent_sales: [],
      trend: 'stable',
      recommended_auction_start: 0.99,
      recommended_bin_price: 4.99,
    };
  }

  const prices = recentSales.map((s) => s.sale_price).sort((a, b) => a - b);
  const median =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;
  const low = prices[0];
  const high = prices[prices.length - 1];
  const trend = calculateTrend(recentSales);

  // Auction starts at 70% of median; BIN at median (or +10% if trending up)
  const auctionStart = Math.max(0.99, Math.round(median * 0.7 * 100) / 100);
  const binMultiplier = trend === 'up' ? 1.1 : 1.0;
  const binPrice = Math.max(1.99, Math.round(median * binMultiplier * 100) / 100);

  return {
    median,
    average,
    low,
    high,
    sample_size: recentSales.length,
    recent_sales: recentSales,
    trend,
    recommended_auction_start: auctionStart,
    recommended_bin_price: binPrice,
  };
}
