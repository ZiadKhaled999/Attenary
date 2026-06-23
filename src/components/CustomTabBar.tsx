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
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';

// ─── Design tokens ───────────────────────────────────────────────────────────
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
  accentPrimary: 'hsl(254, 80%, 68%)',
  white: '#ffffff',
  size4_2: 8,
  size4_3: 12,
  size4_4: 16,
  size4_6: 24,
  size4_8: 32,
  size4_12: 48,
};

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ComponentType<any>> = {
  TimeClock:     Home,
  DailyLog:      CalendarDays,
  MonthlyReport: FileText,
  History:       History,
  Analytics:     BarChart3,
  Profile:       User,
  More:          MoreHorizontal,
};

// ─── Component ───────────────────────────────────────────────────────────────
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const [tabLayouts, setTabLayouts] = useState<{ x: number; y: number; width: number; height: number }[]>([]);

  // ALL animated values use useNativeDriver: true (transforms + opacity support it)
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillTranslateY = useRef(new Animated.Value(0)).current;
  const pillScaleX = useRef(new Animated.Value(1)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;

  const iconAnims = useRef(
    state.routes.map(() => ({
      opacity:    new Animated.Value(0.4),
      translateY: new Animated.Value(0),
    }))
  ).current;

  const isFirstRender = useRef(true);

  const { visible } = useTabBarVisibility();
  const tabBarOpacity    = useRef(new Animated.Value(1)).current;
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  // ── Visibility animation — useNativeDriver: true ──────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(tabBarOpacity,    { toValue: 1, tension: 120, friction: 14, useNativeDriver: true }),
        Animated.spring(tabBarTranslateY, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tabBarOpacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(tabBarTranslateY, { toValue: 80, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // ── Jelly — useNativeDriver: true (scale is a transform, supported) ────────
  function runJelly(scaleX: Animated.Value, scaleY: Animated.Value) {
    return Animated.sequence([
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
    ]);
  }

  // ── Move pill — useNativeDriver: true ─────────────────────────────────────
  function movePillTo(index: number, animate: boolean) {
    const layout = tabLayouts[index];
    if (!layout) return;

    if (!animate) {
      pillTranslateX.setValue(layout.x);
      pillTranslateY.setValue(layout.y);
      pillScaleX.setValue(1);
      pillScaleY.setValue(1);
    } else {
      Animated.parallel([
        Animated.spring(pillTranslateX, { toValue: layout.x, useNativeDriver: true, tension: 120, friction: 14 }),
        Animated.spring(pillTranslateY, { toValue: layout.y, useNativeDriver: true, tension: 120, friction: 14 }),
      ]).start(() => {
        runJelly(pillScaleX, pillScaleY).start();
      });
    }
  }

  // ── Icon sync — useNativeDriver: true ────────────────────────────────────
  function syncIcons(activeIndex: number, animate: boolean) {
    iconAnims.forEach((anim, i) => {
      const isActive     = i === activeIndex;
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

  // ── Re-position pill when active tab or layouts change ───────────────────
  useEffect(() => {
    if (tabLayouts.length !== state.routes.length) return;
    const animate = !isFirstRender.current;
    movePillTo(state.index, animate);
    syncIcons(state.index, animate);
    if (isFirstRender.current) isFirstRender.current = false;
  }, [state.index, tabLayouts]);

  const handleTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setTabLayouts(prev => {
      const next = [...prev];
      next[index] = { x, y, width, height };
      return next;
    });
  };

  const handlePress = (route: typeof state.routes[0], index: number) => {
    if (state.index === index) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Animated.View
      style={[
        styles.outerWrapper,
        {
          opacity: tabBarOpacity,
          transform: [{ translateY: tabBarTranslateY }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.glassPanel}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}

        <View style={styles.tabRow}>
          {/* Pill — transform only, native driver safe */}
          <Animated.View
            style={[
              styles.fluidPill,
              {
                width:  tabLayouts[state.index]?.width ?? 0,
                height: tabLayouts[state.index]?.height ?? 0,
                transform: [
                  { translateX: pillTranslateX },
                  { translateY: pillTranslateY },
                  { scaleX: pillScaleX },
                  { scaleY: pillScaleY },
                ],
                zIndex: 0,
              },
            ]}
            pointerEvents="none"
          />

          {state.routes.map((route, index) => {
            const isActive      = state.index === index;
            const IconComponent = ICONS[route.name] ?? MoreHorizontal;
            const anim          = iconAnims[index];

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.8}
                accessibilityLabel={descriptors[route.key]?.options?.tabBarLabel as string ?? route.name}
                onLayout={handleTabLayout(index)}
                onPress={() => handlePress(route, index)}
                style={[styles.tabButton, { zIndex: 1 }]}
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
                    color={isActive ? TOKEN.white : TOKEN.base60}
                    style={
                      isActive
                        ? {
                            shadowColor: TOKEN.accentPrimary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.6,
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  glassPanel: {
    width: '100%',
    maxWidth: 480,
    borderRadius: TOKEN.size4_8,
    borderWidth: 1,
    borderColor: TOKEN.base30,
    backgroundColor: '#000000',
    padding: TOKEN.size4_2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  fluidPill: {
    position: 'absolute',
    borderRadius: TOKEN.size4_6,
    backgroundColor: TOKEN.accentPrimary,
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
    height: TOKEN.size4_12,
    borderRadius: TOKEN.size4_6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CustomTabBar;
