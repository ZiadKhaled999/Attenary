import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Home, CalendarDays, FileText, History, BarChart3, User, MoreHorizontal } from 'lucide-react-native';

// ─── Design tokens (mirrors Navbar.html CSS vars) ───────────────────────────
const TOKEN = {
  base00: '#1e1e1e',
  base05: '#212121',
  base20: '#262626',
  base25: '#2a2a2a',
  base30: '#363636',
  base35: '#3f3f3f',
  base40: '#555555',
  base50: '#666666',
  base60: '#999999',
  base70: '#bababa',
  base100: '#dadada',
  accentPrimary: 'hsl(254, 80%, 68%)',   // --interactive-accent
  white: '#ffffff',
  size4_2: 8,
  size4_3: 12,
  size4_4: 16,
  size4_6: 24,
  size4_8: 32,
  size4_12: 48,
};

// ─── Icon map: screen name → Lucide component ────────────────────────────────
const ICONS: Record<string, React.ComponentType<any>> = {
  TimeClock:     Home,
  DailyLog:      CalendarDays,
  MonthlyReport: FileText,
  History:       History,
  Analytics:     BarChart3,
  Profile:       User,
  More:          MoreHorizontal,
};

// ─── Easing equivalent to cubic-bezier(0.25, 1, 0.5, 1) ─────────────────────
// React Native Animated doesn't take raw beziers, so we use spring physics
// that visually match the "fluid slide" feel.
const FLUID_SPRING = {
  useNativeDriver: false,   // layout values can't use native driver
  tension: 120,
  friction: 14,
};

// ─── Jelly keyframes: scaleX(1.15/0.9) → scaleY(0.85/1.05) ─────────────────
function runJelly(scaleX: Animated.Value, scaleY: Animated.Value) {
  Animated.sequence([
    Animated.parallel([
      Animated.timing(scaleX, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 0.85, duration: 120, useNativeDriver: true }),
    ]),
    Animated.parallel([
      Animated.timing(scaleX, { toValue: 0.9,  duration: 120, useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 1.05, duration: 120, useNativeDriver: true }),
    ]),
    Animated.parallel([
      Animated.timing(scaleX, { toValue: 1,    duration: 80,  useNativeDriver: true }),
      Animated.timing(scaleY, { toValue: 1,    duration: 80,  useNativeDriver: true }),
    ]),
  ]).start();
}

