export interface CardAnalysis {
  player_name: string;
  year: number | null;
  brand: string;
  set_name: string;
  card_number: string;
  parallel: string | null;
  sport: string;
  is_rookie: boolean;
  is_auto: boolean;
  is_numbered: boolean;
  numbered_to: number | null;
  condition_estimate: string;
  confidence: number;
  suggested_title: string;
  notable_features: string[];
  identification_notes: string;
}

export interface Card {
  id: string;
  image_path: string;
  image_url: string | null;
  thumbnail_url: string | null;
  player_name: string | null;
  year: number | null;
  brand: string | null;
  set_name: string | null;
  card_number: string | null;
  parallel: string | null;
  condition_grade: string | null;
  sport: string;
  is_rookie: boolean;
  is_auto: boolean;
  is_numbered: boolean;
  numbered_to: number | null;
  raw_analysis: CardAnalysis | null;
  analysis_confidence: number | null;
  status: 'scanned' | 'reviewed' | 'listed' | 'sold' | 'unknown';
  scanned_at: string;
  created_at: string;
  updated_at: string;
}
