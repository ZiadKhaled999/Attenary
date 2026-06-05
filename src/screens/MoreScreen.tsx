import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import * as Sharing from 'expo-sharing';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="m8.25 4.5 7.5 7.5-7.5 7.5" stroke={colors.textFaint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Feedbacks Icon (Message/Chat)
const FeedbacksIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Languages Icon (Globe)
const LanguagesIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.5 21a7.5 7.5 0 0 0 7.5-7.5h-7.5V21Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4.5 10.5H12V3a7.5 7.5 0 0 0-7.5 7.5Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.5 13.5V21a7.5 7.5 0 0 1-7.5-7.5h7.5Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Backup Icon (Sync/Refresh)
const BackupIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Restore Icon (Download)
const RestoreIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Coffee Icon
const CoffeeIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9.813 15.904L9 21h6l-.813-5.096M21 12h-3.14m-12.72 0H2M16.5 6a4.5 4.5 0 0 1-9 0m9 0A4.5 4.5 0 0 0 12 1.5 4.5 4.5 0 0 0 7.5 6m9 0v6a4.5 4.5 0 0 1-9 0V6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      const appUrl = 'https://www.attenary.com';
      const message = Platform.select({
        web: 'Check out Attenary, the modern time tracking app!',
        default: 'Attenary - Time Tracking Made Simple',
      });

      if (Platform.OS === 'web') {
        const shareData = { title: 'Attenary', text: message as string, url: appUrl };
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(appUrl);
          Alert.alert(t('common.success'), 'Link copied to clipboard!');
        }
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(appUrl, {
            dialogTitle: t('more.share'),
            mimeType: 'text/plain',
          });
        } else {
          Alert.alert(t('common.success'), 'Sharing not available on this device.');
        }
      }
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const navItems = [
    {
      id: 'feedbacks',
      title: t('more.feedbacks'),
      subtitle: t('more.feedbacksSubtitle'),
      icon: <FeedbacksIcon size={20} />,
      screen: 'Feedbacks',
    },
    {
      id: 'languages',
      title: t('more.languages'),
      subtitle: t('more.languagesSubtitle'),
      icon: <LanguagesIcon size={20} />,
      screen: 'Languages',
    },
    {
      id: 'backup',
      title: t('more.backup'),
      subtitle: t('more.backupSubtitle'),
      icon: <BackupIcon size={20} />,
      screen: 'Backup',
    },
    {
      id: 'restoreBackup',
      title: t('more.restoreBackup'),
      subtitle: t('more.restoreBackupSubtitle'),
      icon: <RestoreIcon size={20} />,
      screen: 'RestoreBackup',
    },
    {
      id: 'coffee',
      title: t('more.coffee'),
      subtitle: t('more.coffeeSubtitle'),
      icon: <CoffeeIcon size={20} />,
      screen: 'BuyMeCoffee',
    },
    {
      id: 'share',
      title: t('more.share'),
      subtitle: t('more.shareSubtitle'),
      icon: <ShareIcon size={20} />,
      onPress: handleShare,
    },
  ];

  const handlePress = (item: any) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.headerLabel}>{t('common.settingsInfo')}</Text>
        </View>

        <View style={styles.glassPanel}>
          {navItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                index !== navItems.length - 1 && styles.navItemBorder,
              ]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.navItemIcon}>
                {item.icon}
              </View>
              <View style={styles.navItemContent}>
                <Text style={styles.navItemTitle}>{item.title}</Text>
                <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRightIcon size={16} />
              </View>
            </TouchableOpacity>
          ))}
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
  container: { 
    flex: 1, 
    backgroundColor: colors.bgMain 
  },
  content: { 
    flex: 1 
  },
  scrollContent: { 
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
    paddingTop: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  headerLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  glassPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  navItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navItemContent: {
    flex: 1,
  },
  navItemTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold as any,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  navItemSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    fontWeight: fonts.weights.normal as any,
  },
  chevronContainer: {
    marginLeft: spacing.sm,
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    gap: 2,
  },
  footerText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold as any,
    color: colors.textPrimary,
  },
  footerSubtext: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: fonts.weights.medium as any,
  },
});

export default MoreScreen;