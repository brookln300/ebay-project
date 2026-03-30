import * as fs from 'fs';
import * as path from 'path';
import { analyzeCardImage } from '../claude/scanner';
import { lookupPricing } from '../ebay/pricing';
import { buildAuctionListing, buildBuyItNowListing } from '../ebay/templates';
import { createServerClient } from '../supabase/server';
import { isImageFile } from '../utils/image';
import type { Card } from '../types/card';

interface ScanResult {
  total: number;
  processed: number;
  unknown: number;
  errors: number;
}

/**
 * Scans a directory for card images, processes them through Claude API,
 * creates eBay draft listings, then manages file lifecycle:
 * - Successful drafts → image deleted
 * - Unidentified cards → moved to /unknown subfolder
 */
export async function scanDirectory(watchDir: string): Promise<ScanResult> {
  const supabase = createServerClient();
  const unknownDir = path.join(watchDir, 'unknown');

  // Ensure unknown folder exists
  if (!fs.existsSync(unknownDir)) {
    fs.mkdirSync(unknownDir, { recursive: true });
  }

  // Get all image files in the watch directory (not subdirectories)
  const files = fs.readdirSync(watchDir).filter((f) => {
    const fullPath = path.join(watchDir, f);
    return fs.statSync(fullPath).isFile() && isImageFile(fullPath);
  });

  const result: ScanResult = {
    total: files.length,
    processed: 0,
    unknown: 0,
    errors: 0,
  };

  for (const file of files) {
    const filePath = path.join(watchDir, file);

    try {
      // Step 1: Analyze with Claude Vision
      console.log(`[Scanner] Analyzing: ${file}`);
      const analysis = await analyzeCardImage(filePath);

      if (!analysis) {
        // Card not identified → move to unknown folder
        console.log(`[Scanner] Unknown card, moving to /unknown: ${file}`);
        const destPath = path.join(unknownDir, file);
        fs.renameSync(filePath, destPath);
        result.unknown++;
        continue;
      }

      // Step 2: Insert card record
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          image_path: filePath,
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
          status: 'scanned',
        })
        .select()
        .single();

      if (cardError || !card) {
        console.error(`[Scanner] DB insert failed for ${file}:`, cardError);
        result.errors++;
        continue;
      }

      // Step 3: Lookup pricing
      console.log(`[Scanner] Looking up pricing for: ${analysis.player_name}`);
      const pricing = await lookupPricing(analysis);

      // Save pricing history
      if (pricing.recent_sales.length > 0) {
        const pricingRows = pricing.recent_sales.map((sale) => ({
          card_id: card.id,
          source: 'ebay_sold',
          sale_price: sale.sale_price,
          sale_date: sale.sale_date,
          listing_title: sale.listing_title,
          item_condition: sale.item_condition,
          is_graded: sale.is_graded,
          raw_data: sale,
        }));
        await supabase.from('pricing_history').insert(pricingRows);
      }

      // Step 4: Create both draft listings
      const typedCard = card as Card;
      const auctionDraft = buildAuctionListing(typedCard, pricing);
      const binDraft = buildBuyItNowListing(typedCard, pricing);

      const { error: auctionErr } = await supabase.from('listings').insert({
        card_id: card.id,
        ...auctionDraft,
        ebay_status: 'draft',
      });

      const { error: binErr } = await supabase.from('listings').insert({
        card_id: card.id,
        ...binDraft,
        ebay_status: 'draft',
      });

      if (auctionErr || binErr) {
        console.error(`[Scanner] Draft creation failed for ${file}:`, auctionErr || binErr);
        result.errors++;
        continue;
      }

      // Step 5: Update card status to 'listed'
      await supabase
        .from('cards')
        .update({ status: 'listed' })
        .eq('id', card.id);

      // Step 6: Delete source image (drafts created successfully)
      console.log(`[Scanner] Drafts created, deleting source: ${file}`);
      fs.unlinkSync(filePath);

      result.processed++;
    } catch (err) {
      console.error(`[Scanner] Error processing ${file}:`, err);
      result.errors++;
    }
  }

  // Log scan job
  await supabase.from('scan_jobs').insert({
    directory_path: watchDir,
    files_found: result.total,
    files_processed: result.processed,
    status: result.errors > 0 ? 'completed' : 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  console.log(
    `[Scanner] Complete: ${result.processed} processed, ${result.unknown} unknown, ${result.errors} errors`
  );
  return result;
}
