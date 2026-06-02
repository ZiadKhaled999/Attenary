import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

// Navbar colors - Green Dark Theme
const NAVBAR_COLORS = {
  activeContainer: 'rgba(30, 80, 50, 0.6)',   // Dark green pill background
  activeIcon: '#4ade80',        // Bright green text/icon
  inactiveIcon: '#888',         // Inactive grey
  navbarBackground: '#111111',  // Slightly lighter black
  navbarBorder: '#222',         // Border color
  hoverBackground: '#1a1a1a',   // Hover state background
  iconFill: 'rgba(74, 222, 128, 0.2)', // Subtle fill for active icons
};

// Animation duration matching the CSS transition (0.4s = 400ms)
const ANIMATION_DURATION = 400;

// Tab Item Component
interface TabItemProps {
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ icon, isActive, onPress }) => {
  // Track hover state for non-active items
  const [isHovered, setIsHovered] = useState(false);

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (isActive) return NAVBAR_COLORS.activeContainer;
    if (isHovered) return NAVBAR_COLORS.hoverBackground;
    return 'transparent';
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      style={({ pressed }) => [
        styles.tabItemTouchable,
        pressed && styles.tabItemPressed,
      ]}
    >
      <View
        style={[
          styles.tabItem,
          {
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        {icon}
      </View>
    </Pressable>
  );
};

// Icon Components matching the HTML design
const HomeIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const SearchIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const StatsIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" />
  </Svg>
);

const HistoryIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const ProfileIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// Clock Icon for Time Clock
const ClockIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

// Document Icon for Daily Log
const DocumentIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
    <Polyline points="10 9 9 9 8 9" />
  </Svg>
);

// Chart Icon for Monthly Report
const ChartIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

// Analytics Icon
const AnalyticsIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" />
  </Svg>
);

// User Icon for Profile
const UserIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// More Icon
const MoreIcon = ({ color, filled }: { color: string; filled: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill={filled ? NAVBAR_COLORS.iconFill : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="5" r="1.5" />
    <Circle cx="12" cy="12" r="1.5" />
    <Circle cx="12" cy="19" r="1.5" />
  </Svg>
);

// Tab configuration
const getTabs = () => [
  { name: 'TimeClock', icon: HomeIcon },
  { name: 'DailyLog', icon: DocumentIcon },
  { name: 'MonthlyReport', icon: ChartIcon },
  { name: 'History', icon: HistoryIcon },
  { name: 'Analytics', icon: AnalyticsIcon },
  { name: 'Profile', icon: UserIcon },
  { name: 'More', icon: MoreIcon },
];

interface CustomTabBarProps {
  state: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, navigation }) => {
  const tabs = getTabs();
  
  return (
    <View style={styles.navbar}>
      <View style={styles.navbarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { name } = route;
          const tab = tabs.find(t => t.name === name);
          if (!tab) return null;

          const isFocused = state.index === index;
          const IconComponent = tab.icon;
          const color = isFocused ? NAVBAR_COLORS.activeIcon : NAVBAR_COLORS.inactiveIcon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(name);
            }
          };

          return (
            <View key={name} style={[styles.tabWrapper, { flex: 1 }]}>
              <TabItem
                icon={<IconComponent color={color} filled={isFocused} />}
                isActive={isFocused}
                onPress={onPress}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: NAVBAR_COLORS.navbarBackground,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: NAVBAR_COLORS.navbarBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#4ade80',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  navbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemTouchable: {
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
  },
});

export default CustomTabBar;
