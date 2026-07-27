// apps/mobile/src/theme/tokens.ts
export const colors = {
  primaryAccent: '#FF1493',
  secondaryAccent: '#FF6F61',
  softHighlight: '#FFF0F5',
  luxuryAccent: '#FFD700',
  backgroundVelvet: '#120914',
  surfaceMatte: '#1E1222',
  surfaceElevation: '#2A1A30',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  borderSubtle: 'rgba(255, 20, 147, 0.20)',
  blurOverlay: 'rgba(18, 9, 20, 0.75)',
  primary: '#FF1493',
  primaryDark: '#B0005B',
  blueSoft: '#FFF0F5',
  green: '#16A34A',
  greenSoft: '#E8F8EF',
  purple: '#8A3FFC',
  chip: '#2A1A30',
  ink: '#FFFFFF',
  bg: '#120914',
  text: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.70)',
  border: 'rgba(255, 20, 147, 0.20)',
  card: '#1E1222',
  surfaceDark: '#120914',
  success: '#16A34A',
  danger: '#EF4444',
};

export const gradients = {
  primaryGradient: ['#FF1493', '#FF6F61'] as const,
  luxuryGradient: ['#FFD700', '#FFA500'] as const,
  backgroundGradient: ['#120914', '#1E1222'] as const,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  button: 16,
  lg: 18,
  xl: 24,
  card: 28,
  pill: 9999,
};

export const typography = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  small: 14,
  tiny: 12,
};
