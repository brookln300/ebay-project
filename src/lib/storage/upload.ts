import { createServerClient } from '../supabase/server';

const BUCKET = 'card-images';

/**
 * Upload a card image to Supabase Storage.
 * Returns the public URL and storage path.
 */
export async function uploadCardImage(
  file: Buffer,
  filename: string,
  userId: string,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = createServerClient();

  // Organize by user: users/{userId}/{timestamp}_{filename}
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error('[Storage] Upload failed:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return {
    path: storagePath,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Delete a card image from Supabase Storage after successful draft creation.
 */
export async function deleteCardImage(storagePath: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('[Storage] Delete failed:', error);
    // Non-fatal — don't throw, just log
  }
}

/**
 * Move a card image to the unknown/ prefix for manual review.
 */
export async function moveToUnknown(storagePath: string): Promise<string> {
  const supabase = createServerClient();
  const newPath = `unknown/${storagePath.split('/').pop()}`;

  const { error: moveErr } = await supabase.storage
    .from(BUCKET)
    .move(storagePath, newPath);

  if (moveErr) {
    console.error('[Storage] Move to unknown failed:', moveErr);
    return storagePath; // Keep original path if move fails
  }

  return newPath;
}
