import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { BackupSchema, RestorePreview } from '../types/backup';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UploadIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RestoreBackupScreen = () => {
  const { t } = useLanguage();
  const { importBackupFromFile, previewImport, restoreBackup, loading } = useApp();
  const navigation = useNavigation();
  const [isImporting, setIsImporting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupSchema | null>(null);

  const handleSelectFile = async () => {
    if (loading || isImporting) return;
    
    setIsImporting(true);
    setValidationError(null);
    
    try {
      const backup = await importBackupFromFile();
      if (!backup) {
        setValidationError('backup.noFileSelected');
        return;
      }
      
      setSelectedBackup(backup);
      const previewResult = await previewImport(backup);
      
      if (!previewResult.valid) {
        setValidationError(previewResult.error || 'backup.invalidBackup');
        setSelectedBackup(null);
      } else {
        setPreview(previewResult);
        setShowPreviewModal(true);
      }
    } catch (error) {
      console.error('Import error:', error);
      setValidationError('backup.importError');
    } finally {
      setIsImporting(false);
    }
  };

  const handleRestore = useCallback(async (mode: 'merge' | 'replace' | 'skip', dryRun = false) => {
    if (!selectedBackup) return;
    
    setIsImporting(true);
    try {
      const result = await restoreBackup(selectedBackup, mode, dryRun);
      
      if (!result.valid) {
        Alert.alert(t('common.error'), result.error || t('backup.restoreFailed'));
        return;
      }
      
      if (result.totalDuplicate > 0 && result.totalNewRecords === 0) {
        Alert.alert(t('common.success'), t('backup.allItemsExist'));
      } else {
        const message = dryRun
          ? t('backup.dryRunComplete', { count: result.totalNewRecords })
          : t('backup.restoreSuccess', { count: result.totalNewRecords });
        Alert.alert(t('common.success'), message);
      }
      
      setShowPreviewModal(false);
      setSelectedBackup(null);
      setPreview(null);
      navigation.goBack?.();
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(t('common.error'), t('backup.restoreError'));
    } finally {
      setIsImporting(false);
    }
  }, [selectedBackup, restoreBackup, navigation, t]);

  const handleDryRun = () => {
    handleRestore('merge', true);
  };

  const handleConfirmRestore = () => {
    if (!preview) return;
    
    if (preview.totalConflicting > 0) {
      setShowReplaceConfirm(true);
    } else {
      handleRestore('merge', false);
    }
  };

  const ConfirmModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={showReplaceConfirm}
      onRequestClose={() => setShowReplaceConfirm(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('backup.conflictWarning')}</Text>
          <Text style={styles.modalMessage}>{t('backup.conflictMessage', { count: preview?.totalConflicting || 0 })}</Text>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowReplaceConfirm(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => handleRestore('replace', false)}
            >
              <Text style={styles.modalButtonTextPrimary}>{t('backup.replaceExisting')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const PreviewModal = () => (
    <Modal
      transparent
      animationType="slide"
      visible={showPreviewModal}
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('restoreBackup.previewTitle')}</Text>
          
          {preview && (
            <View style={styles.previewContent}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('backup.newRecords')}</Text>
                <Text style={[styles.previewValue, styles.previewValueNew]}>{preview.totalNewRecords}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('backup.duplicateRecords')}</Text>
                <Text style={[styles.previewValue, styles.previewValueDuplicate]}>{preview.totalDuplicate}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('backup.conflictingRecords')}</Text>
                <Text style={[styles.previewValue, preview.totalConflicting > 0 && styles.previewValueConflict]}>{preview.totalConflicting}</Text>
              </View>
              
              <Text style={styles.previewSubtitle}>{t('backup.dataTypes')}</Text>
              <View style={styles.dataTypesContainer}>
                {preview.recordCounts.employeeName && <Text style={styles.dataTypeChip}>{t('profile.employeeName')}</Text>}
                {preview.recordCounts.email && <Text style={styles.dataTypeChip}>{t('profile.email')}</Text>}
                {preview.recordCounts.jobTitle && <Text style={styles.dataTypeChip}>{t('profile.jobTitle')}</Text>}
                {preview.recordCounts.department && <Text style={styles.dataTypeChip}>{t('profile.department')}</Text>}
                {preview.recordCounts.onboardingProgress && <Text style={styles.dataTypeChip}>{t('nav.profile')}</Text>}
                {preview.recordCounts.appSettings && <Text style={styles.dataTypeChip}>{t('common.settings')}</Text>}
              </View>
            </View>
          )}
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleDryRun}
              disabled={isImporting}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('backup.dryRun')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleConfirmRestore}
              disabled={isImporting}
            >
              <Text style={styles.modalButtonTextPrimary}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <UploadIcon size={60} />
          </View>
          <Text style={styles.heroTitle}>{t('restoreBackup.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('restoreBackup.subtitle')}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.importButton, (loading || isImporting) && styles.importButtonDisabled]}
            onPress={handleSelectFile}
            activeOpacity={0.8}
            disabled={loading || isImporting}
          >
            <View style={styles.importButtonContent}>
              {isImporting ? (
                <ActivityIndicator color={colors.bgMain} size="small" />
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={colors.bgMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
              <Text style={styles.importButtonText}>
                {isImporting ? t('restoreBackup.importing') : t('restoreBackup.selectFile')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {validationError && (
          <View style={styles.errorSection}>
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>{t('common.error')}</Text>
              <Text style={styles.errorMessage}>{t(validationError)}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>{t('restoreBackup.infoText')}</Text>
        </View>
      </ScrollView>
      
      <ConfirmModal />
      <PreviewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  heroSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  iconContainer: { marginBottom: spacing.lg },
  heroTitle: { fontSize: fonts.sizes.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  heroSubtitle: { fontSize: fonts.sizes.md, color: colors.textMuted, textAlign: 'center' },
  section: { marginBottom: spacing.xxl },
  importButton: { backgroundColor: colors.secondary, borderRadius: borderRadius.card, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  importButtonDisabled: { opacity: 0.6 },
  importButtonContent: { alignItems: 'center' },
  importButtonText: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.bgMain, marginTop: spacing.sm },
  errorSection: { marginBottom: spacing.xxl },
  errorCard: { backgroundColor: colors.danger + '20', borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.danger, padding: spacing.lg, alignItems: 'center' },
  errorTitle: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.danger, marginBottom: spacing.xs },
  errorMessage: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  infoSection: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  infoText: { fontSize: fonts.sizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContainer: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, padding: spacing.xl, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' },
  previewContent: { marginBottom: spacing.lg },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewLabel: { fontSize: fonts.sizes.md, color: colors.textSecondary },
  previewValue: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textPrimary },
  previewValueNew: { color: colors.success },
  previewValueDuplicate: { color: colors.textMuted },
  previewValueConflict: { color: colors.warning },
  previewSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm },
  dataTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dataTypeChip: { backgroundColor: colors.bgGlassLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, fontSize: fonts.sizes.xs, color: colors.textMuted },
  modalButtonContainer: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalButton: { flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  modalButtonPrimary: { backgroundColor: colors.primary },
  modalButtonSecondary: { backgroundColor: colors.bgGlassLight },
  modalButtonTextPrimary: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.bgMain },
  modalButtonTextSecondary: { fontSize: fonts.sizes.sm, fontWeight: '500', color: colors.textPrimary },
  modalMessage: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
});

export default RestoreBackupScreen;