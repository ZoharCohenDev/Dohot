import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Linking, Pressable, Animated, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts, radii } from '@/theme/tokens';

interface Contact {
  name: string;
  initials: string;
  role: string;
  phone: string;
  intlPhone: string;
  avatarBg: string;
  toneSoft: string;
}

const CONTACTS: Contact[] = [
  {
    name: 'זוהר כהן',
    initials: 'זכ',
    role: 'מייסד · יחס אישי',
    phone: '0526402708',
    intlPhone: '972526402708',
    avatarBg: '#4F7BA1',
    toneSoft: '#D9E6EF',
  },
  {
    name: 'רוני טויטו',
    initials: 'רט',
    role: 'הצטרפות לקוחות',
    phone: '0549879533',
    intlPhone: '972549879533',
    avatarBg: '#B58A4C',
    toneSoft: '#F0E2C7',
  },
];

const whatsappMsg = encodeURIComponent('שלום, אשמח לפתוח חשבון בדוחות');

interface RegisterScreenProps {
  colors?: typeof lightColors;
}

export function RegisterScreen({ colors = lightColors }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-16)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(20)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 440, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 440, useNativeDriver: true }),
      ]),
      Animated.delay(60),
      Animated.parallel([
        Animated.timing(cardsOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(cardsY, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.delay(100),
      Animated.timing(footerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Aurora blob */}
      <View pointerEvents="none" style={styles.blob} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
          { opacity: headerOpacity, transform: [{ translateY: headerY }] },
        ]}
      >
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: colors.bgElev,
              borderColor: colors.lineStrong,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          hitSlop={10}
        >
          <Icons.forward size={22} color={colors.ink2} />
        </Pressable>

        {/* AI pill */}
        <View style={[styles.aiPill, { backgroundColor: colors.aiBg }]}>
          <Icons.sparkle size={11} color={colors.ai2} />
          <Text style={[styles.aiPillText, { color: colors.ai2, fontFamily: fonts.sans }]}>
            ליווי אישי
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
          בוא נכיר.
        </Text>
        <Text style={[styles.subtitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
          פתיחת חשבון בדוחות נעשית באופן אישי.{'\n'}
          בחר נציג — נחזור אליך תוך פחות משעה.
        </Text>
      </Animated.View>

      {/* ── Contact cards ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.cardsList,
            { opacity: cardsOpacity, transform: [{ translateY: cardsY }] },
          ]}
        >
          {CONTACTS.map((contact) => (
            <TeamCard key={contact.phone} contact={contact} colors={colors} />
          ))}

          {/* Explainer card */}
          <View
            style={[
              styles.explainerCard,
              { backgroundColor: colors.bgTint, borderColor: colors.line },
            ]}
          >
            <View style={[styles.explainerIcon, { backgroundColor: colors.accentBg }]}>
              <Icons.sparkle size={18} color={colors.accent} />
            </View>
            <View style={styles.explainerText}>
              <Text
                style={[styles.explainerTitle, { color: colors.ink1, fontFamily: fonts.sans }]}
              >
                למה לא נרשמים לבד?
              </Text>
              <Text
                style={[styles.explainerBody, { color: colors.ink2, fontFamily: fonts.sans }]}
              >
                אנחנו מתאימים לך את התבניות, מחברים את הלוגו והחתימה, ועוזרים לך לכתוב את הדוח הראשון.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footerWrap, { opacity: footerOpacity }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[styles.footerText, { color: colors.ink2, fontFamily: fonts.sans }]}>
              {'כבר יש לך חשבון? '}
              <Text style={{ color: colors.accent, fontWeight: '700' }}>התחבר</Text>
            </Text>
          </Pressable>

          <View style={[styles.securityBadge, { backgroundColor: colors.aiBg }]}>
            <Icons.shield size={11} color={colors.ai2} />
            <Text style={[styles.securityText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              הצפנה מקצה לקצה · נתונים בענן ישראלי
            </Text>
          </View>

          <View style={styles.legalLinks}>
            <Text
              style={[styles.legalLink, { color: colors.ink3, fontFamily: fonts.sans }]}
              onPress={() => Linking.openURL('https://dohot.netlify.app/privacy')}
            >
              מדיניות פרטיות
            </Text>
            <Text style={[styles.legalDot, { color: colors.ink4 }]}>·</Text>
            <Text
              style={[styles.legalLink, { color: colors.ink3, fontFamily: fonts.sans }]}
              onPress={() => Linking.openURL('https://dohot.netlify.app/terms')}
            >
              תנאי שימוש
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Team card ──────────────────────────────────────────────────────────────────

interface TeamCardProps {
  contact: Contact;
  colors: typeof lightColors;
}

function TeamCard({ contact, colors }: TeamCardProps) {
  const prettyPhone = contact.phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');

  const handleCall = () => Linking.openURL(`tel:${contact.phone}`);
  const handleWhatsApp = () =>
    Linking.openURL(`https://wa.me/${contact.intlPhone}?text=${whatsappMsg}`);

  const avatarShadow = Platform.select({
    ios: {
      shadowColor: contact.avatarBg,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: {},
  }) ?? {};

  return (
    <Card elev={2} padding={20} colors={colors} style={styles.teamCard}>
      {/* Tone wash blob */}
      <View
        pointerEvents="none"
        style={[styles.cardToneWash, { backgroundColor: contact.toneSoft }]}
      />

      {/* Avatar + info row */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: contact.avatarBg }, avatarShadow]}>
          <Text style={[styles.avatarInitials, { fontFamily: fonts.sans }]}>
            {contact.initials}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.contactName, { color: colors.ink1, fontFamily: fonts.serif }]}>
            {contact.name}
          </Text>
          <Text style={[styles.contactRole, { color: colors.ink3, fontFamily: fonts.sans }]}>
            {contact.role}
          </Text>
          <Text style={[styles.contactPhone, { color: colors.ink2, fontFamily: fonts.sans }]}>
            {prettyPhone}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleWhatsApp}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.waBtn,
            { opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Icons.whatsapp size={17} color="#fff" />
          <Text style={[styles.actionBtnText, { fontFamily: fonts.sans }]}>וואטסאפ</Text>
        </Pressable>

        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.callBtn,
            { backgroundColor: colors.ink1, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Icons.phone size={17} color="#FBF6EC" />
          <Text style={[styles.actionBtnText, { color: '#FBF6EC', fontFamily: fonts.sans }]}>
            חייג
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },

  blob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F5B393',
    opacity: 0.45,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  aiPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    marginBottom: 12,
  },
  aiPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 44,
    textAlign: 'right',
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'right',
    alignSelf: 'stretch',
  },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    gap: 14,
  },
  cardsList: { gap: 14 },

  // ── Team card ─────────────────────────────────────────────────────────────
  teamCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardToneWash: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cardInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  contactName: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  contactRole: {
    fontSize: 12,
    marginTop: 1,
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waBtn: {
    backgroundColor: '#25D366',
    ...Platform.select({
      ios: {
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  callBtn: {
    ...Platform.select({
      ios: {
        shadowColor: '#1B1916',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.20,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
    }),
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Explainer card ────────────────────────────────────────────────────────
  explainerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  explainerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  explainerText: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  explainerTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  explainerBody: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerWrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  securityBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legalLink: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDot: { fontSize: 11 },
});
