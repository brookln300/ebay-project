import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { lookupPricing } from '@/lib/ebay/pricing';
import type { CardAnalysis } from '@/lib/types/card';

export async function POST(req: NextRequest) {
  const { card_id } = await req.json();

  if (!card_id) {
    return NextResponse.json({ error: 'card_id required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: card, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', card_id)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const analysis: CardAnalysis = card.raw_analysis || {
    player_name: card.player_name || '',
    year: card.year,
    brand: card.brand || '',
    set_name: card.set_name || '',
    card_number: card.card_number || '',
    parallel: card.parallel,
    sport: card.sport || 'baseball',
    is_rookie: card.is_rookie,
    is_auto: card.is_auto,
    is_numbered: card.is_numbered,
    numbered_to: card.numbered_to,
    condition_estimate: card.condition_grade || 'Near Mint',
    confidence: card.analysis_confidence || 0.5,
    suggested_title: '',
    notable_features: [],
  };

  const pricing = await lookupPricing(analysis);

  // Store pricing history
  if (pricing.recent_sales.length > 0) {
    const rows = pricing.recent_sales.map((sale) => ({
      card_id,
      source: 'ebay_sold',
      sale_price: sale.sale_price,
      sale_date: sale.sale_date,
      listing_title: sale.listing_title,
      item_condition: sale.item_condition,
      is_graded: sale.is_graded,
      raw_data: sale,
    }));
    await supabase.from('pricing_history').insert(rows);
  }

  return NextResponse.json({ pricing });
}
