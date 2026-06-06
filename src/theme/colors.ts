export const colors = {
  // ═══════════════════════════════════════════════════════════════════
  // COLOR TOKEN SYSTEM
  // Home page uses explicit new design tokens; non-home pages keep original aliases
  // ═══════════════════════════════════════════════════════════════════

  // Backward-compatible legacy aliases (preserved for non-home pages)
  primary: '#8b6cef',           // Purple primary (updated for onboarding)
  primaryDark: '#7a5edf',
  primaryLight: '#a691f5',
  primaryGlow: 'rgba(139,108,239,0.32)',
  primarySoft: 'rgba(139,108,239,0.12)',
  secondary: '#00E5FF',
  secondaryGlow: '#00E5FF40',
  danger: '#FF3366',
  dangerGlow: '#FF336640',
  warning: '#FFD700',
  warningGlow: '#FFD70040',
  info: '#00E5FF',
  infoGlow: '#00E5FF40',
  success: '#53dfdd',
  successGlow: '#53dfdd40',

  // Home Page Design Tokens (from HTML template)
  accent: '#8b6cef',
  accentDark: '#7a5edf',
  accentLight: '#a691f5',
  accentGlow: 'rgba(139,108,239,0.15)',
  accentSoft: 'rgba(139,108,239,0.08)',

  colorRed: '#fb464c',
  colorRedGlow: 'rgba(251,70,76,0.15)',
  colorRedBorder: 'rgba(251,70,76,0.3)',
  colorRedText: 'rgba(251,70,76,0.8)',
  colorCyan: '#53dfdd',
  colorCyanGlow: 'rgba(83,223,221,0.15)',
  colorYellow: '#e0de71',
  colorYellowGlow: 'rgba(224,222,113,0.15)',

  base00: '#1e1e1e',
  base05: '#212121',
  base07: '#212121',
  base10: '#242424',
  base20: '#262626',
  base25: '#2a2a2a',
  base30: '#363636',
  base35: '#3f3f3f',
  base40: '#555555',
  base50: '#666666',
  base60: '#999999',
  base70: '#bababa',
  base100: '#dadada',

  bgMain: '#1e1e1e',
  bgSecondary: '#212121',
  bgCard: '#242424',
  bgCardHover: '#2a2a2a',
  bgElevated: '#262626',
  bgGlass: 'rgba(255,255,255,0.03)',
  bgGlassLight: 'rgba(255,255,255,0.05)',
  bgGlassHeavy: 'rgba(255,255,255,0.08)',

  textPrimary: '#dadada',
  textSecondary: '#bababa',
  textMuted: '#666666',
  textAccent: '#8b6cef',
  textFaint: '#555555',
  textSuccess: '#53dfdd',
  textError: '#fb464c',
  textWarning: '#e0de71',
  textOnAccent: '#ffffff',
  white: '#ffffff',
  black: '#000000',

  border: '#2a2a2a',
  borderLight: '#3f3f3f',
  borderAccent: 'rgba(139,108,239,0.4)',
  borderGlow: 'rgba(139,108,239,0.6)',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.35)',

  navbar: {
    topStrip: '#131416',
    background: '#1e1e1e',
    border: '#2a2a2a',
    activeContainer: 'rgba(139,108,239,0.15)',
    activeIcon: '#8b6cef',
    activeIconLight: '#a691f5',
    activeIconDark: '#7a5edf',
    inactiveIcon: '#666666',
    inactiveIconLight: '#737479',
    inactiveIconDark: '#525358',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
  glass: 24,
  button: 16,
  card: 24,
  pill: 28,
  input: 12,
};

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  glassElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  accentGlow: {
    shadowColor: '#8b6cef',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  accentGlowSubtle: {
    shadowColor: '#8b6cef',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cyanGlow: {
    shadowColor: '#53dfdd',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  neonGlow: {
    shadowColor: '#8b6cef',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  neonGlowSubtle: {
    shadowColor: '#8b6cef',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const fonts = {
  sizes: {
    xs: 11,
    xxs: 10,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
    hero: 44,
    massive: 52,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const glassStyles = {
  panel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
  },
  panelMetric: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
  },
  neonBorder: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  subtleGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};

export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

export const gradients = {
  primary: [colors.accent, colors.accentDark],
  glass: [colors.bgGlassLight, colors.bgGlass],
  dark: [colors.bgSecondary, colors.bgMain],
  primaryFade: [colors.primary, colors.primaryGlow],
  glassFade: [colors.bgGlassLight, colors.bgGlass],
  darkFade: [colors.bgSecondary, colors.bgMain],
};
