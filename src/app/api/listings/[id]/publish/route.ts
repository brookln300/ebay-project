import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { publishToEbay } from '@/lib/ebay/listings';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  // Get the listing with card data
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, card:cards(*)')
    .eq('id', params.id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.ebay_status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft listings can be published' },
      { status: 400 }
    );
  }

  // Publish to eBay
  const ebayItemId = await publishToEbay({
    title: listing.title,
    description_html: listing.description_html,
    listing_type: listing.listing_type,
    start_price: listing.start_price,
    buy_it_now_price: listing.buy_it_now_price,
    shipping_cost: listing.shipping_cost,
    category_id: listing.category_id || '261328',
    condition_id: listing.condition_id || 3000,
    image_url: listing.card?.image_url,
    duration: listing.template_data?.duration,
    best_offer: listing.template_data?.best_offer,
  });

  if (!ebayItemId) {
    return NextResponse.json(
      { error: 'Failed to publish to eBay' },
      { status: 500 }
    );
  }

  // Update listing status
  const { data: updated } = await supabase
    .from('listings')
    .update({
      ebay_item_id: ebayItemId,
      ebay_status: 'active',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  return NextResponse.json({ listing: updated, ebay_item_id: ebayItemId });
}
