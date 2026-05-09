import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Alert, ActivityIndicator, Image, ActionSheetIOS, Platform,
} from 'react-native';
import { Header, FixedBottom, ProgressBar } from '@/components/layout';
import { Button } from '@/components/primitives';
import { Icons } from '@/components/icons';
import { lightColors, fonts } from '@/theme/tokens';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useWizardExit } from '@/hooks/useWizardExit';
import { pickAndUploadImage, captureAndUploadImage } from '@/services/storage';

interface PhotosStepProps {
  colors?: typeof lightColors;
  onNext?: () => void;
  onBack?: () => void;
  onAnnotate?: (uri?: string) => void;
}

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
  const { progress, stepNum, stepOf, goNext, goBack } = useWizardStep();
  const { triggerExit } = useWizardExit();
  const [uploading, setUploading] = React.useState(false);

  const photos = wizard.currentIssue.photos;

  const handleAddPhoto = () => {
    if (!user?.id) return;

    const doUpload = async (source: 'camera' | 'library') => {
      setUploading(true);
      try {
        const fn = source === 'camera' ? captureAndUploadImage : pickAndUploadImage;
        const url = await fn(user.id!, 'report-images', { aspect: [4, 3] });
        if (url) wizard.addPhoto(url);
      } catch {
        Alert.alert('שגיאה', 'לא ניתן היה להעלות את התמונה. נסה שוב.');
      } finally {
        setUploading(false);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['ביטול', 'צלם תמונה', 'בחר מהגלריה'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) doUpload('camera');
          else if (idx === 2) doUpload('library');
        },
      );
    } else {
      Alert.alert('הוסף תמונה', '', [
        { text: 'צלם תמונה', onPress: () => doUpload('camera') },
        { text: 'בחר מהגלריה', onPress: () => doUpload('library') },
        { text: 'ביטול', style: 'cancel' },
      ]);
    }
  };

  const handleDelete = (uri: string) => {
    Alert.alert('מחק תמונה', 'האם למחוק תמונה זו?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => wizard.removePhoto(uri) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
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
                ? `${photos.length} תמונות · לחץ לסימון ועריכה`
                : 'הוסף תמונות לתיעוד הנזק'}
            </Text>
          </View>
          <View style={[styles.aiTag, { backgroundColor: colors.aiBg }]}>
            <Icons.sparkle size={11} color={colors.ai2} />
            <Text style={[styles.aiTagText, { color: colors.ai2, fontFamily: fonts.sans }]}>
              שיפור AI
            </Text>
          </View>
        </View>

        {/* Camera button */}
        <Pressable style={styles.cameraBtn} onPress={handleAddPhoto} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Icons.camera size={28} color="#fff" />
              <View>
                <Text style={styles.cameraBtnTitle}>
                  {photos.length > 0 ? 'הוסף תמונה נוספת' : 'צלם או בחר מהגלריה'}
                </Text>
                <Text style={styles.cameraBtnSub}>
                  {photos.length > 0 ? 'מצלמה או גלריה' : 'תיעוד הנזק יופיע בדוח'}
                </Text>
              </View>
            </>
          )}
        </Pressable>

        {/* Photo grid or empty state */}
        {photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {photos.map((uri, i) => (
              <Pressable
                key={uri}
                style={styles.photoTile}
                onPress={() => onAnnotate?.(uri)}
              >
                <Image source={{ uri }} style={styles.photoTileImage} resizeMode="cover" />

                {/* Annotate overlay hint */}
                <View style={styles.editOverlay} pointerEvents="none">
                  <View style={styles.editBadge}>
                    <Icons.pencil size={11} color="#fff" />
                    <Text style={styles.editBadgeText}>ערוך</Text>
                  </View>
                </View>

                {/* Photo number badge */}
                <View style={[styles.photoTag, { backgroundColor: '#1B1916' }]}>
                  <Text style={[styles.photoTagText, { fontFamily: fonts.sans }]}>
                    {`${i + 1}`}
                  </Text>
                </View>

                {/* Delete button */}
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(uri)}
                  hitSlop={8}
                >
                  <Icons.close size={12} color="#fff" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.bgSunken }]}>
              <Icons.camera size={28} color={colors.ink4} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.ink2, fontFamily: fonts.sans }]}>
              אין תמונות עדיין
            </Text>
            <Text style={[styles.emptyText, { color: colors.ink4, fontFamily: fonts.sans }]}>
              תמונות תתועדנה בדוח המקצועי
            </Text>
          </View>
        )}

        {/* Annotation toolbar — only relevant when photos exist */}
        {photos.length > 0 && (
          <View style={[styles.toolbarCard, { backgroundColor: colors.bgElev, borderColor: colors.line }]}>
            <Text style={[styles.toolbarTitle, { color: colors.ink1, fontFamily: fonts.sans }]}>
              סימון מהיר
            </Text>
            <View style={styles.toolbarRow}>
              {TOOLS.map((tool, i) => (
                <Pressable
                  key={i}
                  style={[styles.toolChip, { backgroundColor: colors.bgSunken }]}
                  onPress={() => photos[0] && onAnnotate?.(photos[0])}
                >
                  <tool.Icon size={14} color={colors.ink1} />
                  <Text style={[styles.toolChipLabel, { color: colors.ink1, fontFamily: fonts.sans }]}>
                    {tool.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <FixedBottom colors={colors}>
        <Button
          kind="primary"
          size="lg"
          full
          disabled={uploading}
          onPress={onNext ?? goNext}
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
  exitBtn: {
    width: 44, height: 44, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140, gap: 14 },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: '500', letterSpacing: -0.6, lineHeight: 33 },
  subtitle: { fontSize: 14, marginTop: 6 },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
  },
  aiTagText: { fontSize: 12, fontWeight: '700' },
  cameraBtn: {
    height: 160, borderRadius: 18, backgroundColor: '#C2613B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14,
    shadowColor: '#C2613B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  cameraBtnTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'right' },
  cameraBtnSub: { color: '#fff', fontSize: 12, opacity: 0.85, textAlign: 'right' },

  // Empty state
  emptyState: {
    borderRadius: 18, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 40, alignItems: 'center', gap: 8,
  },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13 },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoTile: {
    width: '47.5%', height: 160, borderRadius: 18,
    overflow: 'hidden', position: 'relative',
  },
  photoTileImage: { width: '100%', height: '100%' },
  editOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'flex-end', justifyContent: 'flex-end',
    padding: 8,
  },
  editBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: undefined },
  photoTag: {
    position: 'absolute', top: 8, start: 8,
    paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999,
  },
  photoTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  deleteBtn: {
    position: 'absolute', top: 8, end: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Toolbar
  toolbarCard: { padding: 16, borderRadius: 18, borderWidth: 1 },
  toolbarTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toolChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
  },
  toolChipLabel: { fontSize: 12, fontWeight: '600' },
});
