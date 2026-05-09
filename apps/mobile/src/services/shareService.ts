import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

/**
 * Opens the native share sheet with the given PDF file.
 * On iOS: AirDrop, Mail, WhatsApp, etc. all receive the actual file.
 * On Android: Gmail, WhatsApp, Drive, etc. all receive the actual file.
 */
export async function sharePdfFile(localUri: string, docTitle: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('שיתוף קבצים אינו זמין במכשיר זה');
  }
  await Sharing.shareAsync(localUri, {
    mimeType: 'application/pdf',
    dialogTitle: docTitle,
    UTI: 'com.adobe.pdf',   // iOS only
  });
}

/**
 * Opens WhatsApp directly with a pre-filled text message to a phone number.
 * Falls back to generic Linking.openURL if WhatsApp is not installed.
 * Note: File attachment via whatsapp:// is not supported by the scheme —
 * use sharePdfFile() and the user picks WhatsApp from the native sheet.
 */
export async function openWhatsAppWithMessage(
  phone: string,
  message: string,
): Promise<boolean> {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '');
  const url = `whatsapp://send?phone=972${digits}&text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}

/**
 * Builds a polite Hebrew message to accompany the PDF,
 * used when opening WhatsApp directly (text only).
 */
export function buildWhatsAppText(customerName: string, docTitle: string): string {
  const greeting = customerName ? `שלום ${customerName},` : 'שלום,';
  return [
    greeting,
    `${docTitle} מוכן לעיונך.`,
    '',
    'מצורף הקובץ בהמשך.',
    '',
    'לכל שאלה אני כאן.',
  ].join('\n');
}

/**
 * Returns a platform-appropriate label for the sharing dialog.
 */
export function shareDialogHint(): string {
  return Platform.OS === 'ios'
    ? 'בחר כיצד לשלוח את הקובץ'
    : 'שלח דרך…';
}
