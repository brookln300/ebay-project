import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { checkUsage, recordUsage } from '@/lib/auth/usage';
import { uploadCardImage, deleteCardImage, moveToUnknown } from '@/lib/storage/upload';
import { lookupPricingWaterfall } from '@/lib/pricing';
import { buildAuctionListing, buildBuyItNowListing } from '@/lib/ebay/templates';
import { createServerClient } from '@/lib/supabase/server';
import type { Card } from '@/lib/types/card';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  // Auth check
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const files = formData.getAll('images') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'No images uploaded' }, { status: 400 });
  }

  // Usage check — can they scan this many?
  const usage = await checkUsage(user.id, user.tier, 'scan');
  if (!usage.allowed) {
    return NextResponse.json({
      error: usage.reason,
      usage: {
        used_today: usage.used_today,
        daily_limit: usage.limit_daily,
        used_this_month: usage.used_this_month,
        monthly_limit: usage.limit_monthly,
      },
      upgrade_url: '/pricing',
    }, { status: 429 });
  }

  // Check remaining quota
  const remainingToday = usage.limit_daily - usage.used_today;
  const remainingMonth = usage.limit_monthly - usage.used_this_month;
  const maxAllowed = Math.min(remainingToday, remainingMonth, files.length);

  if (maxAllowed < files.length) {
    // Process only what quota allows
    files.splice(maxAllowed);
  }

  const supabase = createServerClient();
  const results = {
    total: files.length,
    processed: 0,
    unknown: 0,
    errors: 0,
    cards: [] as Array<{ id: string; player_name: string | null; status: string }>,
    errorDetails: [] as string[],
  };

  for (const file of files) {
    try {
      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        results.errors++;
        results.errorDetails.push(`${file.name}: Invalid file type (${file.type})`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        results.errors++;
        results.errorDetails.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }

      // Upload to Supabase Storage
      const buffer = Buffer.from(await file.arrayBuffer());
      const { path: storagePath, publicUrl } = await uploadCardImage(
        buffer, file.name, user.id, file.type
      );

      // Analyze with Claude Vision (pass buffer directly)
      console.log(`[Scan] Analyzing: ${file.name}`);
      const analysis = await analyzeCardImageFromBuffer(buffer, file.type);

      if (!analysis) {
        // Unknown card — move to unknown folder in storage
        console.log(`[Scan] Unknown card: ${file.name}`);
        await moveToUnknown(storagePath);
        results.unknown++;
        continue;
      }

      // Insert card record
      const { data: card, error: cardErr } = await supabase
        .from('cards')
        .insert({
          image_path: storagePath,
          image_url: publicUrl,
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

      if (cardErr || !card) {
        console.error(`[Scan] DB insert failed:`, cardErr);
        results.errors++;
        results.errorDetails.push(`${file.name}: Database error`);
        continue;
      }

      // Lookup pricing (waterfall)
      console.log(`[Scan] Pricing lookup: ${analysis.player_name}`);
      const pricingResult = await lookupPricingWaterfall(analysis);
      const pricing = pricingResult.data;

      // Save pricing history
      if (pricing.recent_sales.length > 0) {
        const rows = pricing.recent_sales.map((sale) => ({
          card_id: card.id,
          source: pricingResult.source,
          sale_price: sale.sale_price,
          sale_date: sale.sale_date,
          listing_title: sale.listing_title,
          item_condition: sale.item_condition,
          is_graded: sale.is_graded,
          raw_data: sale,
        }));
        await supabase.from('pricing_history').insert(rows);
      }

      // Create draft listings
      const typedCard = card as Card;
      const auctionDraft = buildAuctionListing(typedCard, pricing);
      const binDraft = buildBuyItNowListing(typedCard, pricing);

      await supabase.from('listings').insert({
        card_id: card.id,
        ...auctionDraft,
        ebay_status: 'draft',
      });
      await supabase.from('listings').insert({
        card_id: card.id,
        ...binDraft,
        ebay_status: 'draft',
      });

      // Update card status
      await supabase
        .from('cards')
        .update({ status: 'listed' })
        .eq('id', card.id);

      // Delete source image from storage (drafts created)
      await deleteCardImage(storagePath);

      results.processed++;
      results.cards.push({
        id: card.id,
        player_name: analysis.player_name,
        status: 'listed',
      });
    } catch (err) {
      console.error(`[Scan] Error processing ${file.name}:`, err);
      results.errors++;
      results.errorDetails.push(`${file.name}: ${String(err)}`);
    }
  }

  // Record usage
  if (results.processed > 0) {
    await recordUsage(user.id, 'scan', results.processed);
  }

  return NextResponse.json({
    success: true,
    result: results,
    usage: {
      used_today: usage.used_today + results.processed,
      daily_limit: usage.limit_daily,
      used_this_month: usage.used_this_month + results.processed,
      monthly_limit: usage.limit_monthly,
    },
  });
}

/**
 * Analyze a card image from a Buffer (instead of file path).
 * Used for cloud-uploaded images.
 */
async function analyzeCardImageFromBuffer(buffer: Buffer, mimeType: string) {
  // Re-use the scanner but with buffer input
  const { getAnthropicClient } = await import('@/lib/claude/client');
  const { CARD_ANALYSIS_SYSTEM_PROMPT, CARD_RETRY_PROMPT } = await import('@/lib/claude/prompts');

  const client = getAnthropicClient();
  const base64 = buffer.toString('base64');
  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

  const imageContent = {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: mediaType,
      data: base64,
    },
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CARD_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          imageContent,
          { type: 'text', text: 'Analyze this sports card image and return the JSON data.' },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  const parsed = parseAnalysis(textBlock.text);
  if (!parsed) return null;

  // Retry if low confidence
  if (parsed.confidence < 0.6) {
    console.log(`[Scan] Low confidence (${parsed.confidence}), retrying...`);
    const retry = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: CARD_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            { type: 'text', text: 'Analyze this sports card image and return the JSON data.' },
          ],
        },
        { role: 'assistant', content: textBlock.text },
        { role: 'user', content: CARD_RETRY_PROMPT },
      ],
    });

    const retryBlock = retry.content.find((b) => b.type === 'text');
    if (retryBlock && retryBlock.type === 'text') {
      const retryParsed = parseAnalysis(retryBlock.text);
      if (retryParsed && retryParsed.confidence > parsed.confidence) {
        return retryParsed;
      }
    }
  }

  return parsed;
}

function parseAnalysis(text: string) {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleaned);
    if (analysis.confidence === 0 || analysis.player_name === 'UNKNOWN') return null;
    return analysis;
  } catch {
    console.error('[Scan] Parse failed:', text.slice(0, 200));
    return null;
  }
}
