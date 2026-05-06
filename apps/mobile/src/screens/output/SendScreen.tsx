import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/layout';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface SendScreenProps {
  colors?: typeof lightColors;
  onBack?: () => void;
  onDone?: () => void;
}

const SEND_OPTIONS = [
  { Icon: Icons.whatsapp, iconColor: '#fff', bg: '#25D366', title: 'WhatsApp', subtitle: '052-2837461 · אבי כהן', big: true },
  { Icon: Icons.mail, iconColor: '#fff', bg: (c: typeof lightColors) => c.info, title: 'דוא״ל', subtitle: 'avi.cohen@gmail.com', big: false },
  { Icon: Icons.download, iconColor: '#fff', bg: (c: typeof lightColors) => c.ink1, title: 'הורדת PDF', subtitle: 'שמור במכשיר', big: false },
  { Icon: Icons.share, iconColor: '#fff', bg: (c: typeof lightColors) => c.ink2, title: 'שיתוף קישור', subtitle: 'קישור מאומת ב-7 ימים', big: false },
];

export function SendScreen({ colors = lightColors, onBack, onDone }: SendScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingBottom: insets.bottom + 24 }]}>
      <Header onBack={onBack} colors={colors} />

      <View style={styles.body}>
        {/* Success circle */}
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

        {/* Send options */}
        <View style={styles.options}>
          {SEND_OPTIONS.map((opt, i) => {
            const bg = typeof opt.bg === 'function' ? opt.bg(colors) : opt.bg;
            return (
              <Pressable
                key={i}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: colors.bgElev,
                    borderColor: colors.line,
                    padding: opt.big ? 18 : 14,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    {
                      backgroundColor: bg,
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
            );
          })}
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
