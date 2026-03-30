import type { Card } from '../types/card';
import type { PricingData } from '../types/pricing';

export function buildTitle(card: Card): string {
  const parts: string[] = [];
  if (card.year) parts.push(String(card.year));
  if (card.brand) parts.push(card.brand);
  if (card.set_name) parts.push(card.set_name);
  if (card.player_name) parts.push(card.player_name);
  if (card.card_number) parts.push(`#${card.card_number}`);
  if (card.parallel) parts.push(card.parallel);
  if (card.is_rookie) parts.push('RC');
  if (card.is_auto) parts.push('AUTO');
  if (card.is_numbered && card.numbered_to) parts.push(`/${card.numbered_to}`);

  // eBay title max 80 chars — trim from the end
  let title = parts.join(' ');
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  return title;
}

function buildDescriptionHtml(card: Card, pricing: PricingData | null, type: 'auction' | 'buy_it_now'): string {
  const rows: string[] = [];
  if (card.year) rows.push(`<tr><td><strong>Year</strong></td><td>${card.year}</td></tr>`);
  if (card.brand) rows.push(`<tr><td><strong>Brand</strong></td><td>${card.brand}</td></tr>`);
  if (card.set_name) rows.push(`<tr><td><strong>Set</strong></td><td>${card.set_name}</td></tr>`);
  if (card.player_name) rows.push(`<tr><td><strong>Player</strong></td><td>${card.player_name}</td></tr>`);
  if (card.card_number) rows.push(`<tr><td><strong>Card #</strong></td><td>${card.card_number}</td></tr>`);
  if (card.parallel) rows.push(`<tr><td><strong>Parallel</strong></td><td>${card.parallel}</td></tr>`);
  if (card.sport) rows.push(`<tr><td><strong>Sport</strong></td><td>${card.sport}</td></tr>`);
  if (card.condition_grade) rows.push(`<tr><td><strong>Condition</strong></td><td>${card.condition_grade}</td></tr>`);

  const features: string[] = [];
  if (card.is_rookie) features.push('Rookie Card');
  if (card.is_auto) features.push('Autograph');
  if (card.is_numbered && card.numbered_to) features.push(`Serial Numbered /${card.numbered_to}`);

  const pricingSection = type === 'buy_it_now' && pricing && pricing.sample_size > 0
    ? `<p style="margin-top:10px;color:#666;">Based on ${pricing.sample_size} recent comparable sales ($${pricing.low.toFixed(2)} - $${pricing.high.toFixed(2)})</p>`
    : '';

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <h2 style="color:#333;">${buildTitle(card)}</h2>
  <table style="width:100%;border-collapse:collapse;margin:15px 0;">
    ${rows.map(r => `    ${r}`).join('\n')}
  </table>
  ${features.length > 0 ? `<p><strong>Features:</strong> ${features.join(' | ')}</p>` : ''}
  ${pricingSection}
  <hr style="margin:20px 0;border:none;border-top:1px solid #eee;" />
  <p style="color:#888;font-size:12px;">
    Ships from Dallas, TX via USPS First Class with top loader protection.
    Card will be securely packaged in a penny sleeve + top loader + team bag.
    Returns accepted within 30 days.
  </p>
</div>`.trim();
}

export function buildAuctionListing(card: Card, pricing: PricingData | null) {
  return {
    title: card.raw_analysis?.suggested_title || buildTitle(card),
    description_html: buildDescriptionHtml(card, pricing, 'auction'),
    start_price: pricing?.recommended_auction_start || 0.99,
    listing_type: 'auction' as const,
    shipping_cost: 1.00,
    condition_id: 3000, // Not Specified (for raw cards)
    category_id: '261328', // Sports Trading Cards
    template_data: {
      type: 'auction' as const,
      duration: '7',
      start_time: 'sunday_evening',
    },
  };
}

export function buildBuyItNowListing(card: Card, pricing: PricingData | null) {
  return {
    title: card.raw_analysis?.suggested_title || buildTitle(card),
    description_html: buildDescriptionHtml(card, pricing, 'buy_it_now'),
    buy_it_now_price: pricing?.recommended_bin_price || 4.99,
    listing_type: 'buy_it_now' as const,
    shipping_cost: 1.00,
    condition_id: 3000,
    category_id: '261328',
    template_data: {
      type: 'buy_it_now' as const,
      duration: 'GTC',
      best_offer: true,
    },
  };
}
