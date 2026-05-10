import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  Image, PanResponder, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import { Icons } from '@/components/icons';
import { fonts } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number };

type ShapeArrow  = { id: string; type: 'arrow';  x1: number; y1: number; x2: number; y2: number; color: string };
type ShapeCircle = { id: string; type: 'circle'; cx: number; cy: number; r: number;  color: string };
type ShapeStroke = { id: string; type: 'stroke'; d: string;  color: string; strokeWidth: number; opacity: number };
type Shape = ShapeArrow | ShapeCircle | ShapeStroke;

type ActiveArrow  = { type: 'arrow';  x1: number; y1: number; x2: number; y2: number };
type ActiveCircle = { type: 'circle'; cx: number; cy: number; r: number };
type ActiveStroke = { type: 'stroke'; points: Point[] };
type ActiveShape  = ActiveArrow | ActiveCircle | ActiveStroke | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#C2613B', '#B33B2C', '#5A8770', '#B8862B', '#FFD24A', '#FFFFFF'];

const TOOLS = [
  { label: 'חץ',      Icon: Icons.arrowR   },
  { label: 'עיגול',   Icon: Icons.circle   },
  { label: 'הדגשה',   Icon: Icons.highlight },
  { label: 'ציור',    Icon: Icons.pencil   },
  { label: 'AI',      Icon: Icons.wand, ai: true },
];

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function buildSvgPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cur  = pts[i]!;
    const next = pts[i + 1]!;
    const mx = (cur.x + next.x) / 2;
    const my = (cur.y + next.y) / 2;
    d += ` Q ${cur.x} ${cur.y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function arrowheadPoints(x1: number, y1: number, x2: number, y2: number, size = 16): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const spread = 0.42;
  const ax = x2 - size * Math.cos(angle - spread);
  const ay = y2 - size * Math.sin(angle - spread);
  const bx = x2 - size * Math.cos(angle + spread);
  const by = y2 - size * Math.sin(angle + spread);
  return `${x2},${y2} ${ax},${ay} ${bx},${by}`;
}

// ─── SVG shape renderers ──────────────────────────────────────────────────────

function ArrowSvg({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (dist < 6) return null;
  const ratio = Math.max(0, (dist - 10) / dist);
  const ex = x1 + (x2 - x1) * ratio;
  const ey = y1 + (y2 - y1) * ratio;
  return (
    <>
      <Path
        d={`M ${x1} ${y1} L ${ex} ${ey}`}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Polygon points={arrowheadPoints(x1, y1, x2, y2)} fill={color} />
    </>
  );
}

function renderShape(s: Shape) {
  if (s.type === 'arrow') {
    return <ArrowSvg key={s.id} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} color={s.color} />;
  }
  if (s.type === 'circle') {
    return (
      <Circle key={s.id} cx={s.cx} cy={s.cy} r={s.r}
        stroke={s.color} strokeWidth={3} fill="none" />
    );
  }
  return (
    <Path key={s.id} d={s.d}
      stroke={s.color} strokeWidth={s.strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      fill="none" opacity={s.opacity} />
  );
}

function renderActive(active: ActiveShape, color: string, tool: number) {
  if (!active) return null;
  if (active.type === 'arrow') {
    return <ArrowSvg x1={active.x1} y1={active.y1} x2={active.x2} y2={active.y2} color={color} />;
  }
  if (active.type === 'circle') {
    if (active.r < 4) return null;
    return <Circle cx={active.cx} cy={active.cy} r={active.r} stroke={color} strokeWidth={3} fill="none" />;
  }
  const pts = active.points;
  if (pts.length < 2) return null;
  return (
    <Path
      d={buildSvgPath(pts)}
      stroke={color}
      strokeWidth={tool === 2 ? 22 : 3}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={tool === 2 ? 0.38 : 1}
    />
  );
}

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadAnnotatedImage(userId: string, localUri: string): Promise<string> {
  const storagePath = `${userId}/annotated_${Date.now()}.jpg`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  const { error } = await supabase.storage
    .from('report-images')
    .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  // report-images is a private bucket — signed URL required (same as storage.ts)
  const { data: signed, error: signErr } = await supabase.storage
    .from('report-images')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (signErr || !signed) throw signErr ?? new Error('Failed to create signed URL');
  return signed.signedUrl;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

interface PhotoAnnotateScreenProps {
  photoUri?: string;
  userId?: string;
  onBack?: () => void;
  onDone?: (annotatedUri: string) => void;
}

export function PhotoAnnotateScreen({ photoUri, userId, onBack, onDone }: PhotoAnnotateScreenProps) {
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<View>(null);

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedTool, setSelectedTool] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeShape, setActiveShape] = useState<ActiveShape>(null);
  const [saving, setSaving] = useState(false);

  // Refs for PanResponder (closures don't re-capture state)
  const colorRef     = useRef<string>(COLORS[0] ?? '#C2613B');
  const toolRef      = useRef(0);
  const startPtRef   = useRef<Point>({ x: 0, y: 0 });
  const strokePtsRef = useRef<Point[]>([]);
  const activeRef    = useRef<ActiveShape>(null);

  const handleSelectColor = (i: number) => {
    setSelectedColor(i);
    colorRef.current = COLORS[i] ?? '#C2613B';
  };

  const handleSelectTool = (i: number) => {
    setSelectedTool(i);
    toolRef.current = i;
  };

  const handleUndo = () => {
    setShapes((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (saving) return;

    // No drawings — return original URI unchanged
    if (shapes.length === 0) {
      onDone?.(photoUri ?? '');
      return;
    }

    if (!canvasRef.current) {
      onDone?.(photoUri ?? '');
      return;
    }

    setSaving(true);
    try {
      const localUri = await captureRef(canvasRef, { format: 'jpg', quality: 0.9 });
      let finalUri = localUri;

      if (userId) {
        finalUri = await uploadAnnotatedImage(userId, localUri);
      }

      onDone?.(finalUri);
    } catch {
      // Fall back to original URI on failure
      onDone?.(photoUri ?? '');
    } finally {
      setSaving(false);
    }
  };

  // ── PanResponder ──────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => toolRef.current !== 4,
      onMoveShouldSetPanResponder:  () => toolRef.current !== 4,
      onStartShouldSetPanResponderCapture: () => toolRef.current !== 4,

      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const tool = toolRef.current;
        startPtRef.current = { x, y };
        strokePtsRef.current = [{ x, y }];

        let initial: ActiveShape = null;
        if (tool === 0) initial = { type: 'arrow',  x1: x, y1: y, x2: x, y2: y };
        else if (tool === 1) initial = { type: 'circle', cx: x, cy: y, r: 0 };
        else initial = { type: 'stroke', points: [{ x, y }] };

        activeRef.current = initial;
        setActiveShape(initial);
      },

      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        const tool  = toolRef.current;
        const start = startPtRef.current;
        let updated: ActiveShape = null;

        if (tool === 0) {
          updated = { type: 'arrow', x1: start.x, y1: start.y, x2: x, y2: y };
        } else if (tool === 1) {
          const r = Math.sqrt((x - start.x) ** 2 + (y - start.y) ** 2);
          updated = { type: 'circle', cx: start.x, cy: start.y, r };
        } else {
          const pts = strokePtsRef.current;
          const last = pts[pts.length - 1];
          if (!last || (x - last.x) ** 2 + (y - last.y) ** 2 > 9) {
            strokePtsRef.current = [...pts, { x, y }];
          }
          updated = { type: 'stroke', points: strokePtsRef.current };
        }

        activeRef.current = updated;
        setActiveShape(updated);
      },

      onPanResponderRelease: () => {
        const data  = activeRef.current;
        const color = colorRef.current;
        const tool  = toolRef.current;
        activeRef.current = null;
        setActiveShape(null);
        if (!data) return;

        const id = `${Date.now()}-${Math.random()}`;
        let newShape: Shape | null = null;

        if (data.type === 'arrow') {
          const dist = Math.sqrt((data.x2 - data.x1) ** 2 + (data.y2 - data.y1) ** 2);
          if (dist > 12) newShape = { id, type: 'arrow', x1: data.x1, y1: data.y1, x2: data.x2, y2: data.y2, color };
        } else if (data.type === 'circle') {
          if (data.r > 10) newShape = { id, type: 'circle', cx: data.cx, cy: data.cy, r: data.r, color };
        } else if (data.type === 'stroke') {
          if (data.points.length > 1) {
            newShape = {
              id,
              type: 'stroke',
              d: buildSvgPath(data.points),
              color,
              strokeWidth: tool === 2 ? 22 : 3,
              opacity: tool === 2 ? 0.38 : 1,
            };
          }
        }

        if (newShape) setShapes((prev) => [...prev, newShape!]);
      },

      onPanResponderTerminate: () => {
        activeRef.current = null;
        setActiveShape(null);
      },
    }),
  ).current;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.topBtn}>
          <Icons.close size={20} color="#fff" />
        </Pressable>
        <Text style={[styles.topTitle, { fontFamily: fonts.sans }]}>סימון תמונה</Text>
        <View style={styles.topRight}>
          {shapes.length > 0 && (
            <Pressable onPress={handleUndo} style={styles.undoBtn} hitSlop={8}>
              <Icons.back size={17} color="rgba(255,255,255,0.8)" />
            </Pressable>
          )}
          <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#1B1916" />
            ) : (
              <Text style={[styles.saveBtnText, { fontFamily: fonts.sans }]}>שמור</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Image + drawing canvas */}
      <View style={styles.canvas}>
        <View ref={canvasRef} style={styles.imageWrap} collapsable={false}>
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            ) : (
              <View style={styles.photoPlaceholder} />
            )}

            {/* SVG drawing layer — pointerEvents none so touches pass to parent */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width="100%" height="100%">
                {shapes.map(renderShape)}
                {renderActive(activeShape, colorRef.current ?? '#C2613B', toolRef.current)}
              </Svg>
            </View>
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
              onPress={() => handleSelectColor(i)}
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
              onPress={() => handleSelectTool(i)}
              style={[
                styles.toolBtn,
                selectedTool === i && styles.toolBtnActive,
                tool.ai && styles.toolBtnAi,
                selectedTool === i && tool.ai && styles.toolBtnAiActive,
              ]}
            >
              <tool.Icon size={20} color={selectedTool === i && !tool.ai ? '#1B1916' : '#fff'} />
              <Text style={[
                styles.toolLabel,
                { color: selectedTool === i && !tool.ai ? '#1B1916' : '#fff', fontFamily: fonts.sans },
              ]}>
                {tool.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0D0B' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  undoBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  saveBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 999, backgroundColor: '#fff',
    minWidth: 60, alignItems: 'center',
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
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, backgroundColor: '#1A1917' },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
    width: 32, height: 32, borderRadius: 16,
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
    width: 56, height: 48, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  toolBtnActive: { backgroundColor: '#fff' },
  toolBtnAi: { backgroundColor: 'rgba(90,135,112,0.5)' },
  toolBtnAiActive: { backgroundColor: '#5A8770' },
  toolLabel: { fontSize: 9, fontWeight: '600' },
});
