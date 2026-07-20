import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'testimonial-photos';
const cache = new Map<string, string>();

/** Extract the storage path from either a raw path or a full Supabase URL. */
export function extractPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx >= 0) return value.substring(idx + marker.length).split('?')[0];
  // Treat as raw path already
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, '');
  return null;
}

/** Resolve a stored photo_url (path or legacy full URL) to a usable signed URL. */
export async function resolvePhotoUrl(value: string | null | undefined): Promise<string | null> {
  const path = extractPath(value);
  if (!path) return null;
  if (cache.has(path)) return cache.get(path)!;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) return null;
  cache.set(path, data.signedUrl);
  return data.signedUrl;
}

export async function resolvePhotoUrls<T extends { photo_url: string | null }>(items: T[]): Promise<(T & { resolved_photo_url: string | null })[]> {
  return Promise.all(
    items.map(async (t) => ({ ...t, resolved_photo_url: await resolvePhotoUrl(t.photo_url) }))
  );
}