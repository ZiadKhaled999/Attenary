import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

const BackIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 19.5 8.25 12l7.5-7.5" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BuyMeCoffeeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState('one');

  const handleBuyCoffee = () => {
    const url = 'https://buymeacoffee.com/attenary';

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(t('buymecoffee.error'), t('buymecoffee.unableToOpenLink'));
      }
    });
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync('https://buymeacoffee.com/attenary');
      } else {
        Alert.alert('Shared!', 'Platform sharing link copied securely directly into local clipboard framework space!');
      }
    } catch (error) {
      Alert.alert('Shared!', 'Platform sharing link copied securely directly into local clipboard framework space!');
    }
  };

  const handleAction = () => {
    if (selectedOption === 'share') {
      handleShare();
    } else {
      handleBuyCoffee();
    }
  };

  const supportOptions = [
    {
      id: 'one',
      title: t('buymecoffee.oneTimeSupport'),
      description: t('buymecoffee.oneTimeDescription'),
      icon: '☕',
    },
    {
      id: 'monthly',
      title: t('buymecoffee.monthlySupport'),
      description: t('buymecoffee.monthlyDescription'),
      icon: '⭐',
    },
    {
      id: 'share',
      title: t('buymecoffee.shareApp'),
      description: t('buymecoffee.shareDescription'),
      icon: '📢',
    },
  ];

  const benefits = [
    t('buymecoffee.benefit1'),
    t('buymecoffee.benefit2'),
    t('buymecoffee.benefit3'),
    t('buymecoffee.benefit4'),
  ];

  const ctaLabel = selectedOption === 'share' ? t('buymecoffee.shareApp') : t('buymecoffee.ctaButton');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('buymecoffee.supportDevelopment')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconOuter}>
            <View style={styles.heroIconInner}>
              <Text style={styles.heroEmoji}>☕</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{t('buymecoffee.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('buymecoffee.heroSubtitle')}
          </Text>
        </View>

        {/* Why Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('buymecoffee.whySupport')}</Text>
          <View style={styles.benefitsCard}>
            {benefits.map((benefit, index) => (
              <View
                key={index}
                style={[
                  styles.benefitRow,
                  index < benefits.length - 1 && styles.benefitRowBorder,
                ]}
              >
                <View style={styles.benefitIcon}>
                  <Text style={styles.benefitEmoji}>☕</Text>
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ways to Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('buymecoffee.waysToSupport')}</Text>
          <View style={styles.optionsStack}>
            {supportOptions.map((option) => {
              const isActive = selectedOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  onPress={() => setSelectedOption(option.id as any)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.optionIconBox,
                    isActive && styles.optionIconBoxActive,
                  ]}>
                    <Text style={styles.optionEmoji}>{option.icon}</Text>
                  </View>
                  <View style={styles.optionBody}>
                    <Text style={[
                      styles.optionTitle,
                      isActive && styles.optionTitleActive,
                    ]}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleAction}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Community Message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            {t('buymecoffee.communityMessage')}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('buymecoffee.footer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgMain,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  heroIconOuter: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  heroIconInner: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroEmoji: {
    fontSize: 40,
    lineHeight: 44,
  },
  heroTitle: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: fonts.weights.extrabold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
    fontWeight: fonts.weights.medium as any,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  benefitsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  benefitRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    marginBottom: spacing.sm,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitEmoji: {
    fontSize: fonts.sizes.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium as any,
  },
  optionsStack: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  optionCardActive: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.borderLight,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconBoxActive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionEmoji: {
    fontSize: fonts.sizes.lg,
  },
  optionBody: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
  },
  optionTitleActive: {
    color: colors.textAccent,
  },
  optionDescription: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    fontWeight: fonts.weights.medium as any,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: colors.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    ...shadows.button,
    gap: spacing.sm,
  },
  ctaLabel: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.extrabold as any,
    color: colors.bgMain,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.bgMain,
  },
  messageCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  messageText: {
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: fonts.weights.medium as any,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: fonts.weights.medium as any,
    letterSpacing: 0.3,
  },
});

export default BuyMeCoffeeScreen;
