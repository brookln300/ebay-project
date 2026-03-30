import type { CardAnalysis } from '../types/card';
import type { PricingData, SalesComp } from '../types/pricing';

const ZYLA_BASE_URL = 'https://zylalabs.com/api/4962/sports+cards+data+api';

interface ZylaCardResult {
  name: string;
  set: string;
  year: string;
  number: string;
  price?: number;
  prices?: {
    usd?: number;
    usd_foil?: number;
    eur?: number;
  };
  market_price?: number;
  recent_sales?: Array<{
    price: number;
    date: string;
    condition?: string;
    title?: string;
  }>;
}

function buildZylaQuery(card: CardAnalysis): string {
  const parts: string[] = [];
  if (card.year) parts.push(String(card.year));
  if (card.brand) parts.push(card.brand);
  if (card.set_name) parts.push(card.set_name);
  if (card.player_name) parts.push(card.player_name);
  if (card.card_number) parts.push(card.card_number);
  return parts.join(' ');
}

export async function lookupZylaPricing(card: CardAnalysis): Promise<PricingData | null> {
  const apiKey = process.env.ZYLA_API_KEY;
  if (!apiKey) {
    console.log('[Zyla] No API key configured, skipping');
    return null;
  }

  const query = buildZylaQuery(card);

  try {
    const response = await fetch(`${ZYLA_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Zyla] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results: ZylaCardResult[] = data.results || data.data || [];

    if (results.length === 0) {
      console.log('[Zyla] No results found');
      return null;
    }

    // Extract pricing from results
    const sales: SalesComp[] = [];

    for (const result of results.slice(0, 20)) {
      // Pull from recent_sales if available
      if (result.recent_sales) {
        for (const sale of result.recent_sales) {
          sales.push({
            sale_price: sale.price,
            sale_date: sale.date || new Date().toISOString(),
            listing_title: sale.title || `${result.year} ${result.set} ${result.name}`,
            item_condition: sale.condition || 'Unspecified',
            is_graded: /PSA|BGS|SGC|CGC/i.test(sale.title || ''),
          });
        }
      }
      // Fall back to market_price or price fields
      else if (result.market_price || result.price || result.prices?.usd) {
        const price = result.market_price || result.price || result.prices?.usd || 0;
        if (price > 0) {
          sales.push({
            sale_price: price,
            sale_date: new Date().toISOString(),
            listing_title: `${result.year || ''} ${result.set || ''} ${result.name || ''}`.trim(),
            item_condition: 'Unspecified',
            is_graded: false,
          });
        }
      }
    }

    if (sales.length === 0) return null;

    const prices = sales.map((s) => s.sale_price).sort((a, b) => a - b);
    const median =
      prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;

    const auctionStart = Math.max(0.99, Math.round(median * 0.7 * 100) / 100);
    const binPrice = Math.max(1.99, Math.round(median * 100) / 100);

    return {
      median,
      average,
      low: prices[0],
      high: prices[prices.length - 1],
      sample_size: sales.length,
      recent_sales: sales,
      trend: 'stable', // Zyla doesn't provide trend data natively
      recommended_auction_start: auctionStart,
      recommended_bin_price: binPrice,
    };
  } catch (err) {
    console.error('[Zyla] Lookup failed:', err);
    return null;
  }
}
