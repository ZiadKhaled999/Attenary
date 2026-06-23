import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Platform, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fonts, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import * as Sharing from 'expo-sharing';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Text style={{ fontSize: size, color: colors.textFaint, fontWeight: '600' }}>›</Text>
);

const FeedbacksIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/feedback.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const LanguagesIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/Language.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const BackupIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/export.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const RestoreIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/import.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const CoffeeIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/buymeacoffee.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const ShareIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/analytics.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const HourRateIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/report.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const BossExportIcon = ({ size = 20 }: { size?: number }) => (
  <Image source={require('../../assets/icons/export.png')} style={{ width: size, height: size }} resizeMode="contain" />
);


const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      const appUrl = 'https://attenary.pages.dev/';
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
    {
      id: 'hourRate',
      title: t('more.hourRate'),
      subtitle: t('more.hourRateSubtitle'),
      icon: <HourRateIcon size={20} />,
      screen: 'HourRate',
    },
    {
      id: 'bossExport',
      title: t('more.bossExport'),
      subtitle: t('more.bossExportSubtitle'),
      icon: <BossExportIcon size={20} />,
      screen: 'BossExport',
    },
  ];

  const handlePress = (item: any) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  const groups = [
    {
      label: t('more.groupGeneral'),
      items: [navItems[0], navItems[1]],
    },
    {
      label: t('more.groupData'),
      items: [navItems[2], navItems[3]],
    },
    {
      label: t('more.groupReports'),
      items: [navItems[6], navItems[7]],
    },
    {
      label: t('more.groupSupport'),
      items: [navItems[4], navItems[5]],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {groups.map((group, gIdx) => (
          <View key={group.label} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.groupPanel}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.navItem,
                    index !== group.items.length - 1 && styles.navItemBorder,
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
    justifyContent: 'flex-start',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
    paddingTop: spacing.xxxl,
    justifyContent: 'flex-start',
  },
  group: {
    marginBottom: spacing.xxl,
  },
  groupLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold as any,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  groupPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.glass,
    marginHorizontal: spacing.lg,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginHorizontal: spacing.xs,
    marginVertical: 2,
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
    borderColor: colors.borderLight,
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
});

export default MoreScreen;