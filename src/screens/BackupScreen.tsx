import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

const BackIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15.75 19.5 8.25 12l7.5-7.5" stroke={colors.textPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 28 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" stroke={colors.textAccent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RefreshIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = ({ size = 18 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75" stroke={colors.bgMain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BackupScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { appData, createBackup, saveBackup, loading } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [lastBackup, setLastBackup] = useState<{ fileName: string; size: number; timestamp: string } | null>(null);
  const [backupStats, setBackupStats] = useState({ totalSessions: 0, lastBackup: null as string | null });

  useEffect(() => {
    setBackupStats({ totalSessions: appData.sessions?.length ?? 0, lastBackup: null });
  }, [appData.sessions]);

  const handleCreateBackup = async () => {
    if (loading || isCreating) return;
    setIsCreating(true);

    try {
      const backup = await createBackup();
      const result = await saveBackup(backup);

      if (result) {
        const now = new Date().toISOString();
        setLastBackup({ fileName: result.fileName, size: result.size, timestamp: now });
        Alert.alert(
          t('common.success'),
          `${t('backup.backupSuccess', { fileName: result.fileName, size: Math.round(result.size / 1024) })}\n\nSessions recorded: ${backupStats.totalSessions}\nSnapshot time: ${new Date(now).toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\nLocal vault secured.`
        );
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
      const date = new Date(iso);
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  const lastBackupText = lastBackup ? formatTimestamp(lastBackup.timestamp) : t('backup.neverBackedUp');
  const isBackupReady = !!lastBackup;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Security Vault</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroOuterRing}>
            <View style={styles.heroIconContainer}>
              <ShieldIcon size={28} />
            </View>
          </View>
          <Text style={styles.heroTitle}>{t('backup.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('backup.subtitle')}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, isBackupReady && styles.metricCardShimmer]}>
            <Text style={styles.metricLabel}>{t('backup.totalSessions')}</Text>
            <Text style={styles.metricValue}>{backupStats.totalSessions}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('backup.storageNode')}</Text>
            <View style={styles.metricSecondaryRow}>
              <View style={styles.metricDot} />
              <Text style={styles.metricSecondaryValue}>{t('backup.storageNodeValue')}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}>
                <ClockIcon size={16} />
              </View>
              <View style={styles.detailTexts}>
                <Text style={styles.detailTitle}>{t('backup.lastBackup')}</Text>
                <Text style={[styles.detailValue, isBackupReady && styles.detailValueAccent]}>{lastBackupText}</Text>
              </View>
            </View>
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>{t('backup.encryptionType')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <View style={styles.detailIconBox}>
                <RefreshIcon size={16} />
              </View>
              <View style={styles.detailTexts}>
                <Text style={styles.detailTitle}>{t('backup.encryption')}</Text>
                <Text style={styles.detailValueSecondary}>{t('backup.encryptionValue')}</Text>
              </View>
            </View>
            <View style={[styles.detailBadge, styles.detailBadgeAccent]}>
              <Text style={[styles.detailBadgeText, styles.detailBadgeTextAccent]}>OS-Managed</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleCreateBackup} 
          activeOpacity={0.85} 
          disabled={loading || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color={colors.bgMain} />
          ) : (
            <>
              <PlusIcon size={18} />
              <Text style={styles.actionButtonText}>{t('backup.createBackup')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerNote}>{t('backup.footerNote')}</Text>
      </ScrollView>
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
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'linear-gradient(180deg, rgba(30,30,30,0.9) 0%, rgba(22,22,22,0.9) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(168,130,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accentGlow,
  },
  heroTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
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
    backgroundColor: 'rgba(30,30,30,0.7)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricCardShimmer: {
    overflow: 'hidden',
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
    fontSize: fonts.sizes.xxl,
    fontWeight: fonts.weights.extrabold as any,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  metricSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textAccent,
  },
  metricSecondaryValue: {
    fontSize: fonts.sizes.md,
    fontWeight: fonts.weights.bold as any,
    color: colors.textAccent,
  },
  detailsCard: {
    backgroundColor: 'rgba(36,36,36,0.7)',
    borderRadius: 28,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(54,54,54,0.4)',
    marginBottom: spacing.lg,
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
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
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
  detailValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold as any,
    color: colors.textPrimary,
  },
  detailValueAccent: {
    color: colors.textAccent,
    fontWeight: fonts.weights.bold as any,
  },
  detailValueSecondary: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium as any,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: spacing.md,
  },
  detailBadge: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  detailBadgeAccent: {
    backgroundColor: 'rgba(168,130,255,0.1)',
  },
  detailBadgeText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: fonts.weights.bold as any,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailBadgeTextAccent: {
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
  footerNote: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fonts.sizes.sm,
    lineHeight: 20,
    marginTop: spacing.xxl,
    fontWeight: fonts.weights.medium as any,
  },
});

export default BackupScreen;
