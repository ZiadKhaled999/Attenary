import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, StatusBar, Image } from 'react-native';
import { useSupabase } from '../context/SupabaseContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import * as ImagePicker from 'expo-image-picker';

const UserIcon = ({ size = 24 }: { size?: number }) => {
  const { profile } = useSupabase();
  const avatarUrl = profile?.avatar_url;
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} resizeMode="cover" />;
  }
  return <Text style={{ fontSize: size }}>👤</Text>;
};

const EditIcon = ({ size = 16, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9M13.5 6.5l-7 7-3 3 3.5-3 6.5-6.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ProfileScreen = () => {
  const { profile, updateProfile, uploadAvatar } = useSupabase();
  const { t } = useLanguage();
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [jobTitleModalVisible, setJobTitleModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [employeeName, setEmployeeNameInput] = useState(profile?.full_name || '');
  const [jobTitle, setJobTitleInput] = useState(profile?.job_title || '');
  const [department, setDepartmentInput] = useState(profile?.department || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmployeeNameInput(profile?.full_name || '');
    setJobTitleInput(profile?.job_title || '');
    setDepartmentInput(profile?.department || '');
  }, [profile]);

  const saveField = async (field: 'full_name' | 'job_title' | 'department', value: string) => {
    setSaving(true);
    const { error } = await updateProfile({ [field]: value });
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
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
    setSaving(true);
    const { url, error } = await uploadAvatar(asset.uri);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to upload avatar. It will sync when you are back online.');
    }
  };

  const displayName = profile?.full_name || t('profile.tapToSetYourName') || 'Set your name';
  const displayEmail = profile?.email || t('profile.defaultEmail') || 'Email';
  const displayJobTitle = profile?.job_title || t('profile.jobTitlePlaceholder') || 'Job title';
  const displayDepartment = profile?.department || t('profile.departmentPlaceholder') || 'Department';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.85}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow} />
              <View style={styles.avatar}>
                <UserIcon size={80} />
              </View>
              <View style={styles.editBadge}>
                <EditIcon size={14} color={colors.textPrimary} />
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

          <TouchableOpacity style={styles.profileRow} onPress={() => setNameModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={styles.profileIconContainer}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.fullName')}</Text>
                <Text style={styles.profileValue}>{displayName}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.primary} /></View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.profileRow}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, styles.profileIconContainerSecondary]}>
                <Text style={{ fontSize: 20 }}>✉️</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.emailAddress')}</Text>
                <Text style={styles.profileValue}>{displayEmail}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.profileRow} onPress={() => setJobTitleModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, styles.profileIconContainerTertiary]}>
                <Text style={{ fontSize: 20 }}>💼</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.jobTitle')}</Text>
                <Text style={styles.profileValue}>{displayJobTitle}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.primary} /></View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.profileRow} onPress={() => setDepartmentModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.profileRowLeft}>
              <View style={[styles.profileIconContainer, styles.profileIconContainerQuaternary]}>
                <Text style={{ fontSize: 20 }}>🏢</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>{t('profile.department')}</Text>
                <Text style={styles.profileValue}>{displayDepartment}</Text>
              </View>
            </View>
            <View style={styles.profileRowRight}><EditIcon size={16} color={colors.primary} /></View>
          </TouchableOpacity>
        </View>

        {nameModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t('profile.updateYourName')}</Text>
              <Text style={styles.modalSubtitle}>{t('profile.enterFullName')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('profile.enterFullName')}
                placeholderTextColor={colors.textMuted}
                value={employeeName}
                onChangeText={setEmployeeNameInput}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setNameModalVisible(false)} activeOpacity={0.7}>
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={async () => { await saveField('full_name', employeeName); setNameModalVisible(false); }} activeOpacity={0.7} disabled={saving}>
                  <Text style={styles.modalConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {jobTitleModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t('profile.updateYourJobTitle')}</Text>
              <Text style={styles.modalSubtitle}>{t('profile.enterJobTitle')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('profile.enterJobTitle')}
                placeholderTextColor={colors.textMuted}
                value={jobTitle}
                onChangeText={setJobTitleInput}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setJobTitleModalVisible(false)} activeOpacity={0.7}>
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={async () => { await saveField('job_title', jobTitle); setJobTitleModalVisible(false); }} activeOpacity={0.7} disabled={saving}>
                  <Text style={styles.modalConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {departmentModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t('profile.updateYourDepartment')}</Text>
              <Text style={styles.modalSubtitle}>{t('profile.enterDepartment')}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t('profile.enterDepartment')}
                placeholderTextColor={colors.textMuted}
                value={department}
                onChangeText={setDepartmentInput}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setDepartmentModalVisible(false)} activeOpacity={0.7}>
                  <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={async () => { await saveField('department', department); setDepartmentModalVisible(false); }} activeOpacity={0.7} disabled={saving}>
                  <Text style={styles.modalConfirmText}>{saving ? 'Saving...' : t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollView: { flex: 1 },
  contentContainer: { padding: spacing.xl, paddingTop: spacing.huge, paddingBottom: 120 },
  headerSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatarContainer: { position: 'relative', marginBottom: spacing.xl },
  avatarGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 100, backgroundColor: colors.primaryGlow, opacity: 0.3 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgCard, borderWidth: 2, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadows.neonGlowSubtle },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fonts.sizes.hero, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1, marginBottom: spacing.xs },
  subtitle: { fontSize: fonts.sizes.md, color: colors.textSecondary },
  card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  cardTitle: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.textPrimary },
  cardBadge: { backgroundColor: 'rgba(0, 255, 136, 0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  cardBadgeText: { fontSize: fonts.sizes.xs, color: colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  profileRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  profileIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0, 255, 136, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  profileIconContainerSecondary: { backgroundColor: 'rgba(0, 229, 255, 0.1)' },
  profileIconContainerTertiary: { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  profileIconContainerQuaternary: { backgroundColor: 'rgba(255, 51, 102, 0.1)' },
  profileInfo: { flex: 1 },
  profileLabel: { fontSize: fonts.sizes.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  profileValue: { fontSize: fonts.sizes.md, color: colors.textPrimary, fontWeight: '500' },
  profileRowRight: { marginLeft: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  modalContent: { backgroundColor: colors.bgCard, borderRadius: borderRadius.xxl, padding: spacing.xxl, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: colors.border, ...shadows.glassElevated },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  modalSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  modalInput: { backgroundColor: colors.bgElevated, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.xl, color: colors.textPrimary, fontSize: fonts.sizes.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancelButton: { flex: 1, backgroundColor: colors.bgElevated, borderRadius: borderRadius.button, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  modalCancelText: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textSecondary },
  modalConfirmButton: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.button, padding: spacing.lg, alignItems: 'center' },
  modalConfirmText: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.bgMain },
});

export default ProfileScreen;
