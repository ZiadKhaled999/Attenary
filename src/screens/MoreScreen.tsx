import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'feedbacks',
      title: t('more.feedbacks'),
      subtitle: 'Send suggestions, bugs and ideas',
      icon: <Text style={{ fontSize: 24 }}>💬</Text>,
      screen: 'Feedbacks',
    },
    {
      id: 'languages',
      title: t('more.languages'),
      subtitle: t('more.languagesSubtitle'),
      icon: <Text style={{ fontSize: 24 }}>🌐</Text>,
      screen: 'Languages',
    },
    {
      id: 'about',
      title: t('more.about'),
      subtitle: t('more.aboutSubtitle'),
      icon: <Text style={{ fontSize: 24 }}>ℹ️</Text>,
      screen: 'About',
    },
    {
      id: 'privacy',
      title: t('more.privacy'),
      subtitle: t('more.privacySubtitle'),
      icon: <Text style={{ fontSize: 24 }}>🔒</Text>,
      screen: 'PrivacyPolicy',
    },
    {
      id: 'coffee',
      title: t('more.coffee'),
      subtitle: t('more.coffeeSubtitle'),
      icon: <Text style={{ fontSize: 24 }}>☕</Text>,
      screen: 'BuyMeCoffee',
    },
  ];

  const handlePress = (item: any) => {
    if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.settings')}</Text>
          <View style={styles.cardContainer}>
            {navItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  index === 0 && styles.navItemFirst,
                  index === navItems.length - 1 && styles.navItemLast,
                ]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.navItemIcon}>{item.icon}</View>
                <View style={styles.navItemContent}>
                  <Text style={styles.navItemTitle}>{item.title}</Text>
                  <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRightIcon size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Attenary</Text>
          <Text style={styles.footerSubtext}>Time Tracking Made Simple</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: spacing.xs },
  cardContainer: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  navItemFirst: { borderTopLeftRadius: borderRadius.card, borderTopRightRadius: borderRadius.card },
  navItemLast: { borderBottomWidth: 0, borderBottomLeftRadius: borderRadius.card, borderBottomRightRadius: borderRadius.card },
  navItemIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.bgGlassLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  navItemContent: { flex: 1 },
  navItemTitle: { fontSize: fonts.sizes.lg, fontWeight: '500', color: colors.textPrimary, marginBottom: 2 },
  navItemSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted },
  footer: { alignItems: 'center', paddingVertical: spacing.xxl },
  footerText: { fontSize: fonts.sizes.md, fontWeight: '500', color: colors.textMuted, marginBottom: spacing.xs },
  footerSubtext: { fontSize: fonts.sizes.sm, color: colors.textMuted },
});

export default MoreScreen;
