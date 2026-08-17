import { supabase } from '@/lib/supabase';

/**
 * Upload a local image (file:// URI from expo-image-picker) to Supabase Storage
 * and return its public URL.
 *
 * Uses arrayBuffer, not blob — Blob from fetch() on local file URIs is broken
 * on React Native and produces zero-byte uploads.
 */
export async function uploadImage(
  bucket: 'avatars' | 'move-images' | 'spot-images',
  path: string,
  uri: string
): Promise<string> {
  const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fullPath = `${path}.${ext}`;

  const response = await fetch(uri);
  const body = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, body, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  return data.publicUrl;
}
