import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Alert, Modal,
} from 'react-native';
import { Header, ProgressBar, KeyboardAwareFormLayout } from '@/components/layout';
import { Button, KeyboardAwareScrollView } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard, type WaResident } from '@/context/WizardContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';

interface WaResidentsStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
}

const EMPTY_RESIDENT: Omit<WaResident, 'id'> = {
  fullName: '',
  phone: '',
  apartment: '',
  floor: '',
  notes: '',
};

function ResidentFormModal({
  visible,
  initial,
  onSave,
  onClose,
  colors,
}: {
  visible: boolean;
  initial: Omit<WaResident, 'id'>;
  onSave: (data: Omit<WaResident, 'id'>) => void;
  onClose: () => void;
  colors: typeof lightColors;
}) {
  const [form, setForm] = useState(initial);

  React.useEffect(() => {
    if (visible) setForm(initial);
  }, [visible]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.fullName.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם מלא של הדייר');
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.line }]} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
              פרטי דייר
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icons.close size={20} color={colors.ink2} />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={styles.modalContent}
            extraScrollHeight={140}
            extraHeight={140}
          >
            <Field
              label="שם מלא *"
              value={form.fullName}
              onChangeText={set('fullName')}
              placeholder="שם הדייר"
              colors={colors}
            />
            <Field
              label="טלפון"
              value={form.phone}
              onChangeText={set('phone')}
              placeholder="050-0000000"
              keyboardType="phone-pad"
              colors={colors}
            />
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <Field
                  label="דירה"
                  value={form.apartment}
                  onChangeText={set('apartment')}
                  placeholder="מס' דירה"
                  keyboardType="number-pad"
                  colors={colors}
                />
              </View>
              <View style={styles.rowHalf}>
                <Field
                  label="קומה"
                  value={form.floor}
                  onChangeText={set('floor')}
                  placeholder="מס' קומה"
                  keyboardType="number-pad"
                  colors={colors}
                />
              </View>
            </View>
            <Field
              label="הערות"
              value={form.notes}
              onChangeText={set('notes')}
              placeholder="הערות נוספות (אופציונלי)"
              multiline
              colors={colors}
            />
          </KeyboardAwareScrollView>

          <View style={[styles.modalActions, { borderTopColor: colors.line }]}>
            <Button kind="primary" size="lg" full onPress={handleSave} colors={colors}>
              שמור דייר
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline, colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  multiline?: boolean;
  colors: typeof lightColors;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>{label}</Text>
      <View style={[styles.fieldInput, { borderColor: colors.line, backgroundColor: colors.bgElev }, multiline && styles.fieldInputMulti]}>
        <TextInput
          style={[styles.fieldText, { color: colors.ink1, fontFamily: fonts.sans }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink4}
          keyboardType={keyboardType ?? 'default'}
          multiline={multiline}
          textAlign="right"
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

export function WaResidentsStep({ colors = lightColors, onNext, onBack }: WaResidentsStepProps) {
  const wizard = useWizard();
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();

  const residents = wizard.state.waResidents;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInitial, setEditInitial] = useState<Omit<WaResident, 'id'>>(EMPTY_RESIDENT);

  const openAdd = () => {
    setEditingIndex(null);
    setEditInitial({ ...EMPTY_RESIDENT });
    setModalVisible(true);
  };

  const openEdit = (idx: number) => {
    const r = residents[idx];
    if (!r) return;
    setEditingIndex(idx);
    setEditInitial({ fullName: r.fullName, phone: r.phone, apartment: r.apartment, floor: r.floor, notes: r.notes });
    setModalVisible(true);
  };

  const handleSaveResident = (data: Omit<WaResident, 'id'>) => {
    if (editingIndex !== null) {
      const updated = residents.map((r, i) =>
        i === editingIndex ? { ...r, ...data } : r,
      );
      wizard.setWaResidents(updated);
    } else {
      const id = `${Date.now()}`;
      wizard.setWaResidents([...residents, { id, ...data }]);
    }
    setModalVisible(false);
  };

  const handleDelete = (idx: number) => {
    Alert.alert('מחיקת דייר', 'האם למחוק דייר זה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: () => wizard.setWaResidents(residents.filter((_, i) => i !== idx)),
      },
    ]);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else goNext();
  };

  return (
    <KeyboardAwareFormLayout
      colors={colors}
      header={
        <>
          <Header
            step={stepNum}
            ofSteps={stepOf}
            onBack={onBack ?? goBack}
            colors={colors}
            action={
              <Pressable
                onPress={triggerExit}
                style={[styles.exitBtn, { backgroundColor: colors.bgElev, borderColor: colors.line }]}
                hitSlop={6}
              >
                <Icons.home size={20} color={colors.ink2} />
              </Pressable>
            }
          />
          <ProgressBar value={progress} colors={colors} />
        </>
      }
      contentContainerStyle={styles.content}
      bottomAction={
        <Button
          kind="primary"
          size="lg"
          full
          onPress={handleNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך לפירוט עבודות
        </Button>
      }
    >
          <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
            דיירים / משתתפים בהסכם
          </Text>
          <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
            הוסף את כל הדיירים המשתתפים בהסכם
          </Text>

          {/* Residents list */}
          {residents.length > 0 && (
            <View style={[styles.list, { borderColor: colors.line, backgroundColor: colors.bgElev }]}>
              {residents.map((resident, idx) => (
                <View
                  key={resident.id}
                  style={[
                    styles.residentRow,
                    idx < residents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.line },
                  ]}
                >
                  <View style={[styles.residentNum, { backgroundColor: colors.bgSunken }]}>
                    <Text style={[styles.residentNumText, { color: colors.ink3, fontFamily: fonts.sans }]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={styles.residentInfo}>
                    <Text style={[styles.residentName, { color: colors.ink1, fontFamily: fonts.sans }]}>
                      {resident.fullName}
                    </Text>
                    <Text style={[styles.residentMeta, { color: colors.ink3, fontFamily: fonts.sans }]}>
                      {[
                        resident.phone,
                        resident.apartment && `דירה ${resident.apartment}`,
                        resident.floor && `קומה ${resident.floor}`,
                      ].filter(Boolean).join(' · ')}
                    </Text>
                    {!!resident.notes && (
                      <Text style={[styles.residentNotes, { color: colors.ink4, fontFamily: fonts.sans }]}>
                        {resident.notes}
                      </Text>
                    )}
                  </View>
                  <View style={styles.residentActions}>
                    <Pressable onPress={() => openEdit(idx)} hitSlop={8}>
                      <Icons.edit size={18} color={colors.ink3} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(idx)} hitSlop={8}>
                      <Icons.trash size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add resident button */}
          <Pressable
            onPress={openAdd}
            style={[styles.addBtn, { borderColor: colors.line, backgroundColor: colors.bgElev }]}
          >
            <Icons.plus size={18} color={colors.ai2} />
            <Text style={[styles.addBtnText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              הוסף דייר
            </Text>
          </Pressable>

          {residents.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
              <Icons.customers size={28} color={colors.ink4} />
              <Text style={[styles.emptyTitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
                אין דיירים עדיין
              </Text>
              <Text style={[styles.emptyText, { color: colors.ink4, fontFamily: fonts.sans }]}>
                הוסף דיירים משתתפים בהסכם
              </Text>
            </View>
          )}

      <ResidentFormModal
        visible={modalVisible}
        initial={editInitial}
        onSave={handleSaveResident}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </KeyboardAwareFormLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  title: { fontSize: 30, fontWeight: '500', lineHeight: 33, letterSpacing: -0.6, textAlign: 'right' },
  subtitle: { fontSize: 14, textAlign: 'right' },
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  list: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  residentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  residentNum: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  residentNumText: { fontSize: 11, fontWeight: '700' },
  residentInfo: { flex: 1 },
  residentName: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  residentMeta: { fontSize: 12, marginTop: 2, textAlign: 'right' },
  residentNotes: { fontSize: 11, marginTop: 2, textAlign: 'right', fontStyle: 'italic' },
  residentActions: { flexDirection: 'row-reverse', gap: 14, flexShrink: 0, paddingTop: 3 },

  addBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 14, fontWeight: '700' },

  emptyState: {
    borderRadius: 18, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 36, alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 12,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalContent: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  modalActions: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },

  // Field
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
  fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  fieldInputMulti: { minHeight: 80, paddingTop: 12 },
  fieldText: { fontSize: 14, textAlign: 'right' },

  row: { flexDirection: 'row-reverse', gap: 10 },
  rowHalf: { flex: 1 },
});
