import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import * as ImagePicker from 'expo-image-picker';

interface OnboardingStep {
  id: string;
  type: 'info' | 'input' | 'language' | 'photo';
  title: string;
  subtitle: string;
  description?: string;
  illustration?: any;
  inputConfig?: {
    placeholder: string;
    keyboardType?: 'default' | 'email-address';
    autoCapitalize?: 'none' | 'words' | 'sentences';
    multiline?: boolean;
    field: 'employeeName' | 'jobTitle' | 'department' | 'email';
  };
}

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));
  const [inputValues, setInputValues] = useState({
    employeeName: '',
    jobTitle: '',
    department: '',
    email: '',
  });
  const [selectedLanguage, setSelectedLanguage] = useState(useLanguage().language);
  const [inputError, setInputError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const navigation: any = useNavigation();
  const { profile, updateProfile, uploadAvatar, loading: supabaseLoading } = useSupabase();
  const { setEmployeeName, setJobTitle, setDepartment, completeOnboarding } = useApp();
  const { setLanguage, t } = useLanguage();

  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigation.replace('Main');
    }
  }, [profile?.onboarding_completed]);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      type: 'info',
      title: 'Welcome to Attenary',
      subtitle: 'Your Smart Attendance System',
      description: "Track your work hours with precision and ease. Let's get you set up in just a few steps.",
      illustration: require('../../assets/on-1.png'),
    },
    {
      id: 'questions',
      type: 'info',
      title: "Let's answer some questions.",
      subtitle: 'We need a few details',
      description: 'This will help us personalize your experience and set up your profile.',
      illustration: require('../../assets/on-2.png'),
    },
    {
      id: 'email',
      type: 'input',
      title: 'Your Email',
      subtitle: 'For backup and sync',
      description: 'Enter your email address to sync your data across devices.',
      illustration: require('../../assets/icons/email.png'),
      inputConfig: {
        placeholder: 'e.g., john@example.com',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        field: 'email',
      },
    },
    {
      id: 'name',
      type: 'input',
      title: "What's Your Name?",
      subtitle: 'Let\'s personalize your experience',
      description: 'Enter your full name so we can address you properly.',
      illustration: require('../../assets/name.png'),
      inputConfig: {
        placeholder: 'Enter your full name',
        keyboardType: 'default',
        autoCapitalize: 'words',
        field: 'employeeName',
      },
    },
    {
      id: 'job',
      type: 'input',
      title: 'Your Job Title',
      subtitle: 'Tell us about your role',
      description: 'This helps us customize your reports and analytics.',
      illustration: require('../../assets/jop.png'),
      inputConfig: {
        placeholder: 'e.g., Software Engineer, Manager',
        keyboardType: 'default',
        autoCapitalize: 'words',
        field: 'jobTitle',
      },
    },
    {
      id: 'department',
      type: 'input',
      title: 'Your Department',
      subtitle: 'Where do you work?',
      description: 'Helps organize team attendance and reports.',
      illustration: require('../../assets/department.png'),
      inputConfig: {
        placeholder: 'e.g., Engineering, Marketing',
        keyboardType: 'default',
        autoCapitalize: 'words',
        field: 'department',
      },
    },
    {
      id: 'photo',
      type: 'photo',
      title: 'Profile Photo',
      subtitle: 'Optional',
      description: 'Add a profile photo to personalize your account.',
      illustration: require('../../assets/icons/profile.png'),
    },
    {
      id: 'language',
      type: 'language',
      title: 'Choose Your Language',
      subtitle: 'Select your preferred language',
      description: 'You can change this anytime in the app settings.',
      illustration: require('../../assets/icons/Language.png'),
    },
    {
      id: 'ready',
      type: 'info',
      title: "You're All Set!",
      subtitle: 'Ready to start tracking',
      description: 'Your profile is complete. Let\'s start tracking your attendance!',
      illustration: require('../../assets/on-3.png'),
    },
  ];

  const currentStep = onboardingSteps[currentIndex];
  const totalSteps = onboardingSteps.length;

  const validateCurrentStep = (): boolean => {
    if (currentStep.type === 'input' && currentStep.inputConfig) {
      const field = currentStep.inputConfig.field;
      const value = inputValues[field];

      if (!value.trim()) {
        setInputError('This field is required');
        return false;
      }
    }

    setInputError('');
    return true;
  };

  const persistField = async (field: 'employeeName' | 'jobTitle' | 'department' | 'email', value: string) => {
    const normalized = value.trim();
    switch (field) {
      case 'employeeName':
        await setEmployeeName(normalized);
        await updateProfile({ full_name: normalized });
        break;
      case 'jobTitle':
        await setJobTitle(normalized);
        await updateProfile({ job_title: normalized });
        break;
      case 'department':
        await setDepartment(normalized);
        await updateProfile({ department: normalized });
        break;
      case 'email':
        await updateProfile({ email: normalized });
        break;
    }
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    const { error } = await uploadAvatar(asset.uri);
    setUploadingAvatar(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to upload avatar.');
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (currentStep.type === 'input' && currentStep.inputConfig) {
      const { field } = currentStep.inputConfig;
      const value = inputValues[field];
      try {
        await persistField(field, value);
      } catch (e) {
        console.log('persistField error (non-critical):', e);
      }
    }

    if (currentStep.type === 'language') {
      void setLanguage(selectedLanguage, true);
    }

    if (currentIndex < totalSteps - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: (nextIndex + 1) / totalSteps,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        ]),
      ]).start();
    } else {
      await completeOnboarding();
      await updateProfile({ onboarding_completed: true });
      navigation.replace('Main');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setInputError('');
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: (prevIndex + 1) / totalSteps,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: false }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        ]),
      ]).start();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [field]: value }));
    if (inputError) {
      setInputError('');
    }
  };

  useEffect(() => {
    progressAnim.setValue((currentIndex + 1) / totalSteps);
  }, []);

  const renderInputField = () => {
    if (currentStep.type !== 'input' || !currentStep.inputConfig) return null;
    const config = currentStep.inputConfig;
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, inputError ? styles.inputError : null]}
          placeholder={config.placeholder}
          placeholderTextColor={colors.textMuted}
          value={inputValues[config.field]}
          onChangeText={(value) => handleInputChange(config.field, value)}
          keyboardType={config.keyboardType || 'default'}
          autoCapitalize={config.autoCapitalize || 'none'}
          autoCorrect={false}
          selectionColor={colors.primary}
        />
        {inputError ? <Text style={styles.errorText}>{inputError}</Text> : null}
      </View>
    );
  };

  const renderLanguageSelection = () => {
    if (currentStep.type !== 'language') return null;
    const languages = [
      { code: 'en' as any, name: 'English', subtitle: 'Left to right (LTR)', flag: require('../../assets/icons/english.png') },
      { code: 'ar' as any, name: 'العربية', subtitle: 'Right to left (RTL)', flag: require('../../assets/icons/arabic.png') },
    ];
    return (
      <View style={styles.languageContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.languageOption, selectedLanguage === lang.code && styles.languageOptionSelected]}
            onPress={() => setSelectedLanguage(lang.code)}
            activeOpacity={0.8}
          >
            <Image source={lang.flag} style={styles.languageFlag} resizeMode="contain" />
            <View style={styles.languageTextContainer}>
              <Text style={[styles.languageName, selectedLanguage === lang.code && styles.languageNameSelected]}>{lang.name}</Text>
              <Text style={styles.languageSubtitle}>{lang.subtitle}</Text>
            </View>
            {selectedLanguage === lang.code && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPhotoStep = () => {
    if (currentStep.type !== 'photo') return null;
    const avatarUrl = profile?.avatar_url;
    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity
          style={styles.avatarPicker}
          onPress={handlePickAvatar}
          activeOpacity={0.8}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarPreview} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Image source={require('../../assets/icons/profile.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to {avatarUrl ? 'change' : 'add'} your profile photo</Text>
        <Text style={styles.photoOptional}>(Optional - you can skip this)</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>
            Step {currentIndex + 1} of {totalSteps}
          </Text>
        </View>
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim }]}>
            {currentStep.illustration && (
              <Image source={currentStep.illustration} style={styles.centeredIllustration} resizeMode="contain" />
            )}
          </Animated.View>
          <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            {currentStep.description && <Text style={styles.description}>{currentStep.description}</Text>}
          </Animated.View>
          {renderInputField()}
          {renderLanguageSelection()}
          {renderPhotoStep()}
          <View style={styles.dotsContainer}>
            {onboardingSteps.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex ? colors.primary : colors.textMuted + '40',
                    transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.buttonsContainer}>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={handlePrevious} activeOpacity={0.7}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }, currentIndex === totalSteps - 1 ? styles.nextButtonFull : null]}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextButtonText}>{currentIndex === totalSteps - 1 ? 'Get Started' : 'Continue'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollContent: { flexGrow: 1, paddingTop: 60, paddingBottom: 40, paddingHorizontal: spacing.xl },
  progressBarContainer: { width: '100%', height: 4, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2, marginBottom: spacing.lg },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  stepCounter: { alignItems: 'center', marginBottom: spacing.lg },
  stepCounterText: { fontSize: fonts.sizes.sm, color: colors.textMuted, fontWeight: fonts.weights.medium as any },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  illustrationContainer: { alignItems: 'center', marginBottom: spacing.xl },
  centeredIllustration: { width: 220, height: 220 },
  textContent: { alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  title: { fontSize: fonts.sizes.hero, fontWeight: fonts.weights.extrabold as any, color: colors.textPrimary, textAlign: 'center', lineHeight: 40, marginBottom: spacing.sm },
  subtitle: { fontSize: fonts.sizes.xl, fontWeight: fonts.weights.semibold as any, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  description: { fontSize: fonts.sizes.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  inputContainer: { width: '100%', marginBottom: spacing.xl },
  input: { width: '100%', height: 56, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, fontSize: fonts.sizes.lg, color: colors.textPrimary, borderWidth: 2, borderColor: colors.border },
  inputError: { borderColor: '#ff4444' },
  errorText: { color: '#ff4444', fontSize: fonts.sizes.sm, marginTop: spacing.sm, marginLeft: spacing.sm },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, width: '100%' },
  backButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  backButtonText: { fontSize: fonts.sizes.md, color: colors.textSecondary, fontWeight: fonts.weights.medium as any },
  nextButton: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  nextButtonFull: { width: '100%' },
  nextButtonText: { fontSize: fonts.sizes.lg, color: colors.bgMain, fontWeight: fonts.weights.bold as any },
  languageContainer: { width: '100%', marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  languageOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.border },
  languageOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  languageFlag: { width: 40, height: 40, marginRight: spacing.md },
  languageTextContainer: { flex: 1 },
  languageName: { fontSize: fonts.sizes.lg, fontWeight: fonts.weights.semibold as any, color: colors.textPrimary },
  languageNameSelected: { color: colors.primary },
  languageSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted, marginTop: 2 },
  checkmarkContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkmark: { color: colors.bgMain, fontSize: fonts.sizes.md, fontWeight: fonts.weights.bold as any },
  photoContainer: { alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  avatarPicker: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.md },
  avatarPlaceholder: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatarPreview: { width: 120, height: 120, borderRadius: 60 },
  photoHint: { fontSize: fonts.sizes.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xs },
  photoOptional: { fontSize: fonts.sizes.xs, color: colors.textMuted, textAlign: 'center' },
});

export default OnboardingScreen;