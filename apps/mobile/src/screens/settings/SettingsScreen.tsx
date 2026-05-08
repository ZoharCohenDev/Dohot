import React from 'react';
import {
  View, Pressable, ScrollView, Modal, TextInput,
  StyleSheet, Alert, PanResponder, ActivityIndicator, Image,
} from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { Header, BottomNav, type TabId } from '@/components/layout';
import { Card, Toggle, Button, ScaledText } from '@/components/primitives';
import { Avatar } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { useSettings, type FontSizePref } from '@/context/SettingsContext';
import { signOut } from '@/services/auth';
import { pickAndUploadImage } from '@/services/storage';
import { encodeSignatureSvg } from '@/services/profile';
import type { Certification } from '@dohot/shared';

type ModalKey = 'business' | 'signature' | 'certs' | 'disclaimer' | 'fontsize' | 'billing' | 'upgrade' | null;

interface SettingsScreenProps {
  dark?: boolean;
  colors?: typeof lightColors;
  onNavigate?: (tab: TabId) => void;
  onToggleTheme?: () => void;
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  colors: typeof lightColors;
  children: React.ReactNode;
  scrollable?: boolean;
}

function BottomSheet({ visible, onClose, title, colors, children, scrollable = true }: SheetProps) {
  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? { contentContainerStyle: styles.sheetContent, keyboardShouldPersistTaps: 'handled' as const }
    : { style: styles.sheetContent };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.line }]} />
          <View style={styles.sheetHeader}>
            <ScaledText style={[styles.sheetTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>{title}</ScaledText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icons.close size={20} color={colors.ink2} />
            </Pressable>
          </View>
          <Content {...contentProps}>{children}</Content>
        </View>
      </View>
    </Modal>
  );
}

// ─── BusinessModal ────────────────────────────────────────────────────────────

interface BizModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof lightColors;
}

function BusinessModal({ visible, onClose, colors }: BizModalProps) {
  const { businessProfile, updateProfile, session } = useAuth();
  const [fullName, setFullName] = React.useState('');
  const [bizName, setBizName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [license, setLicense] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);

  React.useEffect(() => {
    if (visible && businessProfile) {
      setFullName(businessProfile.full_name ?? '');
      setBizName(businessProfile.business_name ?? '');
      setPhone(businessProfile.phone ?? '');
      setLicense(businessProfile.license_number ?? '');
      setBio(businessProfile.bio ?? '');
      setLogoUrl(businessProfile.logo_url);
    }
  }, [visible, businessProfile]);

  const handleUploadLogo = async () => {
    if (!session?.user) return;
    setUploadingLogo(true);
    try {
      const url = await pickAndUploadImage(session.user.id, 'logos', { aspect: [1, 1] });
      if (url) setLogoUrl(url);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להעלות תמונה');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם מלא');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        business_name: bizName.trim(),
        phone: phone.trim() || null,
        license_number: license.trim() || null,
        bio: bio.trim() || null,
        logo_url: logoUrl,
      });
      onClose();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור שינויים. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="פרטי העסק" colors={colors}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <Pressable onPress={handleUploadLogo} style={[styles.logoBox, { backgroundColor: colors.bgSunken, borderColor: colors.line }]}>
          {uploadingLogo ? (
            <ActivityIndicator color={colors.ink3} />
          ) : logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.logoImg} />
          ) : (
            <Icons.image size={28} color={colors.ink3} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <ScaledText style={[styles.logoLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>לוגו העסק</ScaledText>
          <ScaledText style={[styles.logoSub, { color: colors.ink3, fontFamily: fonts.sans }]}>יופיע בכל המסמכים</ScaledText>
          <Pressable onPress={handleUploadLogo} style={{ marginTop: 6 }}>
            <ScaledText style={[styles.linkText, { color: colors.accent, fontFamily: fonts.sans }]}>החלף תמונה</ScaledText>
          </Pressable>
        </View>
      </View>

      <InputField label="שם מלא" value={fullName} onChangeText={setFullName} colors={colors} placeholder="ישראל ישראלי" />
      <InputField label="שם העסק" value={bizName} onChangeText={setBizName} colors={colors} placeholder="גילוי נזילות בע״מ" />
      <InputField label="טלפון" value={phone} onChangeText={setPhone} colors={colors} placeholder="050-0000000" keyboardType="phone-pad" />
      <InputField label="ח.פ / עוסק" value={license} onChangeText={setLicense} colors={colors} placeholder="000000000" keyboardType="number-pad" />
      <InputField label="תיאור קצר" value={bio} onChangeText={setBio} colors={colors} placeholder="תיאור העסק והניסיון שלך…" multiline rows={3} />

      <Button kind="primary" size="lg" full onPress={handleSave} disabled={saving} colors={colors}
        iconRight={saving ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
        {saving ? 'שומר…' : 'שמור שינויים'}
      </Button>
    </BottomSheet>
  );
}

// ─── SignaturePreview ─────────────────────────────────────────────────────────

function SignaturePreview({ uri, height }: { uri: string; height: number; colors?: typeof lightColors }) {
  if (uri.startsWith('data:image/svg+xml;base64,')) {
    const base64 = uri.replace('data:image/svg+xml;base64,', '');
    const xml = atob(base64);
    return <SvgXml xml={xml} width="100%" height={height} />;
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.currentSigImg, { height }]}
      resizeMode="contain"
    />
  );
}

