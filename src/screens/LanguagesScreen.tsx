import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { useLanguage, Language } from '../context/LanguageContext';
import Svg, { Path } from 'react-native-svg';

const BackIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 19.5 8.25 12l7.5-7.5" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 18, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="m4.5 12.75 6 6 9-13.5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RefreshIcon = ({ size = 20, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-.132-8.314-.366m16.628 0c-.552 1.675-2.053 2.924-3.864 3.255m-9.622-3.255A11.952 11.952 0 0 0 12 13.5c1.884 0 3.654-.143 5.314-.416m-10.628 0c.552 1.675 2.053 2.924 3.864 3.255" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EnglishFlag = ({ size = 44 }: { size?: number }) => (
  <Image source={require('../../assets/icons/english.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const ArabicFlag = ({ size = 44 }: { size?: number }) => (
  <Image source={require('../../assets/icons/arabic.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

interface LanguageOption {
  code: Language;
  name: string;
  subtitle: string;
  label: string;
  FlagComponent: React.FC<{ size?: number }>;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    subtitle: 'Left to right (LTR)',
    label: 'EN',
    FlagComponent: EnglishFlag,
  },
  {
    code: 'ar',
    name: 'العربية',
    subtitle: 'Right to left (RTL)',
    label: 'AR',
    FlagComponent: ArabicFlag,
  },
];

const LanguagesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { language: currentLanguage, setLanguage, t } = useLanguage();

  const handleLanguageSelect = async (langCode: Language) => {
    await setLanguage(langCode);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />

      {/* Navigation Header */}
      <View style={styles.navSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <BackIcon size={20} />
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t('languages.title')}</Text>
          <Text style={styles.subtitle}>{t('languages.subtitle')}</Text>
        </View>
      </View>

      {/* Language Selector */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listCard}>
          {languageOptions.map((option) => {
            const isSelected = currentLanguage === option.code;
            return (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.languageRow,
                  isSelected && styles.languageRowActive,
                ]}
                onPress={() => handleLanguageSelect(option.code)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[
                    styles.flagBox,
                    isSelected && styles.flagBoxActive,
                  ]}>
                    <option.FlagComponent size={28} />
                  </View>
                  <View style={styles.languageInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[
                        styles.languageName,
                        isSelected && styles.languageNameActive,
                      ]}>
                        {option.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>{t('languages.current')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.languageSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
                {isSelected && (
                  <CheckIcon size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Callout */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <RefreshIcon size={20} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>
            {currentLanguage === 'ar'
              ? 'سيؤدي تغيير اللغة إلى إعادة تحميل التطبيق لتطبيق التغييرات.'
              : 'Changing language will reload the app to apply the changes.'}
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
  navSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl + spacing.md,
    paddingBottom: spacing.lg,
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
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: fonts.weights.extrabold as any,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
    fontWeight: fonts.weights.medium as any,
    marginTop: spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.huge,
  },
  listCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageRowActive: {
    backgroundColor: colors.bgSecondary,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  flagBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  flagBoxActive: {
    backgroundColor: colors.bgCard,
    borderColor: colors.borderLight,
  },
  languageInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: spacing.sm,
  },
  languageName: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
  },
  languageNameActive: {
    color: colors.primary,
  },
  currentBadge: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  currentBadgeText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: fonts.weights.bold as any,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  languageSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    fontWeight: fonts.weights.medium as any,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium as any,
    lineHeight: 20,
  },
});

export default LanguagesScreen;
