import type { CardAnalysis } from '../types/card';
import type { PricingData, SalesComp } from '../types/pricing';

// SportsCardsPro / PriceCharting API
const SCP_BASE_URL = 'https://www.pricecharting.com/api';

interface SCPProduct {
  id: string;
  'product-name': string;
  'console-name'?: string;
  price?: number;
  'cib-price'?: number;
  'loose-price'?: number;
  'new-price'?: number;
  'graded-price'?: number;
  'psa-10-price'?: number;
  'bgs-9.5-price'?: number;
}

function buildSCPQuery(card: CardAnalysis): string {
  const parts: string[] = [];
  if (card.year) parts.push(String(card.year));
  if (card.brand) parts.push(card.brand);
  if (card.set_name) parts.push(card.set_name);
  if (card.player_name) parts.push(card.player_name);
  return parts.join(' ');
}

export async function lookupSCPPricing(card: CardAnalysis): Promise<PricingData | null> {
  const apiKey = process.env.SPORTSCARDSPRO_API_KEY;
  if (!apiKey) {
    console.log('[SportsCardsPro] No API key configured, skipping');
    return null;
  }

  const query = buildSCPQuery(card);

  try {
    // Search for the product
    const searchUrl = `${SCP_BASE_URL}/products?t=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&type=sports-cards`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error(`[SportsCardsPro] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const products: SCPProduct[] = data.products || [];

    if (products.length === 0) {
      console.log('[SportsCardsPro] No results found');
      return null;
    }

    // Get the best match (first result) and extract all available prices
    const sales: SalesComp[] = [];
    const product = products[0];

    // PriceCharting provides multiple price points per card
    const priceFields: Array<{ key: keyof SCPProduct; label: string }> = [
      { key: 'loose-price', label: 'Raw/Ungraded' },
      { key: 'cib-price', label: 'Complete' },
      { key: 'new-price', label: 'New/Sealed' },
      { key: 'graded-price', label: 'Graded' },
      { key: 'psa-10-price', label: 'PSA 10' },
      { key: 'bgs-9.5-price', label: 'BGS 9.5' },
    ];

    // For ungraded cards, prioritize loose-price
    // For graded, use graded-price or specific grade prices
    const rawPrice = (product['loose-price'] as number) || (product.price as number) || 0;
    const gradedPrice = (product['graded-price'] as number) || (product['psa-10-price'] as number) || 0;

    // Use the most relevant price based on card condition
    const isGraded = card.condition_estimate?.toLowerCase().includes('psa') ||
                     card.condition_estimate?.toLowerCase().includes('bgs') ||
                     card.condition_estimate?.toLowerCase().includes('sgc');

    const primaryPrice = isGraded ? (gradedPrice || rawPrice) : (rawPrice || gradedPrice);

    if (primaryPrice > 0) {
      sales.push({
        sale_price: primaryPrice / 100, // PriceCharting returns cents
        sale_date: new Date().toISOString(),
        listing_title: product['product-name'] || query,
        item_condition: isGraded ? 'Graded' : 'Raw',
        is_graded: isGraded,
      });
    }

    // Add other price points as additional comps
    for (const field of priceFields) {
      const val = product[field.key] as number | undefined;
      if (val && val > 0 && val !== primaryPrice) {
        sales.push({
          sale_price: val / 100,
          sale_date: new Date().toISOString(),
          listing_title: `${product['product-name']} (${field.label})`,
          item_condition: field.label,
          is_graded: field.label.includes('PSA') || field.label.includes('BGS') || field.label.includes('Graded'),
        });
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
      trend: 'stable',
      recommended_auction_start: auctionStart,
      recommended_bin_price: binPrice,
    };
  } catch (err) {
    console.error('[SportsCardsPro] Lookup failed:', err);
    return null;
  }
}
