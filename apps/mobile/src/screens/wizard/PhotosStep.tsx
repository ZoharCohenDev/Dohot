import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { DamageImage } from '@/components/shared';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import Svg, { Path, Circle, Defs, Marker } from 'react-native-svg';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { pickAndUploadImage } from '@/services/storage';

interface PhotosStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
  onAnnotate?: () => void;
}

type DamageKind = 'leak' | 'pipe' | 'moisture' | 'roof';

const PLACEHOLDER_PHOTOS: Array<{ kind: DamageKind; label: string; tag: string; tagColor: string; annotated?: boolean }> = [
  { kind: 'leak', label: 'קיר מערבי', tag: 'לפני', tagColor: '#B33B2C', annotated: true },
  { kind: 'pipe', label: 'מתחת לכיור', tag: 'לפני', tagColor: '#B33B2C' },
  { kind: 'moisture', label: 'תקרת חדר אמבטיה', tag: 'לפני', tagColor: '#B33B2C' },
  { kind: 'roof', label: 'גג', tag: 'אחר', tagColor: '#5A8770' },
];

const TOOLS = [
  { label: 'חץ', Icon: Icons.arrowR },
  { label: 'עיגול', Icon: Icons.circle },
  { label: 'הדגשה', Icon: Icons.highlight },
  { label: 'ציור חופשי', Icon: Icons.pencil },
  { label: 'לפני/אחרי', Icon: Icons.swap },
];

export function PhotosStep({ colors = lightColors, onNext, onBack, onAnnotate }: PhotosStepProps) {
  const wizard = useWizard();
  const { user } = useAuth();
  const [uploading, setUploading] = React.useState(false);

  const photos = wizard.state.photos;

  const handleAddPhoto = async () => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const url = await pickAndUploadImage(user.id, 'report-images', { aspect: [4, 3] });
      if (url) wizard.addPhoto(url);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן היה להעלות את התמונה. נסה שוב.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Header step={3} ofSteps={5} onBack={onBack} colors={colors} />
      <ProgressBar value={3 / 5} colors={colors} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.ink1, fontFamily: fonts.serif }]}>
              תמונות מהשטח
            </Text>
            <Text style={[styles.subtitle, { color: colors.ink3, fontFamily: fonts.sans }]}>
              {photos.length > 0
                ? `${photos.length} תמונות · אפשר לסמן ולהוסיף הערות`
                : '4 צולמו · אפשר לסמן ולהוסיף הערות'}
            </Text>
          </View>
          <View style={[styles.aiTag, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={11} color={colors.ai2} />
            <Text style={[styles.aiTagText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              שיפור AI
            </Text>
          </View>
        </View>

        {/* Camera tile (full width) */}
        <Pressable style={styles.cameraBtn} onPress={handleAddPhoto} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Icons.camera size={28} color="#fff" />
              <View>
                <Text style={styles.cameraBtnTitle}>
                  {photos.length > 0 ? 'הוסף תמונה נוספת' : 'צלם תמונה חדשה'}
                </Text>
                <Text style={styles.cameraBtnSub}>או גלול למעלה לגלריה</Text>
              </View>
            </>
          )}
        </Pressable>

        {/* Photo grid — real photos or placeholders */}
        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoTile}>
                <Image
                  source={{ uri }}
                  style={styles.photoTileImage}
                  resizeMode="cover"
                />
                <View style={[styles.photoTag, { backgroundColor: '#B33B2C' }]}>
                  <Text style={[styles.photoTagText, { fontFamily: fonts.sans }]}>לפני</Text>
                </View>
                <View style={styles.photoLabelOverlay} pointerEvents="none">
                  <Text style={[styles.photoLabel, { fontFamily: fonts.sans }]}>
                    {`תמונה ${i + 1}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {PLACEHOLDER_PHOTOS.map((photo, i) => (
              <Pressable
                key={i}
                onPress={() => i === 0 && onAnnotate?.()}
                style={styles.photoTile}
              >
                <DamageImage kind={photo.kind} height={160} />

                {photo.annotated && (
                  <View style={styles.annotationOverlay} pointerEvents="none">
                    <Svg width="100%" height="100%" viewBox="0 0 200 200">
                      <Defs>
                        <Marker id="arrow1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                          <Path d="M0 0 L10 5 L0 10 z" fill="#C2613B" />
                        </Marker>
                      </Defs>
                      <Circle cx="100" cy="80" r="32" fill="none" stroke="#C2613B" strokeWidth="3" />
                      <Path d="M60 50 L 80 70" stroke="#C2613B" strokeWidth="3" markerEnd="url(#arrow1)" strokeLinecap="round" />
                    </Svg>
                  </View>
                )}

                <View style={[styles.photoTag, { backgroundColor: photo.tagColor }]}>
                  <Text style={[styles.photoTagText, { fontFamily: fonts.sans }]}>{photo.tag}</Text>
                </View>

                <View style={styles.photoLabelOverlay} pointerEvents="none">
                  <Text style={[styles.photoLabel, { fontFamily: fonts.sans }]}>{photo.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Quick toolbar */}
        <View style={[styles.toolbarCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
          <Text style={[styles.toolbarTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
            סימון מהיר
          </Text>
          <View style={styles.toolbarRow}>
            {TOOLS.map((tool, i) => (
              <View
                key={i}
                style={[styles.toolChip, { backgroundColor: colors.bgSunken }]}
              >
                <tool.Icon size={14} color={colors.ink1} />
                <Text style={[styles.toolChipLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>
                  {tool.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          disabled={uploading}
          onPress={onNext}
          iconRight={<Icons.back size={20} color={colors.bg} />}
          colors={colors}
        >
          המשך לקול
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: '500', letterSpacing: -0.6, lineHeight: 33 },
  subtitle: { fontSize: 14, marginTop: 6 },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  aiTagText: { fontSize: 12, fontWeight: '700' },
  cameraBtn: {
    height: 160,
    borderRadius: 18,
    backgroundColor: '#C2613B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowColor: '#C2613B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cameraBtnTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'right' },
  cameraBtnSub: { color: '#fff', fontSize: 12, opacity: 0.85, textAlign: 'right' },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: '47.5%',
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  photoTileImage: {
    width: '100%',
    height: '100%',
  },
  annotationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  photoTag: {
    position: 'absolute',
    top: 8,
    start: 8,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  photoTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  photoLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  photoLabel: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'right' },
  toolbarCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  toolbarTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  toolChipLabel: { fontSize: 12, fontWeight: '600' },
});
