import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Rect,
  Path,
} from 'react-native-svg';
import { BrandMark } from '@/components/shared';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';

interface WelcomeScreenProps {
  dark?: boolean;
  colors?: typeof lightColors;
  onNext?: () => void;
  onLogin?: () => void;
}

function HeroIllustration() {
  return (
    <Svg width="280" height="280" viewBox="0 0 280 280" fill="none">
      <Circle cx="140" cy="140" r="130" fill="#5A8770" fillOpacity="0.10" />
      <Circle cx="140" cy="140" r="100" fill="none" stroke="#5A8770" strokeOpacity="0.2" strokeDasharray="4 6" />
      {/* Document */}
      <Rect x="80" y="60" width="120" height="160" rx="14" fill="#fff" stroke="rgba(0,0,0,0.08)" />
      <Rect x="98" y="86" width="84" height="8" rx="2" fill="#1B1916" />
      <Rect x="98" y="104" width="60" height="6" rx="2" fill="#807A72" />
      <Rect x="98" y="124" width="84" height="36" rx="6" fill="#F5F3EE" />
      <Rect x="98" y="170" width="84" height="6" rx="2" fill="#C7C1B6" />
      <Rect x="98" y="184" width="64" height="6" rx="2" fill="#C7C1B6" />
      <Rect x="98" y="198" width="74" height="6" rx="2" fill="#C7C1B6" />
      <Circle cx="146" cy="142" r="10" fill="#C2613B" fillOpacity="0.85" />
      <Path d="M138 142l6 6 10-12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Mic button */}
      <Circle cx="204" cy="190" r="22" fill="#5A8770" />
      <Rect x="199" y="180" width="10" height="14" rx="5" fill="#fff" />
      <Path d="M195 189a9 9 0 0 0 18 0M204 198v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      {/* Sparkle */}
      <Path d="M76 92 L78 86 L80 92 L86 94 L80 96 L78 102 L76 96 L70 94 Z" fill="#5A8770" />
    </Svg>
  );
}

export function WelcomeScreen({ colors = lightColors, onNext, onLogin }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.inner, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        {/* Brand */}
        <View style={styles.brand}>
          <BrandMark size={36} colors={colors} />
          <Text style={[styles.brandName, { color: colors.ink1, fontFamily: fonts.serif }]}>
            דוחות
          </Text>
        </View>

        {/* Hero illustration — positioned in middle */}
        <View style={styles.heroWrap} pointerEvents="none">
          <HeroIllustration />
        </View>

        {/* Bottom copy + CTA */}
        <View style={styles.bottom}>
          <Text style={[styles.tagline, { color: colors.ai2, fontFamily: fonts.sans }]}>
            עוזר חכם • לבעלי מקצוע
          </Text>

          <Text style={[styles.headline, { color: colors.ink1, fontFamily: fonts.serif }]}>
            {'דוחות מקצועיים\n'}
            <Text style={[styles.headlineItalic, { color: colors.ai2 }]}>
              במהירות הדיבור.
            </Text>
          </Text>

          <Text style={[styles.body, { color: colors.ink2, fontFamily: fonts.sans }]}>
            צלם, דבר, וקבל דוח מסודר, הצעת מחיר או הסכם עבודה — מוכן לשליחה ללקוח תוך דקה.
          </Text>

          <Button
            kind="primary"
            size="lg"
            full
            onPress={onNext}
            iconRight={<Icons.back size={20} color={colors.bg} />}
            colors={colors}
          >
            בואו נתחיל
          </Button>

          <Pressable onPress={onLogin} style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.ink3, fontFamily: fonts.sans }]}>
              כבר רשום?{' '}
              <Text style={[styles.loginLink, { color: colors.ink1 }]}>התחבר</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    position: 'relative',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroWrap: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottom: {
    marginTop: 'auto',
    gap: 0,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'right',
  },
  headline: {
    fontSize: 44,
    fontWeight: '500',
    lineHeight: 48,
    letterSpacing: -1.4,
    marginBottom: 16,
    textAlign: 'right',
  },
  headlineItalic: {
    fontStyle: 'italic',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'right',
  },
  loginRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  loginText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loginLink: {
    fontWeight: '600',
  },
});
