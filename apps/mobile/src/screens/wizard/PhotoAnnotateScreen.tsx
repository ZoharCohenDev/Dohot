import React from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, Marker } from 'react-native-svg';
import { Icons } from '@/components/icons';
import { fonts } from '@/theme/tokens';

interface PhotoAnnotateScreenProps {
  photoUri?: string;
  onBack?: () => void;
  onDone?: () => void;
}

const COLORS = ['#C2613B', '#B33B2C', '#5A8770', '#B8862B', '#FFD24A', '#FFFFFF'];
const TOOLS = [
  { label: 'חץ', Icon: Icons.arrowR, active: true },
  { label: 'עיגול', Icon: Icons.circle },
  { label: 'הדגשה', Icon: Icons.highlight },
  { label: 'ציור', Icon: Icons.pencil },
  { label: 'AI', Icon: Icons.wand, ai: true },
];

export function PhotoAnnotateScreen({ photoUri, onBack, onDone }: PhotoAnnotateScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedColor, setSelectedColor] = React.useState(0);
  const [selectedTool, setSelectedTool] = React.useState(0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.topBtn}>
          <Icons.close size={20} color="#fff" />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: fonts.sans }]}>סימון תמונה</Text>
        <Pressable onPress={onDone} style={styles.saveBtn}>
          <Text style={[styles.saveBtnText, { fontFamily: fonts.sans }]}>שמור</Text>
        </Pressable>
      </View>

      {/* Image canvas */}
      <View style={styles.canvas}>
        <View style={styles.imageWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Marker id="arrowA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <Path d="M0 0 L10 5 L0 10 z" fill="#C2613B" />
                </Marker>
              </Defs>
            </Svg>
          </View>
        </View>
      </View>

      {/* Bottom toolbar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {/* Color palette */}
        <View style={styles.colorRow}>
          {COLORS.map((c, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedColor(i)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                selectedColor === i && styles.colorSwatchActive,
              ]}
            />
          ))}
        </View>

        {/* Tool row */}
        <View style={styles.toolRow}>
          {TOOLS.map((tool, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedTool(i)}
              style={[
                styles.toolBtn,
                selectedTool === i && styles.toolBtnActive,
                tool.ai && !selectedTool && styles.toolBtnAi,
              ]}
            >
              <tool.Icon size={20} color={selectedTool === i ? '#1B1916' : '#fff'} />
              <Text style={[styles.toolLabel, { color: selectedTool === i ? '#1B1916' : '#fff', fontFamily: fonts.sans }]}>
                {tool.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0D0B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  saveBtnText: { color: '#1B1916', fontSize: 13, fontWeight: '700' },
  canvas: {
    flex: 1,
    paddingTop: 110,
    paddingBottom: 220,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  imageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    flex: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1917',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  toolBtn: {
    width: 56,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  toolBtnActive: {
    backgroundColor: '#fff',
  },
  toolBtnAi: {
    backgroundColor: '#5A8770',
  },
  toolLabel: { fontSize: 9, fontWeight: '600' },
});
