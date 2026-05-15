import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export type StorageBucket = 'logos' | 'signatures' | 'report-images' | 'pdf-documents' | 'cert-images';

const PRIVATE_BUCKETS = new Set<StorageBucket>([
  'signatures',
  'report-images',
  'pdf-documents',
  'cert-images',
]);

interface PickOptions {
  aspect?: [number, number];
  quality?: number;
}

async function resizeImageForUpload(asset: ImagePicker.ImagePickerAsset) {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const longestSide = Math.max(width, height);

  if (!longestSide || longestSide <= 1920) return asset;

  const resized = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: width >= height ? { width: 1920 } : { height: 1920 } }],
    {
      compress: 0.75,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    ...asset,
    uri: resized.uri,
    width: resized.width,
    height: resized.height,
    mimeType: 'image/jpeg',
  };
}

async function uploadAsset(
  userId: string,
  bucket: StorageBucket,
  asset: ImagePicker.ImagePickerAsset,
  onLocalUri?: (uri: string) => void,
): Promise<string> {
  const uploadableAsset = await resizeImageForUpload(asset);
  onLocalUri?.(uploadableAsset.uri);

  const storagePath = `${userId}/${Date.now()}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(uploadableAsset.uri, {
    encoding: 'base64',
  });

  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, {
      contentType: uploadableAsset.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  if (PRIVATE_BUCKETS.has(bucket)) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (signErr || !signed) {
      throw signErr ?? new Error('Failed to create signed URL');
    }

    return signed.signedUrl;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

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
    allowsEditing: Platform.OS !== 'android',
    aspect: opts.aspect ?? [4, 3],
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  return uploadAsset(userId, bucket, asset, onLocalUri);
}

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
    allowsEditing: Platform.OS !== 'android',
    aspect: opts.aspect ?? [1, 1],
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  return uploadAsset(userId, bucket, asset, onLocalUri);
}

export async function deleteStorageFile(bucket: StorageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}

export function pathFromStorageUrl(url: string, bucket: StorageBucket): string {
  for (const variant of [`/object/public/${bucket}/`, `/object/sign/${bucket}/`]) {
    const idx = url.indexOf(variant);
    if (idx !== -1) return url.slice(idx + variant.length).split('?')[0] ?? '';
  }

  return '';
}

export function pathFromPublicUrl(publicUrl: string, bucket: StorageBucket): string {
  return pathFromStorageUrl(publicUrl, bucket);
}

export async function pickImageAsset(
  opts: PickOptions = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) {
    Alert.alert('אין הרשאה', 'יש לאפשר גישה לגלריה בהגדרות הטלפון');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function captureImageAsset(
  opts: PickOptions = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();

  if (!perm.granted) {
    Alert.alert('אין הרשאה', 'יש לאפשר גישה למצלמה בהגדרות הטלפון');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: opts.quality ?? 0.85,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function uploadImageAsset(
  userId: string,
  bucket: StorageBucket,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string> {
  return uploadAsset(userId, bucket, asset);
}