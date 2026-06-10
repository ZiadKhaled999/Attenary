import * as React from 'react';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { BackupSchema, RestorePreview } from '../types/backup';

const BackIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 19.5 8.25 12l7.5-7.5" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RestoreIcon = ({ size = 36 }: { size?: number }) => (
  <Image source={require('../../assets/icons/import.png')} style={{ width: size, height: size }} resizeMode="contain" />
);

const WarningIcon = ({ size = 28 }: { size?: number }) => (
  <Image source={require('../../assets/icons/import.png')} style={{ width: size, height: size }} resizeMode="contain" />
);


const PlusIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" stroke={colors.bgMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UploadIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" stroke={colors.bgMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RestoreBackupScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { importBackupFromFile, previewImport, restoreBackup, loading, getStoredBackup } = useApp();
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupSchema | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [selectedFilesize, setSelectedFilesize] = useState<number | null>(null);

  const handleSelectFile = async () => {
    if (loading || isImporting) return;

    setIsImporting(true);

    try {
      let backup = selectedBackup;
      if (!backup) {
        backup = await importBackupFromFile();
        if (!backup) {
          setIsImporting(false);
          return;
        }
        setSelectedBackup(backup);
        setSelectedFilename((backup as any).fileName || 'backup-file.json');
        setSelectedFilesize((backup as any).size || 0);
      } else {
        backup = selectedBackup;
      }

      const previewResult = await previewImport(backup);
      if (!previewResult.valid) {
        setSelectedBackup(null);
        setPreview(null);
        Alert.alert(t('common.error'), previewResult.error || t('backup.restoreFailed'));
      } else {
        setPreview(previewResult);
        setShowPreviewModal(true);
      }
    } catch (_error) {
      console.error('Import error:', _error);
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

      const message = dryRun
        ? t('backup.dryRunComplete', { count: result.totalNewRecords })
        : t('backup.restoreSuccess', { count: result.totalNewRecords });

      Alert.alert(t('common.success'), message);
      setShowPreviewModal(false);
      setSelectedBackup(null);
      setPreview(null);
      navigation.goBack();
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(t('common.error'), t('backup.restoreError'));
    } finally {
      setIsImporting(false);
    }
  }, [selectedBackup, restoreBackup, navigation, t]);

  const handleConfirmRestore = () => {
    if (!preview) return;
    if (preview.totalConflicting > 0) {
      setShowReplaceConfirm(true);
    } else {
      handleRestore('merge', false);
    }
  };

  const fileSizeText = selectedFilesize ? `${(selectedFilesize / 1024).toFixed(2)} KB` : '0.00 KB';

  const ConfirmModal = () => (
    <Modal transparent animationType="fade" visible={showReplaceConfirm} onRequestClose={() => setShowReplaceConfirm(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('backup.conflictWarning')}</Text>
          <Text style={styles.modalMessage}>{t('backup.conflictMessage', { count: preview?.totalConflicting || 0 })}</Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setShowReplaceConfirm(false)}>
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={() => handleRestore('replace', false)}>
              <Text style={styles.modalButtonTextPrimary}>{t('backup.replaceExisting')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const PreviewModal = () => (
    <Modal transparent animationType="slide" visible={showPreviewModal} onRequestClose={() => setShowPreviewModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('restoreBackup.previewTitle')}</Text>
          {preview && (
            <View style={styles.previewContent}>
              <View style={styles.previewRow}><Text style={styles.previewLabel}>{t('backup.newRecords')}</Text><Text style={[styles.previewValue, styles.previewValueNew]}>{preview.totalNewRecords}</Text></View>
              <View style={styles.previewRow}><Text style={styles.previewLabel}>{t('backup.duplicateRecords')}</Text><Text style={[styles.previewValue, styles.previewValueDuplicate]}>{preview.totalDuplicate}</Text></View>
              <View style={styles.previewRow}><Text style={styles.previewLabel}>{t('backup.conflictingRecords')}</Text><Text style={[styles.previewValue, preview.totalConflicting > 0 && styles.previewValueConflict]}>{preview.totalConflicting}</Text></View>
              <Text style={styles.previewSubtitle}>{t('backup.dataTypes')}</Text>
              <View style={styles.dataTypesContainer}>
              {preview.recordCounts.employeeName && <Text style={styles.dataTypeChip}>{t('profile.employeeName')}</Text>}
              {preview.recordCounts.email && <Text style={styles.dataTypeChip}>{t('profile.email')}</Text>}
              {preview.recordCounts.jobTitle && <Text style={styles.dataTypeChip}>{t('profile.jobTitle')}</Text>}
              {preview.recordCounts.department && <Text style={styles.dataTypeChip}>{t('profile.department')}</Text>}
              {preview.recordCounts.hourRate && <Text style={styles.dataTypeChip}>Hour Rate</Text>}
              {preview.recordCounts.onboardingProgress && <Text style={styles.dataTypeChip}>{t('nav.profile')}</Text>}
              {preview.recordCounts.appSettings && <Text style={styles.dataTypeChip}>{t('common.settings')}</Text>}
              </View>
            </View>
          )}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setShowPreviewModal(false)}>
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => handleRestore('merge', true)} disabled={isImporting}>
              <Text style={styles.modalButtonTextSecondary}>{t('backup.dryRun')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleConfirmRestore} disabled={isImporting}>
              <Text style={styles.modalButtonTextPrimary}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const isFileSelected = !!selectedBackup;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Recovery Console</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroOuterRing}>
          <View style={styles.heroIconContainer}>
            <RestoreIcon size={44} />
          </View>
          </View>
          <Text style={styles.heroTitle}>{t('restoreBackup.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('restoreBackup.subtitle')}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, isFileSelected && styles.metricCardActive]}>
            <Text style={styles.metricLabel}>{t('restoreBackup.fileStatus')}</Text>
            <Text style={[styles.metricValue, isFileSelected && styles.metricValueAccent]}>
              {isFileSelected ? t('restoreBackup.readyToImport') : t('restoreBackup.noFile')}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('restoreBackup.targetArchive')}</Text>
            <Text style={[styles.metricValue, isFileSelected && styles.metricValueBright]}>{fileSizeText}</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.detailsCard, isFileSelected && styles.detailsCardActive]}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={[styles.detailIconCircle, isFileSelected && styles.detailIconCircleActive]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z" stroke={isFileSelected ? colors.textAccent : colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View style={styles.detailTexts}>
                <Text style={[styles.detailTitle, isFileSelected && styles.detailTitleAccent]}>
                  {selectedFilename || t('restoreBackup.noFile')}
                </Text>
                <Text style={styles.detailSubtitle}>
                  {isFileSelected ? t('restoreBackup.fileSelectedSubtitle') : t('restoreBackup.selectBackupFile')}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, isFileSelected ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={[styles.statusBadgeText, isFileSelected && styles.statusBadgeTextActive]}>
                {isFileSelected ? t('restoreBackup.staged') : t('common.idle')}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleSelectFile} 
          activeOpacity={0.85} 
          disabled={loading || isImporting}
        >
          {isImporting ? (
            <ActivityIndicator color={colors.bgMain} />
          ) : (
            <>
              {isFileSelected ? <UploadIcon size={18} /> : <PlusIcon size={18} />}
              <Text style={styles.actionButtonText}>
                {isFileSelected ? t('restoreBackup.decompressRestoreState') : t('restoreBackup.browseExportFile')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIcon}>
            <WarningIcon size={20} />
          </View>
          <Text style={styles.warningText}>{t('restoreBackup.warningText')}</Text>
        </View>
      </ScrollView>

      <ConfirmModal />
      <PreviewModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.base10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.15,
  },
  headerPlaceholder: { width: 40 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  heroSection: { alignItems: 'center', marginBottom: spacing.xl },
  heroOuterRing: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIconContainer: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    fontWeight: fonts.weights.medium as any as any,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(36,36,36,0.7)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(54,54,54,0.4)',
  },
  metricCardActive: {
    backgroundColor: 'rgba(168,130,255,0.08)',
    borderColor: 'rgba(168,130,255,0.2)',
  },
  metricLabel: {
    fontSize: fonts.sizes.xxs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  metricValueAccent: {
    color: colors.textAccent,
  },
  metricValueBright: {
    color: colors.textPrimary,
    fontWeight: fonts.weights.bold as any,
  },
  detailsCard: {
    backgroundColor: 'rgba(36,36,36,0.7)',
    borderRadius: 28,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(54,54,54,0.4)',
    marginBottom: spacing.lg,
  },
  detailsCardActive: {
    backgroundColor: 'rgba(168,130,255,0.08)',
    borderColor: 'rgba(168,130,255,0.2)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  detailIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailIconCircleActive: {
    backgroundColor: 'rgba(168,130,255,0.1)',
  },
  detailTexts: {
    flex: 1,
  },
  detailTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.semibold as any as any,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailTitleAccent: {
    color: colors.textAccent,
    fontWeight: fonts.weights.bold as any,
  },
  detailSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    fontWeight: fonts.weights.medium as any,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(168,130,255,0.12)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statusBadgeText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeTextActive: {
    color: colors.textAccent,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.lg,
    ...shadows.accentGlow,
    gap: spacing.sm,
  },
  actionButtonText: {
    color: colors.bgMain,
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.extrabold as any,
    letterSpacing: 0.2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  warningIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    textAlign: 'center',
    color: colors.textWarning,
    fontSize: fonts.sizes.sm,
    lineHeight: 20,
    marginTop: 0,
    fontWeight: fonts.weights.semibold as any,
    opacity: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContainer: { width: '100%', maxWidth: 360, backgroundColor: colors.bgCard, borderRadius: borderRadius.card, padding: spacing.lg },
  modalTitle: { fontSize: fonts.sizes.lg, fontWeight: fonts.weights.bold as any, color: colors.textPrimary, marginBottom: spacing.md, textAlign: 'center' },
  modalMessage: { fontSize: fonts.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  previewContent: { marginBottom: spacing.lg },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewLabel: { fontSize: fonts.sizes.sm, color: colors.textMuted },
  previewValue: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.bold as any, color: colors.textPrimary },
  previewValueNew: { color: colors.success },
  previewValueDuplicate: { color: colors.textMuted },
  previewValueConflict: { color: colors.danger },
  previewSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm, fontWeight: fonts.weights.medium as any },
  dataTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dataTypeChip: { backgroundColor: colors.bgGlassLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, fontSize: fonts.sizes.xs, color: colors.textMuted, marginRight: spacing.xs, marginBottom: spacing.xs },
  modalButtonContainer: { flexDirection: 'row', gap: spacing.sm },
  modalButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  modalButtonPrimary: { backgroundColor: colors.accent },
  modalButtonSecondary: { backgroundColor: colors.bgGlassLight },
  modalButtonTextPrimary: { color: colors.bgMain, fontSize: fonts.sizes.sm, fontWeight: fonts.weights.bold as any },
  modalButtonTextSecondary: { color: colors.textPrimary, fontSize: fonts.sizes.sm, fontWeight: fonts.weights.semibold as any },
});

export default RestoreBackupScreen;