// ─── SignatureModal ───────────────────────────────────────────────────────────

interface SigModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof lightColors;
}

function SignatureModal({ visible, onClose, colors }: SigModalProps) {
  const { businessProfile, updateProfile, session } = useAuth();
  const [tab, setTab] = React.useState<'draw' | 'upload'>('draw');
  const [displayPaths, setDisplayPaths] = React.useState<string[]>([]);
  const [activePath, setActivePath] = React.useState('');
  const [canvasWidth, setCanvasWidth] = React.useState(320);
  const [saving, setSaving] = React.useState(false);
  const allPathsRef = React.useRef<string[]>([]);
  const pointsRef = React.useRef<{ x: number; y: number }[]>([]);
  const CANVAS_H = 150;

  const toD = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    const first = pts[0]!;
    const rest = pts.slice(1);
    return `M${first.x.toFixed(1)} ${first.y.toFixed(1)} ` + rest.map(p => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      pointsRef.current = [{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }];
      setActivePath(toD(pointsRef.current));
    },
    onPanResponderMove: (e) => {
      pointsRef.current.push({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
      setActivePath(toD(pointsRef.current));
    },
    onPanResponderRelease: () => {
      const d = toD(pointsRef.current);
      if (d) {
        allPathsRef.current = [...allPathsRef.current, d];
        setDisplayPaths([...allPathsRef.current]);
      }
      setActivePath('');
      pointsRef.current = [];
    },
  }), []); // refs only — no deps needed

  const clearDrawing = () => {
    allPathsRef.current = [];
    setDisplayPaths([]);
    setActivePath('');
  };

  React.useEffect(() => {
    if (visible) {
      clearDrawing();
      setTab('draw');
    }
  }, [visible]);

  const handleSaveDraw = async () => {
    if (allPathsRef.current.length === 0) {
      Alert.alert('חתימה ריקה', 'יש לחתום לפני השמירה');
      return;
    }
    setSaving(true);
    try {
      const pathEls = allPathsRef.current
        .map(d => `<path d="${d}" fill="none" stroke="#1B1916" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`)
        .join('\n');
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${CANVAS_H}" width="${canvasWidth}" height="${CANVAS_H}">\n${pathEls}\n</svg>`;
      const dataUri = encodeSignatureSvg(svgContent);
      await updateProfile({ signature_url: dataUri });
      onClose();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור את החתימה');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const url = await pickAndUploadImage(session.user.id, 'signatures', { aspect: [3, 1], quality: 0.9 });
      if (url) {
        await updateProfile({ signature_url: url });
        onClose();
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להעלות תמונה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="חתימה דיגיטלית" colors={colors} scrollable={false}>
      <View style={styles.sheetContent}>
        {/* Current signature preview */}
        {businessProfile?.signature_url && (
          <View style={[styles.currentSigBox, { backgroundColor: colors.bgSunken, borderColor: colors.line }]}>
            <ScaledText style={[styles.currentSigLabel, { color: colors.ink3, fontFamily: fonts.sans }]}>חתימה נוכחית</ScaledText>
            <SignaturePreview uri={businessProfile.signature_url} height={60} colors={colors} />
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.bgSunken }]}>
          {(['draw', 'upload'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)}
              style={[styles.tabPill, t === tab && { backgroundColor: colors.bgElev }]}>
              <ScaledText style={[styles.tabPillText, { color: t === tab ? colors.ink1 : colors.ink3, fontFamily: fonts.sans }]}>
                {t === 'draw' ? 'צייר' : 'העלאה'}
              </ScaledText>
            </Pressable>
          ))}
        </View>

        {tab === 'draw' ? (
          <>
            <View style={[styles.sigCanvas, { borderColor: colors.line }]}
              onLayout={(e) => setCanvasWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}>
              <Svg width={canvasWidth} height={CANVAS_H}>
                {displayPaths.map((d, i) => (
                  <SvgPath key={i} d={d} fill="none" stroke={colors.ink1} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {activePath ? <SvgPath d={activePath} fill="none" stroke={colors.ink1} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
                {displayPaths.length === 0 && !activePath && (
                  <SvgPath d="M 30 110 L 290 110" stroke={colors.line} strokeWidth={1} />
                )}
              </Svg>
              {displayPaths.length === 0 && !activePath && (
                <ScaledText style={[styles.sigHint, { color: colors.ink4, fontFamily: fonts.sans }]}>חתום כאן</ScaledText>
              )}
            </View>
            <Pressable onPress={clearDrawing} style={styles.clearLink}>
              <ScaledText style={[styles.linkText, { color: colors.ink3, fontFamily: fonts.sans }]}>נקה</ScaledText>
            </Pressable>
            <Button kind="primary" size="lg" full onPress={handleSaveDraw} disabled={saving} colors={colors}
              iconRight={saving ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
              {saving ? 'שומר…' : 'שמור חתימה'}
            </Button>
          </>
        ) : (
          <>
            <ScaledText style={[styles.uploadHint, { color: colors.ink3, fontFamily: fonts.sans }]}>
              בחר תמונה של חתימה מהגלריה (רוחב 3:1 מומלץ)
            </ScaledText>
            <Button kind="primary" size="lg" full onPress={handleUpload} disabled={saving} colors={colors}
              iconRight={saving ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
              {saving ? 'מעלה…' : 'בחר מגלריה'}
            </Button>
          </>
        )}
      </View>
    </BottomSheet>
  );
}

// ─── CertificationsModal ──────────────────────────────────────────────────────

interface CertsModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof lightColors;
}

function CertificationsModal({ visible, onClose, colors }: CertsModalProps) {
  const { businessProfile, updateProfile, session } = useAuth();
  const [certs, setCerts] = React.useState<Certification[]>([]);
  const [note, setNote] = React.useState('');
  const [editingNote, setEditingNote] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newYear, setNewYear] = React.useState('');
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(null);
  const [newImageLocalUri, setNewImageLocalUri] = React.useState<string | null>(null);
  const [uploadingNewImg, setUploadingNewImg] = React.useState(false);
  // local preview URIs for cert list (keyed by index) — used until Supabase URL is confirmed working
  const [localUriMap, setLocalUriMap] = React.useState<Record<number, string>>({});
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setCerts(businessProfile?.certifications ?? []);
      setNote(businessProfile?.certifications_note ?? '');
      setNewName('');
      setNewYear('');
      setNewImageUrl(null);
      setNewImageLocalUri(null);
      setLocalUriMap({});
      setShowForm(false);
      setEditingNote(false);
    }
  }, [visible, businessProfile]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await updateProfile({ certifications_note: note.trim() || null });
      setEditingNote(false);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור');
    } finally {
      setSavingNote(false);
    }
  };

  const handleUploadNewImg = async () => {
    if (!session?.user) return;
    setUploadingNewImg(true);
    try {
      const url = await pickAndUploadImage(
        session.user.id,
        'cert-images',
        { aspect: [1, 1], quality: 0.9 },
        (localUri) => {
          setNewImageLocalUri(localUri);
          setUploadingNewImg(false);
        },
      );
      if (url) setNewImageUrl(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[cert upload]', msg);
      Alert.alert('שגיאה בהעלאה', msg);
    } finally {
      setUploadingNewImg(false);
    }
  };

  const handleUploadCertImg = async (idx: number) => {
    if (!session?.user) return;
    try {
      const url = await pickAndUploadImage(
        session.user.id,
        'cert-images',
        { aspect: [1, 1], quality: 0.9 },
        (localUri) => setLocalUriMap((prev) => ({ ...prev, [idx]: localUri })),
      );
      if (!url) return;
      const updated = certs.map((c, i) => i === idx ? { ...c, image_url: url } : c);
      await updateProfile({ certifications: updated });
      setCerts(updated);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[cert upload]', msg);
      Alert.alert('שגיאה בהעלאה', msg);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם תעודה');
      return;
    }
    const newCert: Certification = {
      name: newName.trim(),
      year: newYear.trim(),
      ...(newImageUrl ? { image_url: newImageUrl } : {}),
    };
    const updated = [...certs, newCert];
    setSaving(true);
    try {
      await updateProfile({ certifications: updated });
      setCerts(updated);
      setNewName('');
      setNewYear('');
      setNewImageUrl(null);
      setShowForm(false);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx: number) => {
    const updated = certs.filter((_, i) => i !== idx);
    setSaving(true);
    try {
      await updateProfile({ certifications: updated });
      setCerts(updated);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן למחוק');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="תעודות והסמכות" colors={colors}>

      {/* ── General note ── */}
      {editingNote ? (
        <View style={styles.certForm}>
          <View style={[styles.textAreaWrap, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong }]}>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              placeholder="הוסף הערה כללית על ההסמכות שלך…"
              placeholderTextColor={colors.ink4}
              style={[styles.textArea, { color: colors.ink1, fontFamily: fonts.sans }]}
              textAlign="right"
              textAlignVertical="top"
              autoFocus
            />
          </View>
          <View style={styles.formActions}>
            <Button kind="ghost" size="md" onPress={() => setEditingNote(false)} colors={colors} style={{ flex: 1 }}>ביטול</Button>
            <Button kind="primary" size="md" onPress={handleSaveNote} disabled={savingNote} colors={colors} style={{ flex: 1 }}
              iconRight={savingNote ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
              {savingNote ? '…' : 'שמור'}
            </Button>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setEditingNote(true)}
          style={[styles.certNoteBox, { backgroundColor: colors.bgSunken, borderColor: colors.line }]}
        >
          <View style={{ flex: 1 }}>
            {note ? (
              <>
                <ScaledText style={[styles.certNoteLabel, { color: colors.ink4, fontFamily: fonts.sans }]}>הערה כללית</ScaledText>
                <ScaledText style={[styles.certNoteText, { color: colors.ink1, fontFamily: fonts.sans }]} numberOfLines={3}>{note}</ScaledText>
              </>
            ) : (
              <ScaledText style={[styles.certNoteEmpty, { color: colors.ink3, fontFamily: fonts.sans }]}>הוסף הערה כללית…</ScaledText>
            )}
          </View>
          <Icons.edit size={15} color={colors.ink4} />
        </Pressable>
      )}

      {/* ── Cert list ── */}
      {!showForm && (certs.length === 0 ? (
        <View style={styles.emptyState}>
          <Icons.badge size={36} color={colors.ink4} />
          <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>אין תעודות עדיין</ScaledText>
        </View>
      ) : (
        <View style={styles.certList}>
          {certs.map((cert, i) => {
            const thumbUri = localUriMap[i] ?? cert.image_url ?? null;
            return (
            <Pressable key={i} style={[styles.certRow, { backgroundColor: colors.bgSunken }]}
              onPress={() => thumbUri ? setPreviewUri(thumbUri) : null}
            >
              {/* Cert image thumbnail — tap to upload/replace */}
              <View style={[styles.certThumb, {
                backgroundColor: thumbUri ? 'transparent' : colors.bgElev,
                borderColor: colors.line,
              }]}>
                {thumbUri ? (
                  <Image
                    source={{ uri: thumbUri }}
                    style={{ width: 56, height: 56 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Icons.image size={16} color={colors.ink4} />
                )}
                <Pressable onPress={() => handleUploadCertImg(i)} style={StyleSheet.absoluteFill} />
              </View>

              <View style={{ flex: 1 }}>
                <ScaledText style={[styles.certName, { color: colors.ink1, fontFamily: fonts.sans }]}>{cert.name}</ScaledText>
                {cert.year ? <ScaledText style={[styles.certYear, { color: colors.ink3, fontFamily: fonts.sans }]}>{cert.year}</ScaledText> : null}
              </View>
              <Pressable onPress={() => handleDelete(i)} hitSlop={8}>
                <Icons.trash size={18} color={colors.danger} />
              </Pressable>
            </Pressable>
          );})}
        </View>
      ))}

      {/* ── Image preview modal ── */}
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={styles.certPreviewOverlay} onPress={() => setPreviewUri(null)}>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.certPreviewImg}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* ── Add form ── */}
      {showForm ? (
        <View style={styles.certForm}>
          <InputField label="שם התעודה" value={newName} onChangeText={setNewName} colors={colors} placeholder="הסמכת גילוי נזילות" />
          <InputField label="שנה" value={newYear} onChangeText={setNewYear} colors={colors} placeholder="2024" keyboardType="number-pad" />

          <View style={styles.inputWrap}>
            <ScaledText style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>תמונה / סריקה (אופציונלי)</ScaledText>
            <View style={[styles.certImgUpload, {
              backgroundColor: colors.bgElev,
              borderColor: colors.lineStrong,
              borderStyle: (newImageLocalUri ?? newImageUrl) ? 'solid' : 'dashed',
            }]}>
              {uploadingNewImg ? (
                <ActivityIndicator color={colors.ink3} />
              ) : (newImageLocalUri ?? newImageUrl) ? (
                <>
                  <Image
                    source={{ uri: (newImageLocalUri ?? newImageUrl)! }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View style={styles.certImgReplaceHint}>
                    <ScaledText style={{ color: '#fff', fontSize: 11, fontFamily: fonts.sans }}>החלף תמונה</ScaledText>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Icons.image size={26} color={colors.ink3} />
                  <ScaledText style={[{ color: colors.ink3, fontFamily: fonts.sans, fontSize: 12 }]}>בחר מגלריה</ScaledText>
                </View>
              )}
              <Pressable onPress={handleUploadNewImg} style={StyleSheet.absoluteFill} />
            </View>
          </View>

          <View style={styles.formActions}>
            <Button kind="ghost" size="md" onPress={() => { setShowForm(false); setNewImageUrl(null); }} colors={colors} style={{ flex: 1 }}>ביטול</Button>
            <Button kind="primary" size="md" onPress={handleAdd} disabled={saving} colors={colors} style={{ flex: 1 }}
              iconRight={saving ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
              {saving ? '…' : 'הוסף'}
            </Button>
          </View>
        </View>
      ) : (
        <Button kind="ghost" size="md" full icon={<Icons.plus size={18} color={colors.ink1} />} onPress={() => setShowForm(true)} colors={colors}>
          הוסף תעודה
        </Button>
      )}
    </BottomSheet>
  );
}

// ─── DisclaimerModal ──────────────────────────────────────────────────────────

interface DisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof lightColors;
}

function DisclaimerModal({ visible, onClose, colors }: DisclaimerModalProps) {
  const { businessProfile, updateProfile } = useAuth();
  const [text, setText] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (visible) setText(businessProfile?.default_disclaimer ?? '');
  }, [visible, businessProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ default_disclaimer: text.trim() || null });
      onClose();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="הסתייגות משפטית" colors={colors}>
      <ScaledText style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>
        תוצג בתחתית כל מסמך
      </ScaledText>
      <View style={[styles.textAreaWrap, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={6}
          placeholder="הזן טקסט הסתייגות משפטית…"
          placeholderTextColor={colors.ink4}
          style={[styles.textArea, { color: colors.ink1, fontFamily: fonts.sans }]}
          textAlign="right"
          textAlignVertical="top"
        />
      </View>
      <Button kind="primary" size="lg" full onPress={handleSave} disabled={saving} colors={colors}
        iconRight={saving ? <ActivityIndicator size="small" color={colors.bg} /> : undefined}>
        {saving ? 'שומר…' : 'שמור'}
      </Button>
    </BottomSheet>
  );
}

// ─── FontSizeModal ────────────────────────────────────────────────────────────

const FONT_OPTIONS: { key: FontSizePref; label: string; desc: string }[] = [
  { key: 'sm', label: 'קטן', desc: 'טקסט מוקטן' },
  { key: 'md', label: 'רגיל', desc: 'ברירת מחדל' },
  { key: 'lg', label: 'גדול', desc: 'טקסט מוגדל' },
];

interface FontSizeModalProps {
  visible: boolean;
  onClose: () => void;
  colors: typeof lightColors;
}

function FontSizeModal({ visible, onClose, colors }: FontSizeModalProps) {
  const { fontSizePref, setFontSizePref } = useSettings();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="גודל טקסט" colors={colors}>
      {FONT_OPTIONS.map((opt) => (
        <Pressable key={opt.key} onPress={() => { setFontSizePref(opt.key); onClose(); }}
          style={[styles.optionRow, { borderColor: colors.line, backgroundColor: opt.key === fontSizePref ? colors.bgSunken : colors.bgElev }]}>
          <View style={{ flex: 1 }}>
            <ScaledText style={[styles.optionLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>{opt.label}</ScaledText>
            <ScaledText style={[styles.optionDesc, { color: colors.ink3, fontFamily: fonts.sans }]}>{opt.desc}</ScaledText>
          </View>
          {opt.key === fontSizePref && <Icons.check size={20} color={colors.ai2} />}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

// ─── BillingModal ─────────────────────────────────────────────────────────────

function BillingModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: typeof lightColors }) {
  const { businessProfile } = useAuth();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="היסטוריית חיובים" colors={colors}>
      <View style={styles.emptyState}>
        <Icons.history size={40} color={colors.ink4} />
        {businessProfile?.plan === 'free' ? (
          <>
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>אתה במסלול החינמי</ScaledText>
            <ScaledText style={[styles.emptySubText, { color: colors.ink4, fontFamily: fonts.sans }]}>שדרג לפרו כדי לצפות בהיסטוריית חיובים</ScaledText>
          </>
        ) : (
          <>
            <ScaledText style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.sans }]}>אין חיובים להצגה</ScaledText>
            <ScaledText style={[styles.emptySubText, { color: colors.ink4, fontFamily: fonts.sans }]}>החיובים יופיעו כאן לאחר ביצוע תשלום</ScaledText>
          </>
        )}
      </View>
    </BottomSheet>
  );
}

// ─── UpgradeModal ─────────────────────────────────────────────────────────────

const PRO_FEATURES = [
  'מסמכים ללא הגבלה',
  'לוגו מותאם אישית בכל PDF',
  'הפקת PDF מהירה',
  'תמיכה בעדיפות',
  'ייצוא נתונים',
];

function UpgradeModal({ visible, onClose, colors }: { visible: boolean; onClose: () => void; colors: typeof lightColors }) {
  const { businessProfile } = useAuth();
  const isPro = businessProfile?.plan === 'pro';

  const handleUpgrade = () => {
    Alert.alert(
      'שדרוג לפרו',
      'לשדרוג המסלול צרו קשר עם התמיכה: support@dohot.app',
      [{ text: 'סגור', style: 'cancel' }],
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="מסלול מנוי" colors={colors}>
      {isPro ? (
        <View style={[styles.planCard, { backgroundColor: colors.aiBg, borderColor: colors.ai2 }]}>
          <View style={styles.planCardHeader}>
            <Icons.shieldCheck size={24} color={colors.ai2} />
            <ScaledText style={[styles.planCardTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>תכנית פרו פעילה</ScaledText>
          </View>
          <ScaledText style={[styles.planCardSub, { color: colors.ai2, fontFamily: fonts.sans }]}>
            גישה מלאה לכל הפיצ׳רים
          </ScaledText>
        </View>
      ) : (
        <>
          <View style={[styles.planCard, { backgroundColor: colors.bgSunken, borderColor: colors.line }]}>
            <ScaledText style={[styles.planCardTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>חינמי</ScaledText>
            <ScaledText style={[styles.planCardSub, { color: colors.ink3, fontFamily: fonts.sans }]}>10 מסמכים בחודש · ללא לוגו</ScaledText>
          </View>

          <View style={[styles.planCard, { backgroundColor: colors.aiBg, borderColor: colors.ai2 }]}>
            <View style={styles.planCardHeader}>
              <ScaledText style={[styles.planCardTitle, { color: colors.ai2, fontFamily: fonts.sans }]}>פרו</ScaledText>
              <View style={[styles.priceTag, { backgroundColor: colors.ai2 }]}>
                <ScaledText style={[styles.priceText, { color: '#fff', fontFamily: fonts.sans }]}>₪79 / חודש</ScaledText>
              </View>
            </View>
            <View style={styles.featureList}>
              {PRO_FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Icons.check size={16} color={colors.ai2} />
                  <ScaledText style={[styles.featureText, { color: colors.ink1, fontFamily: fonts.sans }]}>{f}</ScaledText>
                </View>
              ))}
            </View>
          </View>

          <Button kind="ai" size="lg" full onPress={handleUpgrade} colors={colors}>
            שדרג לפרו
          </Button>
        </>
      )}
    </BottomSheet>
  );
}

// ─── InputField ───────────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: typeof lightColors;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
}

function InputField({ label, value, onChangeText, colors, placeholder, multiline, rows = 3, keyboardType = 'default' }: InputFieldProps) {
  return (
    <View style={styles.inputWrap}>
      <ScaledText style={[styles.fieldLabel, { color: colors.ink2, fontFamily: fonts.sans }]}>{label}</ScaledText>
      <View style={[styles.inputBox, { backgroundColor: colors.bgElev, borderColor: colors.lineStrong, minHeight: multiline ? undefined : 52, alignItems: multiline ? 'flex-start' : 'center', paddingTop: multiline ? 12 : 0, paddingBottom: multiline ? 12 : 0 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink4}
          multiline={multiline}
          numberOfLines={multiline ? rows : 1}
          keyboardType={keyboardType}
          style={[styles.inputText, { color: colors.ink1, fontFamily: fonts.sans }, multiline && styles.multilineText]}
          textAlign="right"
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  right?: React.ReactNode;
  last?: boolean;
  colors: typeof lightColors;
  onPress?: () => void;
}

function SettingRow({ icon, label, value, right, last, colors, onPress }: SettingRowProps) {
  const inner = (
    <View style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <View style={styles.settingIcon}>{icon}</View>
      <ScaledText style={[styles.settingLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>{label}</ScaledText>
      {right ?? (
        <View style={styles.settingRight}>
          {value && <ScaledText style={[styles.settingValue, { color: colors.ink3, fontFamily: fonts.sans }]}>{value}</ScaledText>}
          <Icons.chevL size={16} color={colors.ink4} />
        </View>
      )}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {inner}
    </Pressable>
  );
}

function SettingGroup({ title, children, colors }: { title: string; children: React.ReactNode; colors: typeof lightColors }) {
  return (
    <View style={styles.group}>
      <ScaledText style={[styles.groupTitle, { color: colors.ink3, fontFamily: fonts.sans }]}>{title}</ScaledText>
      <View style={[styles.groupCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
        {children}
      </View>
    </View>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

export function SettingsScreen({ dark = false, colors = lightColors, onNavigate, onToggleTheme }: SettingsScreenProps) {
  const { businessProfile } = useAuth();
  const { fontSizePref } = useSettings();
  const [openModal, setModal] = React.useState<ModalKey>(null);

  const displayName = businessProfile?.full_name || businessProfile?.business_name || 'משתמש';
  const businessName = businessProfile?.business_name || '';
  const plan = businessProfile?.plan ?? 'free';

  const certCount = businessProfile?.certifications?.length ?? 0;
  const hasSig = Boolean(businessProfile?.signature_url);
  const hasDisclaimer = Boolean(businessProfile?.default_disclaimer);
  const fontLabel = fontSizePref === 'sm' ? 'קטן' : fontSizePref === 'lg' ? 'גדול' : 'רגיל';

  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שאתה רוצה להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header large title="ההגדרות שלי" colors={colors} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Card padding={20} colors={colors} style={{ marginBottom: 18 }}>
          <Pressable style={styles.profileRow} onPress={() => setModal('business')}>
            <Avatar name={displayName} size={56} logoUrl={businessProfile?.logo_url} />
            <View style={styles.profileInfo}>
              <ScaledText style={[styles.profileName, { color: colors.ink1, fontFamily: fonts.sans }]}>{displayName}</ScaledText>
              {businessName ? <ScaledText style={[styles.profileBiz, { color: colors.ink3, fontFamily: fonts.sans }]}>{businessName}</ScaledText> : null}
              {plan === 'pro' && (
                <View style={[styles.proBadge, { backgroundColor: colors.aiBg }]}>
                  <Icons.shieldCheck size={12} color={colors.ai2} />
                  <ScaledText style={[styles.proBadgeText, { color: colors.ai2, fontFamily: fonts.sans }]}>תכנית פרו</ScaledText>
                </View>
              )}
            </View>
            <Icons.edit size={18} color={colors.ink3} />
          </Pressable>
        </Card>

        <SettingGroup title="פרופיל ומסמכים" colors={colors}>
          <SettingRow icon={<Icons.building size={20} color={colors.ink2} />} label="פרטי העסק"
            value={businessName || 'לא הוגדר'} colors={colors} onPress={() => setModal('business')} />
          <SettingRow icon={<Icons.signature size={20} color={colors.ink2} />} label="חתימה דיגיטלית"
            value={hasSig ? 'הוגדרה' : 'לא הוגדרה'} colors={colors} onPress={() => setModal('signature')} />
          <SettingRow icon={<Icons.badge size={20} color={colors.ink2} />} label="תעודות והסמכות"
            value={certCount > 0 ? `${certCount} תעודות` : 'ריק'} colors={colors} onPress={() => setModal('certs')} />
          <SettingRow icon={<Icons.doc size={20} color={colors.ink2} />} label="הסתייגות משפטית"
            value={hasDisclaimer ? 'הוגדרה' : 'לא הוגדרה'} colors={colors} last onPress={() => setModal('disclaimer')} />
        </SettingGroup>

        <SettingGroup title="מראה" colors={colors}>
          <SettingRow icon={<Icons.moon size={20} color={colors.ink2} />} label="מצב כהה"
            right={<Toggle on={dark} onChange={onToggleTheme} colors={colors} />} colors={colors} />
          <SettingRow icon={<Icons.sun size={20} color={colors.ink2} />} label="גודל טקסט"
            value={fontLabel} colors={colors} last onPress={() => setModal('fontsize')} />
        </SettingGroup>

        <SettingGroup title="מנוי" colors={colors}>
          <SettingRow icon={<Icons.star size={20} color={colors.ink2} />} label="תכנית ומנוי"
            value={plan === 'pro' ? 'פרו' : 'חינמי'} colors={colors} onPress={() => setModal('upgrade')} />
          <SettingRow icon={<Icons.history size={20} color={colors.ink2} />} label="היסטוריית חיובים"
            colors={colors} last onPress={() => setModal('billing')} />
        </SettingGroup>

        <Pressable onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.dangerBg }]}>
          <Icons.logout size={18} color={colors.danger} />
          <ScaledText style={[styles.logoutText, { color: colors.danger, fontFamily: fonts.sans }]}>התנתק</ScaledText>
        </Pressable>

        <ScaledText style={[styles.version, { color: colors.ink4, fontFamily: fonts.sans }]}>דוחות 2.4.1 · נבנה בארץ</ScaledText>
      </ScrollView>

      <BottomNav active="me" onTab={onNavigate} colors={colors} />

      {/* Modals */}
      <BusinessModal visible={openModal === 'business'} onClose={() => setModal(null)} colors={colors} />
      <SignatureModal visible={openModal === 'signature'} onClose={() => setModal(null)} colors={colors} />
      <CertificationsModal visible={openModal === 'certs'} onClose={() => setModal(null)} colors={colors} />
      <DisclaimerModal visible={openModal === 'disclaimer'} onClose={() => setModal(null)} colors={colors} />
      <FontSizeModal visible={openModal === 'fontsize'} onClose={() => setModal(null)} colors={colors} />
      <BillingModal visible={openModal === 'billing'} onClose={() => setModal(null)} colors={colors} />
      <UpgradeModal visible={openModal === 'upgrade'} onClose={() => setModal(null)} colors={colors} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontWeight: '700', fontSize: 17 },
  profileBiz: { fontSize: 13, marginTop: 2 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, marginTop: 6, alignSelf: 'flex-start' },
  proBadgeText: { fontSize: 11, fontWeight: '600' },

  group: { marginBottom: 18 },
  groupTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, paddingHorizontal: 4 },
  groupCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  settingIcon: { flexShrink: 0 },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 13 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, marginTop: 18, gap: 8 },
  logoutText: { fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', marginTop: 16, fontSize: 11 },

  // BottomSheet
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 8, gap: 14 },

  // Business modal
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  logoBox: { width: 72, height: 72, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 72, height: 72, borderRadius: 18 },
  logoLabel: { fontWeight: '700', fontSize: 15 },
  logoSub: { fontSize: 13, marginTop: 2 },
  linkText: { fontSize: 13, fontWeight: '600' },

  // Input
  inputWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', paddingHorizontal: 2 },
  inputBox: { flexDirection: 'row', paddingHorizontal: 16, borderWidth: 1, borderRadius: 14 },
  inputText: { flex: 1, fontSize: 15, padding: 0 },
  multilineText: { textAlignVertical: 'top' },

  // Signature modal
  currentSigBox: { borderRadius: 14, borderWidth: 1, padding: 12 },
  currentSigLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  currentSigImg: { width: '100%' },
  tabRow: { flexDirection: 'row', padding: 4, borderRadius: 12, gap: 4 },
  tabPill: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabPillText: { fontSize: 14, fontWeight: '600' },
  sigCanvas: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', height: 150 },
  sigHint: { position: 'absolute', bottom: 10, alignSelf: 'center', fontSize: 13 },
  clearLink: { alignSelf: 'flex-end' },
  uploadHint: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },

  // Certifications
  certNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  certNoteLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  certNoteText: { fontSize: 13, lineHeight: 19 },
  certNoteEmpty: { fontSize: 13, fontStyle: 'italic' },
  certList: { gap: 8 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  certIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  certThumb: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  certImgUpload: { aspectRatio: 1, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  certImgReplaceHint: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center' },
  certName: { fontSize: 14, fontWeight: '600' },
  certYear: { fontSize: 12, marginTop: 2 },
  certForm: { gap: 12 },
  formActions: { flexDirection: 'row', gap: 10 },
  certPreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center' },
  certPreviewImg: { width: '90%', height: '70%' },

  // Disclaimer
  textAreaWrap: { borderRadius: 14, borderWidth: 1, padding: 14 },
  textArea: { fontSize: 15, minHeight: 100 },

  // Font size
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 12, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySubText: { fontSize: 13, textAlign: 'center' },

  // Plan cards
  planCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 6 },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  planCardTitle: { fontSize: 17, fontWeight: '700' },
  planCardSub: { fontSize: 13 },
  priceTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceText: { fontSize: 13, fontWeight: '700' },
  featureList: { marginTop: 10, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14 },
});
