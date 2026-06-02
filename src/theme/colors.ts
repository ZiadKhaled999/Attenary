export const colors = {
  // ═══════════════════════════════════════════════════════════════════
  // FUTURISTIC 2026 GLASSMORPHISM THEME
  // Deep Obsidian Black + Vibrant Neon Green
  // ═══════════════════════════════════════════════════════════════════

  // Primary Neon Green Palette
  primary: '#00FF88',           // Main neon green - vibrant and electric
  primaryDark: '#00CC6A',       // Darker neon green for pressed states
  primaryLight: '#33FF9F',      // Lighter neon green for highlights
  primaryGlow: '#00FF8850',     // Semi-transparent for glow effects
  primarySoft: '#00FF8820',     // Very subtle for backgrounds
  
  // Secondary Accent Colors
  secondary: '#00E5FF',         // Cyan accent for variety
  secondaryGlow: '#00E5FF40',   // Cyan glow
  
  // Obsidian Black Background Palette
  bgMain: '#0A0A0F',            // Deep obsidian black - main background
  bgSecondary: '#12121A',       // Slightly lighter obsidian
  bgCard: '#1A1A24',            // Card background
  bgCardHover: '#222230',       // Card hover state
  bgElevated: '#1E1E2A',        // Elevated surfaces
  bgGlass: '#FFFFFF08',         // Glass effect overlay (very subtle white)
  bgGlassLight: '#FFFFFF12',    // Lighter glass effect
  bgGlassHeavy: '#FFFFFF18',    // Heavier glass effect for modals
  
  // Text Colors - High Contrast
  textPrimary: '#FFFFFF',       // Pure white for primary text
  textSecondary: '#B8B8C8',     // Soft white-gray for secondary
  textMuted: '#6B6B7B',         // Muted gray for subtle text
  textAccent: '#00FF88',        // Neon green for accent text
  textGlow: '#00FF88',          // Glowing text color
  
  // Status Colors - Neon Variants
  success: '#00FF88',           // Neon green success
  successGlow: '#00FF8840',     // Success glow
  danger: '#FF3366',            // Neon red-pink for errors
  dangerGlow: '#FF336640',      // Danger glow
  warning: '#FFD700',           // Neon gold for warnings
  warningGlow: '#FFD70040',     // Warning glow
  info: '#00E5FF',              // Neon cyan for info
  infoGlow: '#00E5FF40',        // Info glow
  
  // Border & Shadow - Glass Effect
  border: '#FFFFFF15',          // Subtle white border for glass
  borderLight: '#FFFFFF25',     // Lighter border
  borderAccent: '#00FF8840',    // Neon green accent border
  borderGlow: '#00FF8860',      // Glowing border
  shadow: 'rgba(0, 0, 0, 0.5)', // Deep shadow
  shadowGlow: '#00FF8830',      // Green glow shadow
  
  // Glass Effect Colors
  glassBorder: '#FFFFFF20',     // Standard glass border
  glassHighlight: '#FFFFFF10',  // Glass highlight
  glassShadow: '#00000060',     // Glass shadow
  
  // Special
  transparent: 'transparent',
  overlay: '#000000AA',         // Modal overlay
  overlayLight: '#00000066',    // Lighter overlay

  // ═══════════════════════════════════════════════════════════════════
  // NAVBAR COLORS (from design specification)
  // ═══════════════════════════════════════════════════════════════════
  navbar: {
    topStrip: '#131416',          // Dark accent strip at top
    background: '#1e1f24',        // Primary navbar background
    border: '#1e1f23',            // Subtle border lines
    activeContainer: '#2c2b3d',   // Active icon container background
    activeIcon: '#9e87fb',        // Active icon accent (violet/purple)
    activeIconLight: '#a392f8',   // Active icon highlight
    activeIconDark: '#9480ef',    // Active icon shadow
    inactiveIcon: '#65666b',      // Main inactive icon color
    inactiveIconLight: '#737479', // Inactive icon highlight
    inactiveIconDark: '#525358',  // Inactive icon shadow
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
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 9999,
  glass: 20,      // Standard glass panel radius
  button: 14,     // Button radius
  card: 20,       // Card radius
};

export const shadows = {
  // Subtle glass shadow
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  // Elevated glass shadow
  glassElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  // Neon glow effect
  neonGlow: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  // Subtle neon glow
  neonGlowSubtle: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  // Button shadow
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const fonts = {
  sizes: {
    xs: 11,
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
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

// ═══════════════════════════════════════════════════════════════════
// GLASSMORPHISM STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════

export const glassStyles = {
  // Standard glass panel
  panel: {
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.glass,
  },
  
  // Elevated glass panel
  panelElevated: {
    backgroundColor: colors.bgGlassLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.glass,
  },
  
  // Glass card
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.card,
  },
  
  // Neon accent border
  neonBorder: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  
  // Subtle glow effect
  subtleGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};

// Animation durations for smooth transitions
export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
};

// Gradient definitions for linear gradients (if needed)
export const gradients = {
  primaryFade: [colors.primary, colors.primaryGlow],
  glassFade: [colors.bgGlassLight, colors.bgGlass],
  darkFade: [colors.bgSecondary, colors.bgMain],
  neonPulse: [colors.primaryLight, colors.primary, colors.primaryDark],
};
