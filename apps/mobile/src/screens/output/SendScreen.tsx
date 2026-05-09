import React from 'react';
import { View, Text, Pressable, Share, Alert, Linking, StyleSheet } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';

interface SendScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onDone?: () => void;
}

function buildWhatsAppMessage(
  customerName: string,
  docTitle: string,
  pdfUrl: string,
): string {
  const greeting = customerName ? `שלום ${customerName},` : 'שלום,';
  return [
    greeting,
    `${docTitle} מוכן לעיונך.`,
    '',
    'תוכל לצפות בו בקישור הבא:',
    pdfUrl,
    '',
    'לכל שאלה אני כאן.',
  ].join('\n');
}

export function SendScreen({ colors = lightColors, onBack, onDone }: SendScreenProps) {
  const insets = useSafeAreaInsets();
  const wizard = useWizard();

  const pdfUrl = wizard.state.pdfUrl;
  const customerName = wizard.state.customerName;
  const customerPhone = wizard.state.customerPhone;
  const issueType = wizard.state.reportIssues[0]?.issueType ?? 'other';
  const [downloading, setDownloading] = React.useState(false);

  const DOC_TYPE_LABELS: Record<string, string> = {
    leak: 'דוח גילוי נזילה',
    waterproofing: 'דוח איטום',
    pipe: 'דוח בעיית צנרת',
    roof: 'דוח נזק גג',
    moisture: 'דוח עובש ולחות',
    other: 'דוח בדיקה',
  };
  const docTitle = DOC_TYPE_LABELS[issueType] ?? 'דוח מקצועי';

  const requirePdf = (): boolean => {
    if (!pdfUrl) {
      Alert.alert('PDF לא מוכן', 'המתן לסיום יצירת ה-PDF ונסה שוב.');
      return false;
    }
    return true;
  };

  const handleWhatsApp = () => {
    if (!requirePdf()) return;
    const message = buildWhatsAppMessage(customerName, docTitle, pdfUrl!);
    const phone = customerPhone.replace(/\D/g, '').replace(/^0/, '');
    const url = `whatsapp://send?phone=972${phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // WhatsApp not installed — fall back to generic share
      Share.share({ message: `${docTitle}\n\n${pdfUrl!}` });
    });
  };

  const handleNativeShare = () => {
    if (!requirePdf()) return;
    const message = buildWhatsAppMessage(customerName, docTitle, pdfUrl!);
    Share.share({
      message,
      url: pdfUrl!,   // iOS attaches the URL separately
      title: docTitle,
    });
  };

  const handleDownload = async () => {
    if (!requirePdf()) return;
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Linking.openURL(pdfUrl!);
      return;
    }

    setDownloading(true);
    try {
      const filename = `${docTitle.replace(/\s+/g, '_')}.pdf`;
      const dest = new File(new Directory(Paths.cache), filename);
      // downloadFileAsync is assigned dynamically outside the class body
      const downloaded = await (File as unknown as {
        downloadFileAsync: (url: string, dest: File, opts: object) => Promise<File>;
      }).downloadFileAsync(pdfUrl!, dest, { idempotent: true });
      await Sharing.shareAsync(downloaded.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `שיתוף ${docTitle}`,
        UTI: 'com.adobe.pdf',
      });
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להוריד את הקובץ. נסה לפתוח בדפדפן.');
      Linking.openURL(pdfUrl!);
    } finally {
      setDownloading(false);
    }
  };

  type Option = {
    Icon: React.ComponentType<{ size: number; color: string }>;
    iconColor: string;
    bg: string;
    title: string;
    subtitle: string;
    big: boolean;
    onPress: () => void;
    loading?: boolean;
  };

  const options: Option[] = [
    {
      Icon: Icons.whatsapp,
      iconColor: '#fff',
      bg: '#25D366',
      title: 'WhatsApp',
      subtitle: customerPhone
        ? `${customerPhone} · ${customerName}`
        : 'שלח הודעה ללקוח',
      big: true,
      onPress: handleWhatsApp,
    },
    {
      Icon: Icons.share,
      iconColor: '#fff',
      bg: colors.ink1,
      title: 'שיתוף',
      subtitle: 'כל אפליקציה — מייל, טלגרם ועוד',
      big: false,
      onPress: handleNativeShare,
    },
    {
      Icon: Icons.download,
      iconColor: '#fff',
      bg: colors.ink2,
      title: downloading ? 'מוריד…' : 'הורדת PDF',
      subtitle: 'שמור במכשיר או שתף קובץ',
      big: false,
      onPress: handleDownload,
      loading: downloading,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 }]}>
      <Header onBack={onBack} colors={colors} />

      <View style={styles.body}>
        {/* Success circle — unchanged from original */}
        <View style={styles.successWrap}>
          <View style={[styles.successOuter, { backgroundColor: colors.aiBg }]}>
            <View style={[styles.successDash, { borderColor: 'rgba(90,135,112,0.3)' }]} />
            <View style={[styles.successInner, { backgroundColor: colors.ai2 }]}>
              <Icons.check size={42} color="#fff" stroke={3.5} />
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          הדוח מוכן.
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
          איך תרצה לשלוח אותו?
        </Text>

        <View style={styles.options}>
          {options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={opt.onPress}
              disabled={opt.loading}
              style={[
                styles.optionRow,
                {
                  backgroundColor: colors.bgElev,
                  borderColor: colors.line,
                  padding: opt.big ? 18 : 14,
                  opacity: opt.loading ? 0.6 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: opt.bg,
                    width: opt.big ? 52 : 44,
                    height: opt.big ? 52 : 44,
                    borderRadius: opt.big ? 14 : 12,
                  },
                ]}
              >
                <opt.Icon size={opt.big ? 26 : 22} color={opt.iconColor} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: colors.ink1, fontFamily: fonts.sans, fontSize: opt.big ? 16 : 15 }]}>
                  {opt.title}
                </Text>
                <Text style={[styles.optionSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                  {opt.subtitle}
                </Text>
              </View>
              <Icons.chevL size={18} color={colors.ink4} />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Icons.shieldCheck size={14} color={colors.ai2} />
          <Text style={[styles.footerText, { color: colors.ink3, fontFamily: fonts.sans }]}>
            המסמך נשמר אוטומטית • גיבוי בענן
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  successWrap: { alignItems: 'center', marginTop: 20 },
  successOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  successDash: {
    position: 'absolute',
    inset: -8,
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  successInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  options: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionInfo: { flex: 1, minWidth: 0 },
  optionTitle: { fontWeight: '700' },
  optionSub: { fontSize: 12, marginTop: 2 },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: { fontSize: 12 },
});
