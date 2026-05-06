import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: number;
}

type IconComponent = (props: IconProps) => React.ReactElement;

// Base icon wrapper
function Icon({
  size = 24,
  color = 'currentColor',
  stroke = 1.8,
  fill = false,
  children,
}: IconProps & { fill?: boolean; children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color : 'none'}
      stroke={fill ? 'none' : color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const Icons = {
  // Navigation
  back: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M15 6l-6 6 6 6" />
    </Icon>
  ),
  forward: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M9 6l6 6-6 6" />
    </Icon>
  ),
  close: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M6 6l12 12M6 18L18 6" />
    </Icon>
  ),
  check: ({ size, color, stroke = 1.8 }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M5 13l4 4L19 7" />
    </Icon>
  ),
  plus: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 5v14M5 12h14" />
    </Icon>
  ),
  more: ({ size, color }: IconProps) => (
    <Svg width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24">
      <Circle cx="5" cy="12" r="1.4" fill={color ?? 'currentColor'} />
      <Circle cx="12" cy="12" r="1.4" fill={color ?? 'currentColor'} />
      <Circle cx="19" cy="12" r="1.4" fill={color ?? 'currentColor'} />
    </Svg>
  ),
  search: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.5-3.5" />
    </Icon>
  ),

  // Dashboard
  home: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  doc: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <Path d="M14 3v6h6M8 13h8M8 17h5" />
    </Icon>
  ),
  quote: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 7h18v10H3z" />
      <Path d="M3 11h18M8 15h2M14 15h3" />
    </Icon>
  ),
  agreement: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5z" />
      <Path d="M9 11h7M9 15h5M9 7h4" />
    </Icon>
  ),
  worklog: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </Icon>
  ),
  customers: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="9" cy="8" r="3.5" />
      <Path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <Circle cx="17" cy="9" r="2.5" />
      <Path d="M15 14.5c2 .3 5 1.5 5 5" />
    </Icon>
  ),

  // Actions
  camera: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Circle cx="12" cy="13" r="3.5" />
    </Icon>
  ),
  mic: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Rect x="9" y="3" width="6" height="12" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Icon>
  ),
  micFill: ({ size, color }: IconProps) => (
    <Icon size={size} color={color} fill>
      <Path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 11a1 1 0 1 0-2 0 5 5 0 1 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21a1 1 0 1 0 2 0v-3.07A7 7 0 0 0 19 11z" />
    </Icon>
  ),
  send: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M21 3L3 11l7 3 3 7z" />
      <Path d="M21 3l-11 11" />
    </Icon>
  ),
  share: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="6" cy="12" r="2.5" />
      <Circle cx="18" cy="6" r="2.5" />
      <Circle cx="18" cy="18" r="2.5" />
      <Path d="M8.2 11l7.6-4M8.2 13l7.6 4" />
    </Icon>
  ),
  download: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
    </Icon>
  ),
  edit: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M4 20h4l10-10-4-4L4 16z" />
      <Path d="M14 6l4 4" />
    </Icon>
  ),
  trash: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </Icon>
  ),
  phone: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </Icon>
  ),
  mail: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Rect x="3" y="5" width="18" height="14" rx="2" />
      <Path d="M3 7l9 6 9-6" />
    </Icon>
  ),
  whatsapp: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M4 20l1.5-4A8 8 0 1 1 9 19.5z" />
      <Path d="M9 10c0 4 3 6 6 6l1.5-1.5-2-1L13 14a4 4 0 0 1-2-2l.5-1.5-1-2z" />
    </Icon>
  ),
  bell: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M6 16h12l-1.5-2V11a4.5 4.5 0 1 0-9 0v3z" />
      <Path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  ),
  user: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8" />
    </Icon>
  ),
  settings: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4.8a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.4a7 7 0 0 0-2 1.2l-2.4-.8-2 3.5 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.5 2 3.5 2.4-.8a7 7 0 0 0 2 1.2L10 21h4l.5-2.4a7 7 0 0 0 2-1.2l2.4.8 2-3.5-2-1.5c.05-.4.1-.8.1-1.2z" />
    </Icon>
  ),
  logout: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H10" />
    </Icon>
  ),

  // Form
  building: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M4 21V5a1 1 0 0 1 1-1h7v17M12 9h7a1 1 0 0 1 1 1v11M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2" />
    </Icon>
  ),
  pin2: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
      <Circle cx="12" cy="9" r="2.5" />
    </Icon>
  ),
  calendar: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  ),
  upload: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </Icon>
  ),
  image: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Rect x="3" y="4" width="18" height="16" rx="2" />
      <Circle cx="8.5" cy="9.5" r="1.5" />
      <Path d="M21 16l-5-5-9 9" />
    </Icon>
  ),
  signature: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 17c2-1 3-3 5-3s2 4 4 4 3-9 5-9 2 5 4 5" />
      <Path d="M3 21h18" />
    </Icon>
  ),
  badge: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6z" />
      <Path d="M9 12l2 2 4-4" />
    </Icon>
  ),

  // Problem types
  drop: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 3l5 7a5.5 5.5 0 1 1-10 0z" />
    </Icon>
  ),
  pipe: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 8h6a4 4 0 0 1 4 4v0a4 4 0 0 0 4 4h4M3 12h2M19 12h2M9 4v4M9 16v4" />
    </Icon>
  ),
  roof: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 12L12 4l9 8M5 12v8h14v-8M9 14v6" />
    </Icon>
  ),
  shield: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 3l8 3v6c0 5-4 9-8 10-4-1-8-5-8-10V6z" />
    </Icon>
  ),
  moisture: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M6 14a4 4 0 0 0 8 0c0-3-4-7-4-7s-4 4-4 7zM14 8a3 3 0 0 0 6 0c0-2-3-5-3-5s-3 3-3 5z" />
    </Icon>
  ),

  // Misc
  sparkle: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </Icon>
  ),
  wand: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M5 19l8-8M13 5l1.5 3 3 1.5-3 1.5L13 14l-1.5-3-3-1.5 3-1.5z" />
      <Path d="M19 17l.5 1 1 .5-1 .5L19 20l-.5-1-1-.5 1-.5z" />
    </Icon>
  ),
  arrowR: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  ),
  circle: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="12" cy="12" r="9" />
    </Icon>
  ),
  highlight: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M14 4l6 6-9 9-6 1 1-6z" />
      <Path d="M3 21h18" />
    </Icon>
  ),
  pencil: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M14 4l6 6-10 10H4v-6z" />
    </Icon>
  ),
  swap: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M7 4l-3 3 3 3M4 7h13a3 3 0 0 1 3 3v0M17 20l3-3-3-3M20 17H7a3 3 0 0 1-3-3v0" />
    </Icon>
  ),
  sun: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </Icon>
  ),
  moon: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10z" />
    </Icon>
  ),
  star: ({ size, color }: IconProps) => (
    <Icon size={size} color={color} fill>
      <Path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z" />
    </Icon>
  ),
  history: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <Path d="M3 3v5h5" />
      <Path d="M12 8v4l3 2" />
    </Icon>
  ),
  chevL: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M15 6l-6 6 6 6" />
    </Icon>
  ),
  chevD: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M6 9l6 6 6-6" />
    </Icon>
  ),
  shieldCheck: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M12 3l8 3v6c0 5-4 9-8 10-4-1-8-5-8-10V6z" />
      <Path d="M9 12l2 2 4-4" />
    </Icon>
  ),
  waveform: ({ size, color, stroke }: IconProps) => (
    <Icon size={size} color={color} stroke={stroke}>
      <Path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 12h2" />
    </Icon>
  ),
} satisfies Record<string, IconComponent>;

export type IconName = keyof typeof Icons;
