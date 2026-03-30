import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB for Claude API
const THUMBNAIL_WIDTH = 300;

export async function prepareImageForAnalysis(imagePath: string): Promise<Buffer> {
  const stats = fs.statSync(imagePath);

  if (stats.size <= MAX_IMAGE_SIZE) {
    return fs.readFileSync(imagePath);
  }

  // Resize large images
  return sharp(imagePath)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function generateThumbnail(imagePath: string, outputDir: string): Promise<string> {
  const filename = `thumb_${path.basename(imagePath, path.extname(imagePath))}.jpg`;
  const outputPath = path.join(outputDir, filename);

  await sharp(imagePath)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_WIDTH, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(outputPath);

  return outputPath;
}

export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic'].includes(ext);
}
