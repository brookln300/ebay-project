export interface ListingTemplate {
  type: 'auction' | 'buy_it_now';
  duration: string;
  start_time?: string;
  best_offer?: boolean;
  price_multiplier?: number;
}

export interface Listing {
  id: string;
  card_id: string;
  listing_type: 'auction' | 'buy_it_now';
  title: string;
  description_html: string;
  start_price: number | null;
  buy_it_now_price: number | null;
  shipping_cost: number;
  category_id: string | null;
  condition_id: number | null;
  ebay_item_id: string | null;
  ebay_status: 'draft' | 'active' | 'ended' | 'sold';
  template_data: ListingTemplate | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  card?: import('./card').Card;
}
