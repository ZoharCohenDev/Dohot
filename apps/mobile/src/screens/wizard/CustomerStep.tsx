import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Field } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useAuth } from '@/context/AuthContext';
import { searchCustomers, type CustomerFields } from '@/services/documents';
import type { Customer, PropertyType } from '@dohot/shared';

interface CustomerStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
  professionalId?: string;
}

const PROPERTY_TYPES: Array<{
  label: string; value: PropertyType;
  Icon: React.ComponentType<{ size: number; color: string }>;
}> = [
  { label: 'דירה', value: 'apartment', Icon: Icons.building },
  { label: 'בית פרטי', value: 'house', Icon: Icons.home },
  { label: 'בניין', value: 'building', Icon: Icons.building },
  { label: 'מסחרי', value: 'commercial', Icon: Icons.building },
  { label: 'משרד', value: 'office', Icon: Icons.building },
  { label: 'אחר', value: 'other', Icon: Icons.more },
];

const PHONE_RE = /^0[2-9]\d{7,8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(v: string) {
  const digits = v.replace(/[-\s]/g, '');
  return digits.length === 0 || PHONE_RE.test(digits);
}

function formatCustomerAddress(c: Customer): string {
  const parts = [
    [c.street, c.house_number].filter(Boolean).join(' '),
    c.city,
  ].filter(Boolean);
  return parts.join(', ') || c.address || '';
}

export function CustomerStep({
  colors = lightColors, onNext, onBack, professionalId,
}: CustomerStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack, config } = useWizardStep();
  const { businessProfile } = useAuth();
  const profId = professionalId ?? businessProfile?.id ?? '';

  // Form state
  const [name, setName] = useState(wizard.state.customerName);
  const [phone, setPhone] = useState(wizard.state.customerPhone);
  const [email, setEmail] = useState(wizard.state.customerEmail);
  const [city, setCity] = useState(wizard.state.customerCity);
  const [street, setStreet] = useState(wizard.state.customerStreet);
  const [houseNumber, setHouseNumber] = useState(wizard.state.customerHouseNumber);
  const [apartment, setApartment] = useState(wizard.state.customerApartment);
  const [floor, setFloor] = useState(wizard.state.customerFloor);
  const [propertyType, setPropertyType] = useState<PropertyType>(wizard.state.propertyType);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Autocomplete
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (!name.trim() || name.length < 2 || !profId) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await searchCustomers(profId, name);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, profId]);

  const selectCustomer = (c: Customer) => {
    Keyboard.dismiss();
    skipSearchRef.current = true;
    setName(c.name);
    setPhone(c.phone ?? '');
    setEmail(c.email ?? '');
    setCity(c.city ?? '');
    setStreet(c.street ?? '');
    setHouseNumber(c.house_number ?? '');
    setApartment(c.apartment ?? '');
    setFloor(c.floor ?? '');
    setSuggestions([]);
    setShowSuggestions(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'שם לקוח הוא שדה חובה';
    if (!phone.trim()) e.phone = 'טלפון הוא שדה חובה';
    else if (!validatePhone(phone)) e.phone = 'מספר טלפון לא תקין';
    if (!city.trim()) e.city = 'עיר היא שדה חובה';
    if (!street.trim()) e.street = 'רחוב הוא שדה חובה';
    if (!houseNumber.trim()) e.houseNumber = 'מספר בית הוא שדה חובה';
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = 'כתובת אימייל לא תקינה';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    const fields: CustomerFields = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      street: street.trim(),
      houseNumber: houseNumber.trim(),
      apartment: apartment.trim(),
      floor: floor.trim(),
    };
    wizard.setCustomer(fields);
    wizard.setPropertyType(propertyType);
    if (profId) wizard.initDraft(profId, fields);
    if (onNext) onNext();
    else goNext();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={stepNum} ofSteps={stepOf} onBack={onBack ?? goBack} colors={colors} />
      <ProgressBar value={progress} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            למי המסמך?
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            פרטי הלקוח יופיעו בכותרת המסמך
          </Text>
        </View>

        {/* ── Name + autocomplete ── */}
        <View>
          <Field
            label="שם לקוח"
            placeholder="חפש לקוח קיים או הזן שם חדש…"
            icon={<Icons.user size={20} color={errors.name ? colors.danger : colors.ink3} />}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name && t.trim()) setErrors((e) => ({ ...e, name: '' }));
            }}
            error={!!errors.name}
            colors={colors}
          />
          {!!errors.name && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.name}</Text>}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <View style={[styles.suggestCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
              {loadingSuggestions ? (
                <View style={styles.suggestLoader}>
                  <ActivityIndicator size="small" color={colors.ink4} />
                </View>
              ) : (
                suggestions.map((c, i) => (
                  <Pressable
                    key={c.id}
                    onPress={() => selectCustomer(c)}
                    style={[
                      styles.suggestRow,
                      i < suggestions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.line } : undefined,
                    ]}
                  >
                    <Avatar name={c.name} size={36} colors={colors} />
                    <View style={styles.suggestInfo}>
                      <Text style={[styles.suggestName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                        {c.name}
                      </Text>
                      {!!formatCustomerAddress(c) && (
                        <Text style={[styles.suggestAddr, { color: colors.ink3, fontFamily: fonts.sans }]}>
                          {formatCustomerAddress(c)}
                        </Text>
                      )}
                    </View>
                    <Icons.chevL size={16} color={colors.ink4} />
                  </Pressable>
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Phone ── */}
        <View>
          <Field
            label="טלפון"
            placeholder="050-0000000"
            icon={<Icons.phone size={20} color={errors.phone ? colors.danger : colors.ink3} />}
            value={phone}
            onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors((e) => ({ ...e, phone: '' })); }}
            keyboardType="phone-pad"
            error={!!errors.phone}
            colors={colors}
          />
          {!!errors.phone && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.phone}</Text>}
        </View>

        {/* ── City ── */}
        <View>
          <Field
            label="עיר"
            placeholder="תל אביב, ירושלים…"
            icon={<Icons.building size={20} color={errors.city ? colors.danger : colors.ink3} />}
            value={city}
            onChangeText={(t) => { setCity(t); if (errors.city) setErrors((e) => ({ ...e, city: '' })); }}
            error={!!errors.city}
            colors={colors}
          />
          {!!errors.city && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.city}</Text>}
        </View>

        {/* ── Street + House number ── */}
        <View style={styles.twoCol}>
          <View style={styles.streetField}>
            <Field
              label="רחוב"
              placeholder="שם הרחוב"
              icon={<Icons.pin2 size={20} color={errors.street ? colors.danger : colors.ink3} />}
              value={street}
              onChangeText={(t) => { setStreet(t); if (errors.street) setErrors((e) => ({ ...e, street: '' })); }}
              error={!!errors.street}
              colors={colors}
            />
            {!!errors.street && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.street}</Text>}
          </View>
          <View style={styles.numField}>
            <Field
              label="מספר"
              placeholder="5"
              icon={<Icons.edit size={20} color={errors.houseNumber ? colors.danger : colors.ink3} />}
              value={houseNumber}
              onChangeText={(t) => { setHouseNumber(t); if (errors.houseNumber) setErrors((e) => ({ ...e, houseNumber: '' })); }}
              error={!!errors.houseNumber}
              colors={colors}
            />
            {!!errors.houseNumber && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.houseNumber}</Text>}
          </View>
        </View>

        {/* ── Apartment + Floor (optional) ── */}
        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <Field
              label="דירה (אופציונלי)"
              placeholder="3"
              icon={<Icons.home size={20} color={colors.ink3} />}
              value={apartment}
              onChangeText={setApartment}
              colors={colors}
            />
          </View>
          <View style={styles.halfField}>
            <Field
              label="קומה (אופציונלי)"
              placeholder="2"
              icon={<Icons.building size={20} color={colors.ink3} />}
              value={floor}
              onChangeText={setFloor}
              colors={colors}
            />
          </View>
        </View>

        {/* ── Email (optional) ── */}
        <View>
          <Field
            label="אימייל (אופציונלי)"
            placeholder="example@email.com"
            icon={<Icons.mail size={20} color={errors.email ? colors.danger : colors.ink3} />}
            value={email}
            onChangeText={(t) => { setEmail(t); if (errors.email) setErrors((e) => ({ ...e, email: '' })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            colors={colors}
          />
          {!!errors.email && <Text style={[styles.fieldError, { color: colors.danger }]}>{errors.email}</Text>}
        </View>

        {/* ── Property type ── */}
        <View>
          <Text style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
            סוג הנכס
          </Text>
          <View style={styles.propertyGrid}>
            {PROPERTY_TYPES.map((pt) => (
              <Pressable
                key={pt.value}
                onPress={() => setPropertyType(pt.value)}
                style={[
                  styles.propertyTile,
                  {
                    backgroundColor: propertyType === pt.value ? colors.ink1 : colors.bgElev,
                    borderWidth: propertyType === pt.value ? 0 : 1,
                    borderColor: colors.line,
                  },
                ]}
              >
                <pt.Icon size={20} color={propertyType === pt.value ? colors.bg : colors.ink1} />
                <Text style={[
                  styles.propertyLabel,
                  { color: propertyType === pt.value ? colors.bg : colors.ink1, fontFamily: fonts.sans },
                ]}>
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          {config.customerNextLabel}
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  titleBlock: { gap: 6, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  twoCol: { flexDirection: 'row', gap: 10 },
  streetField: { flex: 2 },
  numField: { flex: 1 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, marginBottom: 8 },
  fieldError: { fontSize: 12, marginTop: 4, paddingHorizontal: 4, fontFamily: fonts.sans },
  suggestCard: {
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  suggestLoader: { height: 52, alignItems: 'center', justifyContent: 'center' },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestInfo: { flex: 1, minWidth: 0 },
  suggestName: { fontSize: 14, fontWeight: '600' },
  suggestAddr: { fontSize: 12, marginTop: 1 },
  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  propertyTile: {
    width: '30%',
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  propertyLabel: { fontSize: 12, fontWeight: '600' },
});
