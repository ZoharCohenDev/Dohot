import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button, Card, Field } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import type { PropertyType } from '@dohot/shared';

interface CustomerStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
  professionalId?: string;
}

const PROPERTY_TYPES: Array<{ label: string; value: PropertyType; Icon: React.ComponentType<{ size: number; color: string }> }> = [
  { label: 'דירה', value: 'apartment', Icon: Icons.building },
  { label: 'בית פרטי', value: 'house', Icon: Icons.home },
  { label: 'בניין', value: 'building', Icon: Icons.building },
  { label: 'מסחרי', value: 'commercial', Icon: Icons.building },
  { label: 'משרד', value: 'office', Icon: Icons.building },
  { label: 'אחר', value: 'other', Icon: Icons.more },
];

export function CustomerStep({ colors = lightColors, onNext, onBack, professionalId }: CustomerStepProps) {
  const wizard = useWizard();

  const [name, setName] = React.useState(wizard.state.customerName);
  const [phone, setPhone] = React.useState(wizard.state.customerPhone);
  const [address, setAddress] = React.useState(wizard.state.customerAddress);
  const [propertyType, setPropertyType] = React.useState<PropertyType>(wizard.state.propertyType);
  const [nameError, setNameError] = React.useState('');

  const handleNext = () => {
    if (!name.trim()) {
      setNameError('יש להזין שם לקוח');
      return;
    }
    setNameError('');
    const trimmedName = name.trim();
    wizard.setCustomer(trimmedName, phone, address);
    wizard.setPropertyType(propertyType);
    if (professionalId) {
      wizard.initDraft(professionalId, { name: trimmedName, phone, address });
    }
    onNext?.();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={1} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={1 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            למי הדוח?
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            פרטי הלקוח יופיעו בכותרת המסמך
          </Text>
        </View>

        {/* AI customer suggestion */}
        <Card padding={14} colors={colors} style={{ backgroundColor: colors.aiBg, borderWidth: 1, borderColor: 'rgba(90,135,112,0.25)' }}>
          <View style={styles.aiSuggestRow}>
            <View style={[styles.aiIcon, { backgroundColor: colors.ai2 }]}>
              <Icons.sparkle size={18} color="#fff" />
            </View>
            <View style={styles.aiSuggestInfo}>
              <Text style={[styles.aiSuggestTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>
                זיהינו לקוח קיים
              </Text>
              <Text style={[styles.aiSuggestName, { color: colors.ink2, fontFamily: fonts.sans }]}>
                אבי כהן • דירת קוטון, הרצליה
              </Text>
            </View>
            <Text style={[styles.loadBtn, { color: colors.ai2, fontFamily: fonts.sans }]}>טען</Text>
          </View>
        </Card>

        <View>
          <Field
            label="שם הלקוח"
            placeholder="לדוגמה: אבי כהן"
            icon={<Icons.user size={20} color={nameError ? colors.danger : colors.ink3} />}
            value={name}
            onChangeText={(t) => { setName(t); if (t.trim()) setNameError(''); }}
            colors={colors}
          />
          {!!nameError && (
            <Text style={[styles.fieldError, { color: colors.danger, fontFamily: fonts.sans }]}>
              {nameError}
            </Text>
          )}
        </View>
        <Field
          label="כתובת הנכס"
          placeholder="רחוב, מספר, עיר"
          icon={<Icons.pin2 size={20} color={colors.ink3} />}
          value={address}
          onChangeText={setAddress}
          colors={colors}
        />

        <View style={styles.twoCol}>
          <View style={styles.halfField}>
            <Field
              label="טלפון"
              placeholder="050…"
              icon={<Icons.phone size={20} color={colors.ink3} />}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              colors={colors}
            />
          </View>
          <View style={styles.halfField}>
            <Field
              label="תאריך ביקור"
              icon={<Icons.calendar size={20} color={colors.ink3} />}
              defaultValue={new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              colors={colors}
            />
          </View>
        </View>

        {/* Property type grid */}
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
                <Text
                  style={[
                    styles.propertyLabel,
                    { color: propertyType === pt.value ? colors.bg : colors.ink1, fontFamily: fonts.sans },
                  ]}
                >
                  {pt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button kind="primary" size="lg" full onPress={handleNext} iconRight={<Icons.back size={20} color={colors.bg} />} colors={colors}>
          המשך לסוג התקלה
        </Button>
      </FixedBottom>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
    gap: 14,
  },
  titleBlock: { gap: 6, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6 },
  subtitle: { fontSize: 14 },
  aiSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiSuggestInfo: { flex: 1 },
  aiSuggestTitle: { fontSize: 13, fontWeight: '700' },
  aiSuggestName: { fontSize: 12, marginTop: 2 },
  loadBtn: { fontWeight: '700', fontSize: 13 },
  twoCol: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 4, marginBottom: 8 },
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
  fieldError: { fontSize: 12, marginTop: 4, paddingHorizontal: 4 },
});
