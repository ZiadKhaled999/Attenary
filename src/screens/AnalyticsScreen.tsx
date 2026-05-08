import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { formatHoursMinutes, getDateString, formatTimeReversed } from '../utils/timeUtils';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size: number) => (width / 375) * size; // 375 is iPhone 6 width
const verticalScale = (size: number) => (height / 667) * size; // 667 is iPhone 6 height

// ═══════════════════════════════════════════════════════════════════
// FUTURISTIC 2026 GLASSMORPHISM ICONS
// ═══════════════════════════════════════════════════════════════════

const ChartIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/analytics.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const ClockIcon = ({ size = 20, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SessionIcon = ({ size = 20, color = colors.textMuted }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="3" fill={color} />
  </Svg>
);

const TrendUpIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 17l5-5 4 4 5-6" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 6h5v5" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={colors.textSecondary} strokeWidth="2" />
    <Path d="M3 10h18M8 2v4M16 2v4" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const Rect = ({ x, y, width, height, rx, stroke, strokeWidth }: any) => (
  <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    <Path
      d={`M${rx},0 h${width - rx * 2} a${rx},${rx} 0 0 1 ${rx},${rx} v${height - rx * 2} a${rx},${rx} 0 0 1 -${rx},${rx} h-${width - rx * 2} a${rx},${rx} 0 0 1 -${rx},-${rx} v-${height - rx * 2} a${rx},${rx} 0 0 1 ${rx},-${rx} z`}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
    />
  </Svg>
);

const AnalyticsScreen = () => {
  const { appData } = useApp();
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Limit sessions for performance - sort by checkInTime descending and take recent 1000
  const recentSessions = useMemo(() =>
    appData.sessions
      .sort((a: any, b: any) => b.checkInTime - a.checkInTime)
      .slice(0, 1000),
    [appData.sessions]
  );

  // Calculate statistics - limit to recent 1000 sessions for performance
  const stats = useMemo(() => {
    const activeSessions = recentSessions.filter((s: any) => s.checkOutTime === null).length;
    const totalSessions = recentSessions.length;
    const completedSessions = totalSessions - activeSessions;

    let totalDuration = 0;
    recentSessions.forEach((session: any) => {
      if (session.checkOutTime) {
        totalDuration += session.checkOutTime - session.checkInTime;
      }
    });

    const avgSessionDuration = completedSessions > 0
      ? totalDuration / completedSessions
      : 0;

    // Calculate streaks
    const daysWithActivity = new Set(
      recentSessions.map((s: any) => getDateString(s.checkInTime))
    );

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      totalDuration: Math.floor(totalDuration / 1000),
      avgSessionDuration: Math.floor(avgSessionDuration / 1000),
      activeDays: daysWithActivity.size,
    };
  }, [recentSessions]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════
            HEADER SECTION
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <ChartIcon size={48} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('analytics.title')}</Text>
            <Text style={styles.subtitle}>{t('analytics.subtitle')}</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            PERIOD SELECTOR - Glass Pills
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {t(`analytics.${period}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══════════════════════════════════════════════════════════
             MAIN STATS - Large Glass Cards
             ═══════════════════════════════════════════════════════════ */}
         <View style={styles.mainStatsContainer}>
           <ComponentErrorBoundary>
             <View style={styles.mainStatCard}>
               <View style={styles.mainStatGlow} />
               <View style={styles.mainStatIconContainer}>
                 <ClockIcon size={24} color={colors.primary} />
               </View>
               <Text style={styles.mainStatLabel}>{t('analytics.totalHours')}</Text>
               <Text style={styles.mainStatValue}>
                 {formatHoursMinutes(stats.totalDuration)}
               </Text>
               <View style={styles.trendIndicator}>
                 <TrendUpIcon size={16} />
                 <Text style={styles.trendText}>{t('analytics.trendText')}</Text>
               </View>
             </View>
           </ComponentErrorBoundary>
         </View>

        {/* ═══════════════════════════════════════════════════════════
            STATS GRID - Glass Cards
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <SessionIcon size={18} color={colors.primary} />
            </View>
            <Text style={styles.statLabel}>{t('analytics.totalSessions')}</Text>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconActive]}>
              <SessionIcon size={18} color={colors.info} />
            </View>
            <Text style={styles.statLabel}>{t('analytics.active')}</Text>
            <Text style={[styles.statValue, styles.statValueInfo]}>{stats.activeSessions}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconSuccess]}>
              <SessionIcon size={18} color={colors.success} />
            </View>
            <Text style={styles.statLabel}>{t('analytics.completed')}</Text>
            <Text style={[styles.statValue, styles.statValueSuccess]}>{stats.completedSessions}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconWarning]}>
              <CalendarIcon size={18} />
            </View>
            <Text style={styles.statLabel}>{t('analytics.activeDays')}</Text>
            <Text style={[styles.statValue, styles.statValueWarning]}>{stats.activeDays}</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            AVERAGE SESSION - Highlight Card
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightCardHeader}>
            <Text style={styles.highlightCardTitle}>{t('analytics.averageSession')}</Text>
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>{t('analytics.insight')}</Text>
            </View>
          </View>
          <Text style={styles.highlightValue}>
            {formatHoursMinutes(stats.avgSessionDuration)}
          </Text>
          <Text style={styles.highlightDescription}>
            {t('analytics.highlightDescription')}
          </Text>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            RECENT ACTIVITY - Glass Panel
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>{t('analytics.recentActivity')}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>{t('analytics.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          
          {recentSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <ChartIcon size={40} />
              </View>
              <Text style={styles.emptyStateTitle}>{t('analytics.noSessionsYet')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('analytics.emptyStateSubtext')}
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentSessions.slice(0, 5).map((session: any, index: number) => (
                <View 
                  key={session.sessionId} 
                  style={[
                    styles.recentItem,
                    index === 0 && styles.recentItemFirst
                  ]}
                >
                  <View style={styles.recentItemLeft}>
                    <View style={[
                      styles.recentItemDot,
                      session.checkOutTime === null && styles.recentItemDotActive
                    ]} />
                    <View style={styles.recentItemInfo}>
                      <Text style={styles.recentItemDate}>
                        {new Date(session.checkInTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.recentItemTime}>
                        {formatTimeReversed(new Date(session.checkInTime))}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.recentItemRight}>
                    <Text style={styles.recentItemDuration}>
                      {session.checkOutTime 
                        ? formatHoursMinutes(Math.floor((session.checkOutTime - session.checkInTime) / 1000))
                        : t('analytics.active')
                      }
                    </Text>
                    <View style={[
                      styles.recentItemStatus,
                      session.checkOutTime === null && styles.recentItemStatusActive
                    ]}>
                      <Text style={[
                        styles.recentItemStatusText,
                        session.checkOutTime === null && styles.recentItemStatusTextActive
                      ]}>
                        {session.checkOutTime === null ? t('analytics.inProgress') : t('analytics.done')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(spacing.xl),
    paddingTop: verticalScale(spacing.huge),
    paddingBottom: verticalScale(120), // Extra padding to ensure content is visible above tab bar
  },

  // ═══════════════════════════════════════════════════════════════
  // HEADER SECTION
  // ═══════════════════════════════════════════════════════════════
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(spacing.xxl),
  },
  headerIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(spacing.lg),
    ...shadows.neonGlowSubtle,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: scale(fonts.sizes.hero),
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: scale(fonts.sizes.md),
    color: colors.textSecondary,
    marginTop: scale(spacing.xs),
  },

  // ═══════════════════════════════════════════════════════════════
  // PERIOD SELECTOR
  // ═══════════════════════════════════════════════════════════════
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.button,
    padding: spacing.xs,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.neonGlowSubtle,
  },
  periodButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: '500' as const,
  },
  periodButtonTextActive: {
    color: colors.bgMain,
    fontWeight: '700' as const,
  },

  // ═══════════════════════════════════════════════════════════════
  // MAIN STATS
  // ═══════════════════════════════════════════════════════════════
  mainStatsContainer: {
    marginBottom: verticalScale(spacing.xl),
  },
  mainStatCard: {
    backgroundColor: colors.bgCard,
    borderRadius: scale(borderRadius.card),
    padding: scale(spacing.xxl),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.neonGlowSubtle,
  },
  mainStatGlow: {
    position: 'absolute',
    top: -100,
    width: scale(300),
    height: verticalScale(200),
    backgroundColor: colors.primaryGlow,
    borderRadius: scale(150),
    opacity: 0.2,
  },
  mainStatIconContainer: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(spacing.lg),
  },
  mainStatLabel: {
    fontSize: scale(fonts.sizes.sm),
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: verticalScale(spacing.sm),
  },
  mainStatValue: {
    fontSize: scale(fonts.sizes.massive),
    fontWeight: '900' as const,
    color: colors.primary,
    fontFamily: 'monospace',
    marginBottom: verticalScale(spacing.md),
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trendText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },

  // ═══════════════════════════════════════════════════════════════
  // STATS GRID
  // ═══════════════════════════════════════════════════════════════
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.glass,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statIconActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  statIconSuccess: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  statIconWarning: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  statValueInfo: {
    color: colors.info,
  },
  statValueSuccess: {
    color: colors.success,
  },
  statValueWarning: {
    color: colors.warning,
  },

  // ═══════════════════════════════════════════════════════════════
  // HIGHLIGHT CARD
  // ═══════════════════════════════════════════════════════════════
  highlightCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  highlightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  highlightCardTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  highlightBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  highlightBadgeText: {
    fontSize: fonts.sizes.xs,
    color: colors.primary,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highlightValue: {
    fontSize: fonts.sizes.display,
    fontWeight: '900' as const,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  highlightDescription: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },

  // ═══════════════════════════════════════════════════════════════
  // RECENT ACTIVITY
  // ═══════════════════════════════════════════════════════════════
  recentSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  recentTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recentList: {
    gap: spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentItemFirst: {
    borderTopWidth: 0,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
    marginRight: spacing.md,
  },
  recentItemDotActive: {
    backgroundColor: colors.primary,
    ...shadows.neonGlowSubtle,
  },
  recentItemInfo: {
    flex: 1,
  },
  recentItemDate: {
    fontSize: fonts.sizes.md,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  recentItemTime: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  recentItemRight: {
    alignItems: 'flex-end',
  },
  recentItemDuration: {
    fontSize: fonts.sizes.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  recentItemStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
  },
  recentItemStatusActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  recentItemStatusText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  recentItemStatusTextActive: {
    color: colors.primary,
  },
});

export default AnalyticsScreen;
