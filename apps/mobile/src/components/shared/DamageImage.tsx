import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Ellipse,
  Path,
  Circle,
  Line,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

type DamageKind = 'leak' | 'pipe' | 'roof' | 'moisture';

interface DamageImageProps {
  kind?: DamageKind;
  width?: number | string;
  height?: number;
}

const swatches: Record<DamageKind, { sky: string; wall: string; stain: string; water: string }> = {
  leak: { sky: '#A8B5C2', wall: '#E8DDC4', stain: '#7A8F70', water: '#4A6B7A' },
  pipe: { sky: '#C4B8A8', wall: '#D4C5A8', stain: '#5A4A3A', water: '#3D5466' },
  roof: { sky: '#9DA8B8', wall: '#B8A890', stain: '#4A3A2A', water: '#5A6B7A' },
  moisture: { sky: '#A8B0A0', wall: '#D4CCB8', stain: '#6B7A60', water: '#3D5446' },
};

export function DamageImage({ kind = 'leak', height = 200 }: DamageImageProps) {
  const sw = swatches[kind];

  return (
    <View style={[styles.container, { height, borderRadius: 16, overflow: 'hidden', backgroundColor: sw.wall }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient id={`stain-${kind}`} cx="50%" cy="40%" r="50%">
            <Stop offset="0%" stopColor={sw.stain} stopOpacity="0.55" />
            <Stop offset="60%" stopColor={sw.stain} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={sw.stain} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="200" height="200" fill={sw.wall} />
        {/* Wall grid lines */}
        <Line x1="0" y1="60" x2="200" y2="60" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        <Line x1="60" y1="0" x2="60" y2="200" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        <Line x1="140" y1="0" x2="140" y2="200" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        {/* Stain */}
        <Ellipse cx="100" cy="80" rx="80" ry="60" fill={`url(#stain-${kind})`} />
        <Path
          d="M70 100 Q90 120 110 95 T160 110"
          fill="none"
          stroke={sw.stain}
          strokeOpacity="0.4"
          strokeWidth="3"
        />
        <Circle cx="120" cy="60" r="3" fill={sw.water} />
        <Circle cx="80" cy="90" r="2" fill={sw.water} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
  },
});
