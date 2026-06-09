import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  Image,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useConvexSync } from '../context/ConvexContext';
import { useLanguage } from '../context/LanguageContext';
import { getOrCreateDeviceId } from '../utils/deviceId';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BackIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 19.5 8.25 12l7.5-7.5" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" stroke={colors.bgMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FeedbacksIcon = ({ size = 36 }: { size?: number }) => (
  <Image source={require('../../assets/icons/feedback.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const CheckIcon = ({ size = 16, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const feedbackTypes = [
  { id: 'general', labelKey: 'feedbacks.general', descriptionKey: 'feedbacks.generalDesc' },
  { id: 'bug', labelKey: 'feedbacks.bugReport', descriptionKey: 'feedbacks.bugDesc' },
  { id: 'feature', labelKey: 'feedbacks.featureRequest', descriptionKey: 'feedbacks.featureDesc' },
] as const;

type FeedbackType = typeof feedbackTypes[number]['id'];

const FeedbacksScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { t } = useLanguage();
  const { queueMutation } = useConvexSync();
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const MAX_RETRY_ATTEMPTS = 3;

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setTypeSheetVisible(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setTypeSheetVisible(false));
  };

  const selectType = (type: FeedbackType) => {
    setFeedbackType(type);
    closeSheet();
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert(t('common.error'), t('feedbacks.pleaseEnterFeedback'));
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert(t('common.error'), t('feedbacks.feedbackMinLength').replace('{minLength}', '10'));
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (deviceId) {
        await queueMutation('feedbacks', deviceId, 'upsert', {
          user_id: deviceId,
          type: feedbackType,
          email: null,
          content: feedback.trim(),
          metadata: null,
          created_at: Date.now(),
        });
      }

      setRetryAttempts(0);
      Alert.alert(
        t('feedbacks.thankYou'),
        t('feedbacks.feedbackSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setFeedback('');
              setFeedbackType('general');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (_error) {
      const canRetry = retryAttempts < MAX_RETRY_ATTEMPTS;
      const remainingAttempts = MAX_RETRY_ATTEMPTS - retryAttempts;

      Alert.alert(
        t('feedbacks.connectionError'),
        canRetry
          ? t('feedbacks.connectionErrorRetry').replace('{remaining}', remainingAttempts.toString())
          : t('feedbacks.maxRetryReached'),
        canRetry
          ? [
              { text: t('feedbacks.cancel'), style: 'cancel', onPress: () => setRetryAttempts(0) },
              {
                text: t('feedbacks.retry'),
                onPress: () => {
                  setRetryAttempts(retryAttempts + 1);
                  handleSubmit();
                },
              },
            ]
          : [
              { text: t('common.ok'), onPress: () => setRetryAttempts(0) },
            ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(f => f.id === feedbackType)!;

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
      <BackIcon />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{t('feedbacks.title')}</Text>
    <View style={styles.headerSpacer} />
  </View>

  <KeyboardAvoidingView
    style={styles.content}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Icon Section */}
      <View style={styles.iconSection}>
        <View style={styles.iconContainer}>
          <FeedbacksIcon size={36} />
        </View>
        <Text style={styles.title}>{t('feedbacks.weValueYourFeedback')}</Text>
        <Text style={styles.subtitle}>
          {t('feedbacks.helpUsImprove')}
        </Text>
      </View>

      {/* Feedback Type Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('feedbacks.feedbackType')}</Text>
        <TouchableOpacity
          style={styles.typeSelector}
          onPress={openSheet}
          activeOpacity={0.7}
        >
          <View style={styles.typeSelectorLeft}>
            <View style={styles.typeDot} />
            <Text style={styles.typeSelectorText}>{t(selectedType.labelKey)}</Text>
          </View>
          <Text style={styles.typeSelectorArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Input */}
      <View style={styles.section}>
        <Text style={styles.label}>{t('feedbacks.yourFeedback')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('feedbacks.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.bgMain} size="small" />
            ) : (
              <SendIcon size={18} />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t('feedbacks.submitting') : t('feedbacks.submit')}
            </Text>
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            {t('feedbacks.feedbackInfoText')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Type Selection Bottom Sheet */}
      {typeSheetVisible && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={closeSheet} />
          <Animated.View
            style={[
              styles.sheetContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT * 0.4, 0],
                  }),
                }, {
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                }],
                opacity: slideAnim,
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('feedbacks.selectType')}</Text>
            <View style={styles.sheetOptions}>
              {feedbackTypes.map((type) => {
                const isActive = feedbackType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.sheetOption,
                      isActive && styles.sheetOptionActive,
                    ]}
                    onPress={() => selectType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetOptionLeft}>
                      <View style={[
                        styles.sheetOptionDot,
                        isActive && styles.sheetOptionDotActive,
                      ]} />
                      <View>
                        <Text style={[
                          styles.sheetOptionLabel,
                          isActive && styles.sheetOptionLabelActive,
                        ]}>{t(type.labelKey)}</Text>
                        <Text style={styles.sheetOptionDesc}>{t(type.descriptionKey)}</Text>
                      </View>
                    </View>
                    {isActive && (
                      <View style={styles.sheetCheckMark}>
                        <CheckIcon size={16} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </View>
      )}
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
  iconSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  typeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  typeSelectorText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold as any,
    color: colors.textPrimary,
  },
  typeSelectorArrow: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 150,
    paddingTop: spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    ...shadows.button,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.bgMain,
    marginLeft: spacing.sm,
  },
  infoText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheetContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.glassElevated,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sheetOptions: {
    gap: spacing.sm,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetOptionActive: {
    backgroundColor: colors.bgSecondary,
    borderColor: colors.borderLight,
  },
  sheetOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  sheetOptionDotActive: {
    backgroundColor: colors.primary,
  },
  sheetOptionLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.textSecondary,
  },
  sheetOptionLabelActive: {
    color: colors.textPrimary,
  },
  sheetOptionDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: fonts.weights.medium as any,
    marginTop: 2,
  },
  sheetCheckMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});

export default FeedbacksScreen;
