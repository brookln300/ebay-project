import * as fs from 'fs';
import * as path from 'path';
import { getAnthropicClient } from './client';
import { CARD_ANALYSIS_SYSTEM_PROMPT, CARD_RETRY_PROMPT } from './prompts';
import type { CardAnalysis } from '../types/card';

const LOW_CONFIDENCE_THRESHOLD = 0.6;

function getMediaType(filePath: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  return map[ext] || 'image/jpeg';
}

function parseAnalysis(text: string): CardAnalysis | null {
  try {
    // Strip markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: CardAnalysis = JSON.parse(cleaned);

    if (analysis.confidence === 0 || analysis.player_name === 'UNKNOWN') {
      return null;
    }

    return analysis;
  } catch {
    console.error('Failed to parse Claude response:', text.slice(0, 200));
    return null;
  }
}

export async function analyzeCardImage(imagePath: string): Promise<CardAnalysis | null> {
  const client = getAnthropicClient();

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mediaType = getMediaType(imagePath);

  const imageContent = {
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: mediaType,
      data: base64Image,
    },
  };

  // First attempt
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

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  const firstAttempt = parseAnalysis(textBlock.text);

  // If null (truly unidentifiable) or high confidence, return as-is
  if (!firstAttempt) return null;
  if (firstAttempt.confidence >= LOW_CONFIDENCE_THRESHOLD) return firstAttempt;

  // Low confidence — retry with the enhanced retry prompt
  console.log(
    `[Scanner] Low confidence (${firstAttempt.confidence}), retrying with enhanced prompt...`
  );

  const retryResponse = await client.messages.create({
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
      {
        role: 'assistant',
        content: textBlock.text,
      },
      {
        role: 'user',
        content: CARD_RETRY_PROMPT,
      },
    ],
  });

  const retryBlock = retryResponse.content.find((block) => block.type === 'text');
  if (!retryBlock || retryBlock.type !== 'text') return firstAttempt;

  const retryAttempt = parseAnalysis(retryBlock.text);

  // Return whichever has higher confidence
  if (retryAttempt && retryAttempt.confidence > firstAttempt.confidence) {
    console.log(
      `[Scanner] Retry improved confidence: ${firstAttempt.confidence} → ${retryAttempt.confidence}`
    );
    return retryAttempt;
  }

  return firstAttempt;
}
