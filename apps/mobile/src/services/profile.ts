import { supabase, tables } from '@/lib/supabase';
import type { BusinessProfile, UpdateBusinessProfile } from '@dohot/shared';

export async function saveBusinessProfile(
  userId: string,
  updates: UpdateBusinessProfile,
): Promise<BusinessProfile> {
  const { data, error } = await supabase
    .from(tables.businessProfiles)
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as BusinessProfile;
}

/**
 * Encode a drawn SVG signature as a base64 data URI suitable for storing
 * in the signature_url column and embedding directly in HTML/PDF via <img src>.
 *
 * Only ASCII path data reaches this function, so btoa is safe to use.
 */
export function encodeSignatureSvg(svgContent: string): string {
  const encoded = btoa(svgContent);
  return `data:image/svg+xml;base64,${encoded}`;
}
