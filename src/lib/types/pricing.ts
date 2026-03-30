export interface SalesComp {
  sale_price: number;
  sale_date: string;
  listing_title: string;
  item_condition: string;
  is_graded: boolean;
  grade_company?: string;
  grade_value?: string;
}

export interface PricingData {
  median: number;
  average: number;
  low: number;
  high: number;
  sample_size: number;
  recent_sales: SalesComp[];
  trend: 'up' | 'down' | 'stable';
  recommended_auction_start: number;
  recommended_bin_price: number;
}

export interface PricingHistory {
  id: string;
  card_id: string;
  source: string;
  sale_price: number;
  sale_date: string;
  listing_title: string;
  item_condition: string;
  is_graded: boolean;
  grade_company: string | null;
  grade_value: string | null;
  raw_data: unknown;
  fetched_at: string;
}
