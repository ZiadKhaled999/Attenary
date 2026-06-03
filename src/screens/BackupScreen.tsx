import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DatabaseIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v19M5 8v10a7 7 0 0 0 14 0V8M3 12h18" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BackupScreen = () => {
  const { t } = useLanguage();
  const { appData, createBackup, saveBackup, loading } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [lastBackup, setLastBackup] = useState<{ fileName: string; size: number; timestamp: string } | null>(null);
  const [backupStats, setBackupStats] = useState({ totalSessions: 0, lastBackup: null as string | null });

  useEffect(() => {
    setBackupStats({ totalSessions: appData.sessions.length, lastBackup: null });
  }, []);

  const handleCreateBackup = async () => {
    if (loading || isCreating) return;
    
    setIsCreating(true);
    try {
      const backup = await createBackup();
      const result = await saveBackup(backup);
      
      if (result) {
        setLastBackup({
          fileName: result.fileName,
          size: result.size,
          timestamp: new Date().toISOString(),
        });
        Alert.alert(t('common.success'), t('backup.backupSuccess', { fileName: result.fileName, size: Math.round(result.size / 1024) }));
      } else {
        Alert.alert(t('common.error'), t('backup.backupFailed'));
      }
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert(t('common.error'), t('backup.backupError'));
    } finally {
      setIsCreating(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatTimestamp = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <DatabaseIcon size={60} />
          </View>
          <Text style={styles.heroTitle}>{t('backup.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('backup.subtitle')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.cardContainer}>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>{t('backup.totalSessions')}</Text>
              <Text style={styles.statsValue}>{backupStats.totalSessions}</Text>
            </View>
            {backupStats.lastBackup && (
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>{t('backup.lastBackup')}</Text>
                <Text style={styles.statsValue}>{formatTimestamp(backupStats.lastBackup)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.backupButton, isCreating && styles.backupButtonDisabled]}
            onPress={handleCreateBackup}
            activeOpacity={0.8}
            disabled={isCreating || loading}
          >
            <View style={styles.backupButtonContent}>
              {isCreating ? (
                <ActivityIndicator color={colors.bgMain} size="small" />
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={colors.bgMain} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
              <Text style={styles.backupButtonText}>{isCreating ? t('backup.creating') : t('backup.createBackup')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {lastBackup && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{t('backup.lastBackupCreated')}</Text>
              <Text style={styles.resultFileName}>{lastBackup.fileName}</Text>
              <Text style={styles.resultDetails}>
                {t('backup.size')}: {formatFileSize(lastBackup.size)} • {t('backup.created')}: {formatTimestamp(lastBackup.timestamp)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>{t('backup.infoText')}</Text>
        </View>
      </ScrollView>
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
  cardContainer: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, ...shadows.card, padding: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  statsLabel: { fontSize: fonts.sizes.md, color: colors.textSecondary },
  statsValue: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textPrimary },
  backupButton: { backgroundColor: colors.primary, borderRadius: borderRadius.card, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  backupButtonDisabled: { opacity: 0.6 },
  backupButtonContent: { alignItems: 'center' },
  backupButtonText: { fontSize: fonts.sizes.lg, fontWeight: '600', color: colors.bgMain, marginTop: spacing.sm },
  resultCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, ...shadows.card, padding: spacing.lg, alignItems: 'center' },
  resultTitle: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm },
  resultFileName: { fontSize: fonts.sizes.lg, fontWeight: '500', color: colors.primary, marginBottom: spacing.xs },
  resultDetails: { fontSize: fonts.sizes.sm, color: colors.textMuted, textAlign: 'center' },
  infoSection: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  infoText: { fontSize: fonts.sizes.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});

export default BackupScreen;