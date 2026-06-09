import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image, Animated, Dimensions, Easing } from 'react-native';
import { useApp } from '../context/AppContext';
import { useConvexSync } from '../context/ConvexContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { getOrCreateDeviceId } from '../utils/deviceId';
import * as ImagePicker from 'expo-image-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NameIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/name.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const EmailIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/email.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const JobIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/job.png')} style={{ width: size, height: size }} resizeMode="contain" />
);
const DepartmentIcon = ({ size = 24 }: { size?: number }) => (
  <Image source={require('../../assets/icons/department.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const ProfileAvatar = ({ size = 24, url }: { size?: number; url?: string | null }) => {
  const avatarUrl = url || '';
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />;
  }
  return <Image source={require('../../assets/icons/profile.png')} style={{ width: size, height: size }} resizeMode="contain" />;
};

const EditIcon = ({ size = 16, color = colors.textPrimary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9M13.5 6.5l-7 7-3 3 3.5-3 6.5-6.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ProfileScreen = () => {
  const { appData, saveData } = useApp();
  const { queueMutation } = useConvexSync();
  const { t } = useLanguage();
  const { setVisible } = useTabBarVisibility();
  const [profile, setProfile] = useState<any>(null);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [jobTitleModalVisible, setJobTitleModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [employeeName, setEmployeeNameInput] = useState('');
  const [jobTitle, setJobTitleInput] = useState('');
  const [department, setDepartmentInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    setAvatarUrl(appData.avatarUrl || null);
  }, [appData.avatarUrl]);

  useEffect(() => {
    setProfile((prev: any) => {
      if (prev && (prev.full_name || prev.email || prev.job_title || prev.department || prev.avatar_url)) {
        return prev;
      }
      const source = {
        full_name: appData.employeeName,
        email: appData.email,
        job_title: appData.jobTitle,
        department: appData.department,
        avatar_url: avatarUrl || appData.avatarUrl,
        language: appData.appSettings?.language,
        onboarding_completed: appData.onboardingCompleted,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      const merged = { ...prev, ...source };
      return Object.values(merged).some(v => v) ? merged : prev;
    });
  }, [appData.employeeName, appData.email, appData.jobTitle, appData.department, avatarUrl, appData.avatarUrl]);

  const syncProfileToConvex = async (updates: any) => {
    if (!deviceId) return;
    await queueMutation('profiles', deviceId, 'upsert', {
      user_id: deviceId,
      ...updates,
      updated_at: Date.now(),
    });
  };

  const nameSlideAnim = useRef(new Animated.Value(1)).current;
  const jobSlideAnim = useRef(new Animated.Value(1)).current;
  const deptSlideAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setEmployeeNameInput(profile?.full_name || '');
    setJobTitleInput(profile?.job_title || '');
    setDepartmentInput(profile?.department || '');
  }, [profile]);

  useEffect(() => {
    if (nameModalVisible && nameSlideAnim) {
      nameSlideAnim.setValue(0);
      Animated.timing(nameSlideAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [nameModalVisible, nameSlideAnim]);

  useEffect(() => {
    if (jobTitleModalVisible && jobSlideAnim) {
      jobSlideAnim.setValue(0);
      Animated.timing(jobSlideAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [jobTitleModalVisible, jobSlideAnim]);

  useEffect(() => {
    if (departmentModalVisible && deptSlideAnim) {
      deptSlideAnim.setValue(0);
      Animated.timing(deptSlideAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [departmentModalVisible, deptSlideAnim]);

  const openSheet = (setter: (v: boolean) => void) => () => {
    setVisible(false);
    setter(true);
  };
  const closeSheet = (setter: (v: boolean) => void, anim: Animated.Value) => () => {
    Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setter(false);
      setVisible(true);
    });
  };

  const saveField = async (field: 'full_name' | 'job_title' | 'department', value: string) => {
    setSaving(true);
    const updates = { [field]: value };
    setProfile((prev: any) => ({ ...prev, ...updates, updated_at: Date.now() }));
    if (field === 'full_name') {
      setEmployeeNameInput(value);
    } else if (field === 'job_title') {
      setJobTitleInput(value);
    } else if (field === 'department') {
      setDepartmentInput(value);
    }
    await syncProfileToConvex(updates);
    setSaving(false);
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
    setSaving(true);
    const newUrl = asset.uri;
    setAvatarUrl(newUrl);
    setProfile((prev: any) => ({ ...prev, avatar_url: newUrl, updated_at: Date.now() }));
    await syncProfileToConvex({ avatar_url: newUrl });
    setSaving(false);
  };

  const displayName = profile?.full_name || t('profile.tapToSetYourName') || 'Set your name';
  const displayEmail = profile?.email || t('profile.defaultEmail') || 'Email';
  const displayJobTitle = profile?.job_title || t('profile.jobTitlePlaceholder') || 'Job title';
  const displayDepartment = profile?.department || t('profile.departmentPlaceholder') || 'Department';

  const BottomSheet = ({ visible, animation, onClose, title, subtitle, children }: any) => {
    if (!visible) return null;
    const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT * 0.5, 0] });
    const opacity = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

    return (
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheetContent, { transform: [{ translateY }, { scale }], opacity }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.sheetSubtitle}>{subtitle}</Text>
          <View style={styles.sheetBody}>{children}</View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.85}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ProfileAvatar size={80} url={profile?.avatar_url} />
              </View>
              <View style={styles.editBadge}>
                <EditIcon size={14} color={colors.bgMain} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('profile.personalInformation')}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{t('profile.editable')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.profileRow} onPress={openSheet(setNameModalVisible)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, { backgroundColor: colors.bgSecondary }]}>
                <NameIcon size={20} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.fullName')}</Text>
                <Text style={styles.profileValue}>{displayName}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.textAccent} /></View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.profileRow}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, { backgroundColor: colors.bgSecondary }]}>
                <EmailIcon size={20} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.emailAddress')}</Text>
                <Text style={styles.profileValue}>{displayEmail}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.profileRow} onPress={openSheet(setJobTitleModalVisible)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, { backgroundColor: colors.bgSecondary }]}>
                <JobIcon size={20} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.jobTitle')}</Text>
                <Text style={styles.profileValue}>{displayJobTitle}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.textAccent} /></View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.profileRow} onPress={openSheet(setDepartmentModalVisible)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, { backgroundColor: colors.bgSecondary }]}>
                <DepartmentIcon size={20} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.department')}</Text>
                <Text style={styles.profileValue}>{displayDepartment}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.textAccent} /></View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomSheet
        visible={nameModalVisible}
        animation={nameSlideAnim}
        onClose={closeSheet(setNameModalVisible, nameSlideAnim)}
        title={t('profile.updateYourName')}
        subtitle={t('profile.enterFullName')}
      >
        <TextInput
          style={styles.sheetInput}
          placeholder={t('profile.enterFullName')}
          placeholderTextColor={colors.textMuted}
          value={employeeName}
          onChangeText={setEmployeeNameInput}
        />
        <View style={styles.sheetButtons}>
          <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet(setNameModalVisible, nameSlideAnim)} activeOpacity={0.7}>
            <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetConfirm} onPress={async () => { await saveField('full_name', employeeName); closeSheet(setNameModalVisible, nameSlideAnim)(); }} activeOpacity={0.7} disabled={saving}>
            <Text style={styles.sheetConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={jobTitleModalVisible}
        animation={jobSlideAnim}
        onClose={closeSheet(setJobTitleModalVisible, jobSlideAnim)}
        title={t('profile.updateYourJobTitle')}
        subtitle={t('profile.enterJobTitle')}
      >
        <TextInput
          style={styles.sheetInput}
          placeholder={t('profile.enterJobTitle')}
          placeholderTextColor={colors.textMuted}
          value={jobTitle}
          onChangeText={setJobTitleInput}
        />
        <View style={styles.sheetButtons}>
          <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet(setJobTitleModalVisible, jobSlideAnim)} activeOpacity={0.7}>
            <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetConfirm} onPress={async () => { await saveField('job_title', jobTitle); closeSheet(setJobTitleModalVisible, jobSlideAnim)(); }} activeOpacity={0.7} disabled={saving}>
            <Text style={styles.sheetConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={departmentModalVisible}
        animation={deptSlideAnim}
        onClose={closeSheet(setDepartmentModalVisible, deptSlideAnim)}
        title={t('profile.updateYourDepartment')}
        subtitle={t('profile.enterDepartment')}
      >
        <TextInput
          style={styles.sheetInput}
          placeholder={t('profile.enterDepartment')}
          placeholderTextColor={colors.textMuted}
          value={department}
          onChangeText={setDepartmentInput}
        />
        <View style={styles.sheetButtons}>
          <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet(setDepartmentModalVisible, deptSlideAnim)} activeOpacity={0.7}>
            <Text style={styles.sheetCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetConfirm} onPress={async () => { await saveField('department', department); closeSheet(setDepartmentModalVisible, deptSlideAnim)(); }} activeOpacity={0.7} disabled={saving}>
            <Text style={styles.sheetConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollView: { flex: 1 },
  contentContainer: { padding: spacing.xl, paddingTop: spacing.huge, paddingBottom: 120 },
  headerSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarContainer: { position: 'relative', marginBottom: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadows.card },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1, marginBottom: spacing.xs },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary },
  card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  cardTitle: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.textPrimary },
  cardBadge: { backgroundColor: colors.bgSecondary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.borderLight },
  cardBadgeText: { fontSize: fonts.sizes.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  profileRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: colors.border },
  profileInfo: { flex: 1 },
  profileLabel: { fontSize: fonts.sizes.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  profileValue: { fontSize: fonts.sizes.md, color: colors.textPrimary, fontWeight: '500' },
  profileRowRight: { marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  sheetOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  sheetBackdrop: { flex: 1 },
  sheetContent: { backgroundColor: colors.bgCard, borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xxl, paddingBottom: spacing.xxxl, borderWidth: 1, borderColor: colors.border, ...shadows.glassElevated },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  sheetSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  sheetInput: { backgroundColor: colors.bgElevated, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.xl, color: colors.textPrimary, fontSize: fonts.sizes.md },
  sheetBody: { flexDirection: 'column' },
  sheetButtons: { flexDirection: 'row', gap: spacing.md },
  sheetCancel: { flex: 1, backgroundColor: colors.bgElevated, borderRadius: borderRadius.button, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  sheetCancelText: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textSecondary },
  sheetConfirm: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.button, padding: spacing.lg, alignItems: 'center', ...shadows.button },
  sheetConfirmText: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.bgMain },
});

export default ProfileScreen;
