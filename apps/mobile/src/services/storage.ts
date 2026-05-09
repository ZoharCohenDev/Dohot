import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export type StorageBucket = 'logos' | 'signatures' | 'report-images' | 'pdf-documents' | 'cert-images';

interface PickOptions {
  /** [width, height] crop ratio passed to expo-image-picker */
  aspect?: [number, number];
  quality?: number;
}

async function uploadAsset(
  userId: string,
  bucket: StorageBucket,
  asset: ImagePicker.ImagePickerAsset,
  onLocalUri?: (uri: string) => void,
): Promise<string> {
  onLocalUri?.(asset.uri);

  const rawExt = asset.uri.split('.').pop() ?? 'jpg';
  const ext = rawExt.split('?')[0] ?? 'jpg';
  const storagePath = `${userId}/${Date.now()}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Request camera permission, take a photo, upload it, and return the public URL.
 * Returns null when the user cancels or denies permission.
 */
export async function captureAndUploadImage(
  userId: string,
  bucket: StorageBucket,
  opts: PickOptions = {},
  onLocalUri?: (uri: string) => void,
): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('אין הרשאה', 'יש לאפשר גישה למצלמה בהגדרות הטלפון');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: opts.aspect ?? [4, 3],
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  return uploadAsset(userId, bucket, asset, onLocalUri);
}

/**
 * Request photo library permission, launch the picker, upload the selected
 * image to Supabase Storage, and return the public URL.
 *
 * Returns null when the user cancels or denies permission (no throw).
 * Throws on storage upload errors so callers can show an error UI.
 */
export async function pickAndUploadImage(
  userId: string,
  bucket: StorageBucket,
  opts: PickOptions = {},
  onLocalUri?: (uri: string) => void,
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('אין הרשאה', 'יש לאפשר גישה לגלריה בהגדרות הטלפון');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: opts.aspect ?? [1, 1],
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  return uploadAsset(userId, bucket, asset, onLocalUri);
}

/**
 * Delete a file that was previously uploaded to a bucket.
 * Path must be relative to the bucket root (e.g. "userId/filename.jpg").
 * Silently ignores errors.
 */
export async function deleteStorageFile(bucket: StorageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

/**
 * Extract the storage path (without bucket prefix) from a full public URL.
 * Used when replacing an existing upload.
 */
export function pathFromPublicUrl(publicUrl: string, bucket: StorageBucket): string {
  // Public URLs look like: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : '';
}
