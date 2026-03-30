import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { analyzeCardImage } from '@/lib/claude/scanner';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  // Get the card record
  const { data: card, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Re-analyze the image
  const analysis = await analyzeCardImage(card.image_path);

  if (!analysis) {
    return NextResponse.json(
      { error: 'Could not analyze card image' },
      { status: 422 }
    );
  }

  // Update the card with new analysis
  const { data: updated, error: updateErr } = await supabase
    .from('cards')
    .update({
      player_name: analysis.player_name,
      year: analysis.year,
      brand: analysis.brand,
      set_name: analysis.set_name,
      card_number: analysis.card_number,
      parallel: analysis.parallel,
      condition_grade: analysis.condition_estimate,
      sport: analysis.sport,
      is_rookie: analysis.is_rookie,
      is_auto: analysis.is_auto,
      is_numbered: analysis.is_numbered,
      numbered_to: analysis.numbered_to,
      raw_analysis: analysis,
      analysis_confidence: analysis.confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ card: updated, analysis });
}