// ─── Component ───────────────────────────────────────────────────────────────
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  // Layout slots measured per tab button
  const [tabLayouts, setTabLayouts] = useState<Array<{ x: number; width: number; height: number }>>([]);

  // Animated values for the fluid backing pill
  const pillLeft   = useRef(new Animated.Value(0)).current;
  const pillWidth  = useRef(new Animated.Value(0)).current;
  const pillHeight = useRef(new Animated.Value(TOKEN.size4_12)).current;

  // Jelly morph scale values
  const pillScaleX = useRef(new Animated.Value(1)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;

  // Per-icon animated opacities & translateY
  const iconAnims = useRef(
    state.routes.map(() => ({
      opacity:     new Animated.Value(0.4),
      translateY:  new Animated.Value(0),
    }))
  ).current;

  // Track whether this is first render (no animation, just snap)
  const isFirstRender = useRef(true);

  // ── Move pill to active tab ──────────────────────────────────────────────
  function movePillTo(index: number, animate: boolean) {
    const layout = tabLayouts[index];
    if (!layout) return;

    if (!animate) {
      pillLeft.setValue(layout.x);
      pillWidth.setValue(layout.width);
      pillHeight.setValue(layout.height);
    } else {
      Animated.parallel([
        Animated.spring(pillLeft,   { toValue: layout.x,      ...FLUID_SPRING }),
        Animated.spring(pillWidth,  { toValue: layout.width,  ...FLUID_SPRING }),
        Animated.spring(pillHeight, { toValue: layout.height, ...FLUID_SPRING }),
      ]).start();
      runJelly(pillScaleX, pillScaleY);
    }
  }

  // ── Update icons (active vs inactive) ────────────────────────────────────
  function syncIcons(activeIndex: number, animate: boolean) {
    iconAnims.forEach((anim, i) => {
      const isActive = i === activeIndex;
      const targetOpacity = isActive ? 1 : 0.4;
      const targetY       = isActive ? -1 : 0;

      if (!animate) {
        anim.opacity.setValue(targetOpacity);
        anim.translateY.setValue(targetY);
      } else {
        Animated.parallel([
          Animated.timing(anim.opacity,    { toValue: targetOpacity, duration: 250, useNativeDriver: true }),
          Animated.spring(anim.translateY, { toValue: targetY, tension: 200, friction: 10, useNativeDriver: true }),
        ]).start();
      }
    });
  }

  // ── Re-position pill whenever active tab OR layouts change ───────────────
  useEffect(() => {
    if (tabLayouts.length !== state.routes.length) return;
    const animate = !isFirstRender.current;
    movePillTo(state.index, animate);
    syncIcons(state.index, animate);
    if (isFirstRender.current) isFirstRender.current = false;
  }, [state.index, tabLayouts]);

  // ── Capture individual tab button layout ─────────────────────────────────
  const handleTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width, height } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const next = [...prev];
      next[index] = { x, width, height };
      return next;
    });
  };

  // ── Handle tap ────────────────────────────────────────────────────────────
  const handlePress = (route: typeof state.routes[0], index: number) => {
    if (state.index === index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.outerWrapper}>
      {/* Glassmorphism panel */}
      <View style={styles.glassPanel}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}

        {/* Fluid backing pill */}
        <Animated.View
          style={[
            styles.fluidPill,
            {
              left:   pillLeft,
              width:  pillWidth,
              height: pillHeight,
              transform: [{ scaleX: pillScaleX }, { scaleY: pillScaleY }],
            },
          ]}
          pointerEvents="none"
        />

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isActive = state.index === index;
            const IconComponent = ICONS[route.name] ?? MoreHorizontal;
            const anim = iconAnims[index];

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.8}
                accessibilityLabel={descriptors[route.key]?.options?.tabBarLabel as string ?? route.name}
                onLayout={handleTabLayout(index)}
                onPress={() => handlePress(route, index)}
                style={styles.tabButton}
              >
                <Animated.View
                  style={{
                    opacity:   anim.opacity,
                    transform: [{ translateY: anim.translateY }],
                  }}
                >
                  <IconComponent
                    size={20}
                    strokeWidth={2.2}
                    color={TOKEN.white}
                    style={
                      isActive
                        ? {
                            // drop-shadow equivalent on RN (iOS shadow / Android elevation)
                            shadowColor: TOKEN.white,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                          }
                        : undefined
                    }
                  />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  outerWrapper: {
    // Keeps the bar floating above the screen edge
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },

  glassPanel: {
    // Matches .glass-panel
    width: '100%',
    maxWidth: 480,
    borderRadius: TOKEN.size4_8,           // 32px — border-radius: var(--size-4-8)
    borderWidth: 1,
    borderColor: TOKEN.base30,
    backgroundColor:
      Platform.OS === 'android'
        ? 'rgba(0,0,0,0.82)'               // Android fallback (no BlurView)
        : 'rgba(0,0,0,0.45)',
    padding: TOKEN.size4_2,                // 8px — padding: var(--size-4-2)
    overflow: 'hidden',
    // box-shadow approximation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },

  fluidPill: {
    // Matches .fluid-pill
    position: 'absolute',
    borderRadius: TOKEN.size4_6,           // 24px — border-radius: var(--size-4-6)
    backgroundColor: TOKEN.accentPrimary,
    // inset + drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },

  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },

  tabButton: {
    flex: 1,
    height: TOKEN.size4_12,               // 48px — height: var(--size-4-12)
    borderRadius: TOKEN.size4_6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;
