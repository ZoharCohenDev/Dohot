import React from 'react';
import {
  View, Text, Pressable, ActivityIndicator, Alert,
  StyleSheet, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { downloadPdfToCache, deleteCachedPdf } from '@/services/pdfExport';
import { sharePdfFile, buildWhatsAppText } from '@/services/shareService';

interface SendScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onDone?: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  leak: 'דוח גילוי נזילה',
  waterproofing: 'דוח איטום',
  pipe: 'דוח בעיית צנרת',
  roof: 'דוח נזק גג',
  moisture: 'דוח עובש ולחות',
  other: 'דוח בדיקה',
};

export function SendScreen({ colors = lightColors, onBack, onDone }: SendScreenProps) {
  const insets = useSafeAreaInsets();
  const wizard = useWizard();

  const pdfUrl = wizard.state.pdfUrl;
  const customerName = wizard.state.customerName;
  const customerPhone = wizard.state.customerPhone;
  const customerEmail = wizard.state.customerEmail;
  const issueType = wizard.state.reportIssues[0]?.issueType ?? 'other';
  const docTitle = DOC_TYPE_LABELS[issueType] ?? 'דוח מקצועי';

  // Cache the downloaded local URI so we only download once per session
  const localUriRef = React.useRef<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [activeAction, setActiveAction] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      // Clean up the temp file when leaving the screen
      if (localUriRef.current) {
        deleteCachedPdf(localUriRef.current);
        localUriRef.current = null;
      }
    };
  }, []);

  const ensureLocalFile = async (): Promise<string | null> => {
    if (!pdfUrl) {
      Alert.alert('PDF לא מוכן', 'המתן לסיום יצירת ה-PDF ונסה שוב.');
      return null;
    }
    if (localUriRef.current) return localUriRef.current;

    try {
      const uri = await downloadPdfToCache(pdfUrl, docTitle);
      localUriRef.current = uri;
      return uri;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SendScreen] PDF download failed:', msg);
      Alert.alert('שגיאה בהורדת הקובץ', msg || 'לא ניתן להוריד את ה-PDF. בדוק את החיבור לאינטרנט ונסה שנית.');
      return null;
    }
  };

  const withFile = async (actionId: string, fn: (uri: string) => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setActiveAction(actionId);
    try {
      const uri = await ensureLocalFile();
      if (!uri) return;
      await fn(uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      Alert.alert('שגיאה', msg);
    } finally {
      setBusy(false);
      setActiveAction(null);
    }
  };

  const handleShareFile = () =>
    withFile('share', (uri) => sharePdfFile(uri, docTitle));

  const handleWhatsApp = () =>
    withFile('whatsapp', async (uri) => {
      if (customerPhone) {
        const digits = customerPhone.replace(/\D/g, '');
        const waPhone = digits.startsWith('0') && digits.length >= 9
          ? '972' + digits.slice(1)
          : digits;
        const message = buildWhatsAppText(customerName ?? '', docTitle);
        const waUrl = `whatsapp://send?phone=${waPhone}&text=${encodeURIComponent(message)}`;
        try {
          const canOpen = await Linking.canOpenURL(waUrl);
          if (canOpen) await Linking.openURL(waUrl);
        } catch { /* fall through */ }
      }
      await sharePdfFile(uri, docTitle);
    });

  const handleEmail = () =>
    withFile('email', (uri) => sharePdfFile(uri, docTitle));

  type Option = {
    id: string;
    Icon: React.ComponentType<{ size: number; color: string }>;
    iconColor: string;
    bg: string;
    title: string;
    subtitle: string;
    big: boolean;
    onPress: () => void;
  };

  const options: Option[] = [
    {
      id: 'whatsapp',
      Icon: Icons.whatsapp,
      iconColor: '#fff',
      bg: '#25D366',
      title: 'WhatsApp',
      subtitle: customerPhone
        ? `${customerPhone} · פתח שיחה ישירה`
        : 'פתח את WhatsApp',
      big: true,
      onPress: handleWhatsApp,
    },
    ...(customerEmail ? [{
      id: 'email',
      Icon: Icons.mail,
      iconColor: '#fff',
      bg: colors.info,
      title: 'שלח במייל',
      subtitle: customerEmail,
      big: false,
      onPress: handleEmail,
    }] : []),
    {
      id: 'share',
      Icon: Icons.share,
      iconColor: '#fff',
      bg: colors.ink1,
      title: 'שתף קובץ PDF',
      subtitle: 'טלגרם, Drive ועוד',
      big: false,
      onPress: handleShareFile,
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 }]}>
      <Header colors={colors} />

      <View style={styles.body}>
        {/* Success indicator */}
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
          בחר כיצד לשלוח את קובץ ה-PDF ללקוח
        </Text>

        <View style={styles.options}>
          {options.map((opt) => {
            const isLoading = busy && activeAction === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={opt.onPress}
                disabled={busy}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: colors.bgElev,
                    borderColor: colors.line,
                    padding: opt.big ? 18 : 14,
                    opacity: busy && activeAction !== opt.id ? 0.45 : 1,
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
                  {isLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <opt.Icon size={opt.big ? 26 : 22} color={opt.iconColor} />
                  }
                </View>
                <View style={styles.optionInfo}>
                  <Text
                    style={[styles.optionTitle, {
                      color: colors.ink1, fontFamily: fonts.sans,
                      fontSize: opt.big ? 16 : 15,
                    }]}
                  >
                    {isLoading ? 'מכין קובץ…' : opt.title}
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.ink3, fontFamily: fonts.sans }]}>
                    {opt.subtitle}
                  </Text>
                </View>
                <Icons.chevL size={18} color={colors.ink4} />
              </Pressable>
            );
          })}
        </View>

        {/* File badge — reassures user this is an actual file */}
        <View style={[styles.fileBadge, { backgroundColor: colors.infoBg }]}>
          <Icons.doc size={14} color={colors.info} />
          <Text style={[styles.fileBadgeText, { color: colors.info, fontFamily: fonts.sans }]}>
            {`${docTitle}.pdf`}
          </Text>
        </View>

        {/* Exit action */}
        <Pressable
          onPress={onDone}
          style={[styles.doneBtn, { backgroundColor: colors.ink1 }]}
        >
          <Text style={[styles.doneBtnText, { color: colors.bg, fontFamily: fonts.sans }]}>סיום</Text>
          <Icons.home size={16} color={colors.bg} />
        </Pressable>

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
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  successWrap: { alignItems: 'center', marginTop: 20 },
  successOuter: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  successDash: {
    position: 'absolute', inset: -8,
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 1, borderStyle: 'dashed',
  },
  successInner: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },

  title: {
    fontSize: 32, fontWeight: '500', letterSpacing: -0.7,
    lineHeight: 36, textAlign: 'center', marginTop: 24,
  },
  subtitle: {
    fontSize: 15, lineHeight: 22, textAlign: 'center',
    marginTop: 8, marginBottom: 28,
  },

  options: { gap: 10 },
  optionRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    borderRadius: 18, borderWidth: 1,
  },
  optionIcon: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionInfo: { flex: 1, minWidth: 0 },
  optionTitle: { fontWeight: '700' },
  optionSub: { fontSize: 12, marginTop: 2 },

  fileBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, marginTop: 20,
  },
  fileBadgeText: { fontSize: 12, fontWeight: '600' },

  doneBtn: {
    height: 52, borderRadius: 16, marginTop: 20,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700' },

  footer: {
    marginTop: 'auto', paddingTop: 16,
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  footerText: { fontSize: 12 },
});
