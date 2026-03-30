import * as fs from 'fs';
import * as path from 'path';
import { getAnthropicClient } from './client';
import { CARD_ANALYSIS_SYSTEM_PROMPT } from './prompts';
import type { CardAnalysis } from '../types/card';

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

export async function analyzeCardImage(imagePath: string): Promise<CardAnalysis | null> {
  const client = getAnthropicClient();

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mediaType = getMediaType(imagePath);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CARD_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Analyze this sports card image and return the JSON data.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  try {
    const analysis: CardAnalysis = JSON.parse(textBlock.text);

    // If confidence is 0 or player is UNKNOWN, card couldn't be identified
    if (analysis.confidence === 0 || analysis.player_name === 'UNKNOWN') {
      return null;
    }

    return analysis;
  } catch {
    console.error('Failed to parse Claude response:', textBlock.text);
    return null;
  }
}
