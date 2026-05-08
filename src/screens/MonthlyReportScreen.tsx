import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { formatHoursMinutes, getDateString, getMonthString, formatTimeReversed } from '../utils/timeUtils';
import CircularProgressChart from '../components/CircularProgressChart';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import Svg, { Path, Circle } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 667) * size;

// ═══════════════════════════════════════════════════════════════════
// FUTURISTIC 2026 GLASSMORPHISM ICONS
// ═══════════════════════════════════════════════════════════════════

const CalendarIcon = ({ size = 24 }: { size?: number }) => (
  <Image 
    source={require('../../assets/icons/report.png')} 
    style={{ width: size, height: size }} 
    resizeMode="contain"
  />
);

const ClockIcon = ({ size = 20, color = colors.textSecondary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SessionIcon = ({ size = 20, color = colors.textSecondary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="3" fill={color} />
  </Svg>
);

const MonthlyReportScreen = () => {
  const { appData } = useApp();
  const { t, isRTL, language } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(getMonthString(new Date()));

  const monthlyData = useMemo(() => {
    // Limit to recent 1000 sessions for performance before filtering by month
    const recentSessions = appData.sessions
      .sort((a: any, b: any) => b.checkInTime - a.checkInTime)
      .slice(0, 1000);

    const sessions = recentSessions.filter((s: any) => {
      const sessionMonth = getMonthString(new Date(s.checkInTime));
      return sessionMonth === selectedMonth;
    });

    const days = new Map();
    let totalHours = 0;
    let totalSessions = sessions.length;

    sessions.forEach((session: any) => {
      const day = getDateString(session.checkInTime);
      const duration = session.checkOutTime
        ? Math.floor((session.checkOutTime - session.checkInTime) / 1000)
        : 0;
      
      totalHours += duration;
      
      if (!days.has(day)) {
        days.set(day, {
          date: day,
          sessions: [],
          totalDuration: 0
        });
      }
      
      const dayData = days.get(day);
      dayData.sessions.push({
        ...session,
        duration
      });
      dayData.totalDuration += duration;
    });

    return {
      days: Array.from(days.values()).sort((a, b) => a.date.localeCompare(b.date)),
      totalHours,
      totalSessions
    };
  }, [appData.sessions, selectedMonth]);

  // Calculate circular progress chart data
  const chartData = useMemo(() => {
    const totalHoursInSeconds = monthlyData.totalHours;
    const workingDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const standardWorkingHours = workingDaysInMonth * 8 * 3600; // 8 hours per working day
    
    const actualHours = totalHoursInSeconds / 3600; // Convert to hours
    const targetPercentage = (actualHours / (standardWorkingHours / 3600)) * 100;
    const completedPercentage = Math.min(targetPercentage, 100);
    const remainingPercentage = Math.max(0, 100 - completedPercentage);
    const overtimePercentage = Math.max(0, targetPercentage - 100);

    return [
      {
        label: t('monthlyreport.completed'),
        value: Math.round(completedPercentage),
        color: colors.primary
      },
      {
        label: t('monthlyreport.remaining'),
        value: Math.round(remainingPercentage),
        color: colors.info
      },
      {
        label: t('monthlyreport.overtime'),
        value: Math.round(overtimePercentage),
        color: colors.warning
      }
    ];
  }, [monthlyData.totalHours]);

  const months = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthsList = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, i, 1);
      monthsList.push(getMonthString(date));
    }
    return monthsList;
  }, []);

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
          <View style={[
            styles.headerIconContainer,
            isRTL && styles.headerIconContainerRTL
          ]}>
            <CalendarIcon size={48} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('monthlyreport.title')}</Text>
            <Text style={styles.subtitle}>{t('monthlyreport.subtitle')}</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            MONTH SELECTOR - Glass Pills
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.monthSelector}>
          <Text style={styles.monthLabel}>{t('monthlyreport.selectMonth')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthScroll}
            contentContainerStyle={styles.monthScrollContent}
          >
            {months.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === month && styles.monthButtonActive
                ]}
                onPress={() => setSelectedMonth(month)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === month && styles.monthButtonTextActive
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            SUMMARY CARDS - Glass Cards
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <View style={styles.summaryIconContainer}>
              <ClockIcon size={18} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>{t('monthlyreport.totalHours')}</Text>
            <Text style={[styles.summaryValue, styles.summaryValuePrimary]}>
              {formatHoursMinutes(monthlyData.totalHours)}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, styles.summaryIconContainerInfo]}>
              <SessionIcon size={18} color={colors.info} />
            </View>
            <Text style={styles.summaryLabel}>{t('monthlyreport.sessions')}</Text>
            <Text style={[styles.summaryValue, styles.summaryValueInfo]}>
              {monthlyData.totalSessions}
            </Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconContainer, styles.summaryIconContainerWarning]}>
              <CalendarIcon size={18} />
            </View>
            <Text style={styles.summaryLabel}>{t('monthlyreport.activeDays')}</Text>
            <Text style={[styles.summaryValue, styles.summaryValueWarning]}>
              {monthlyData.days.length}
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
             CIRCULAR PROGRESS CHART
             ═══════════════════════════════════════════════════════════ */}
         <View style={styles.chartSection}>
           <ComponentErrorBoundary>
             <CircularProgressChart
               data={chartData}
               title={t('monthlyreport.progress').replace('{month}', selectedMonth)}
             />
           </ComponentErrorBoundary>
         </View>

        {/* ═══════════════════════════════════════════════════════════
            DAILY BREAKDOWN - Glass Cards
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('monthlyreport.dailyBreakdown')}</Text>
          
          {monthlyData.days.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <CalendarIcon size={40} />
              </View>
              <Text style={styles.emptyStateTitle}>{t('monthlyreport.noSessionsFound').replace('{month}', selectedMonth)}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('monthlyreport.startCheckingIn')}
              </Text>
            </View>
          ) : (
            <View style={styles.daysList}>
              {monthlyData.days.map((day) => (
                <View key={day.date} style={styles.dayCard}>
                  {/* Day Header */}
                  <View style={styles.dayHeader}>
                    <View style={styles.dayHeaderLeft}>
                      <View style={styles.dayStatusDot} />
                      <Text style={styles.dayDate}>
                        {new Date(day.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{t('monthlyreport.sessionsCount').replace('{count}', String(day.sessions.length))}</Text>
                    </View>
                  </View>
                  
                  {/* Day Total */}
                  <View style={styles.dayTotalContainer}>
                    <Text style={styles.dayTotalLabel}>{t('monthlyreport.totalDuration')}</Text>
                    <Text style={styles.dayTotalValue}>{formatHoursMinutes(day.totalDuration)}</Text>
                  </View>
                  
                  {/* Sessions List */}
                  <View style={styles.sessionList}>
                    {day.sessions.map((session: any) => (
                      <View key={session.sessionId} style={styles.sessionItem}>
                        <View style={styles.sessionLeft}>
                          <ClockIcon size={14} color={colors.textMuted} />
                          <Text style={styles.sessionTime}>
                            {formatTimeReversed(new Date(session.checkInTime))}
                          </Text>
                        </View>
                        <Text style={styles.sessionDuration}>
                          {formatHoursMinutes(session.duration)}
                        </Text>
                      </View>
                    ))}
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
    marginBottom: spacing.xxl,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    ...shadows.neonGlowSubtle,
  },
  headerIconContainerRTL: {
    marginRight: 0,
    marginLeft: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: fonts.sizes.hero,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ═══════════════════════════════════════════════════════════════
  // MONTH SELECTOR
  // ═══════════════════════════════════════════════════════════════
  monthSelector: {
    marginBottom: spacing.xl,
  },
  monthLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '500' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthScroll: {
    maxHeight: 60,
  },
  monthScrollContent: {
    gap: spacing.sm,
  },
  monthButton: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
  },
  monthButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.neonGlowSubtle,
  },
  monthButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: '500' as const,
  },
  monthButtonTextActive: {
    color: colors.bgMain,
    fontWeight: '700' as const,
  },

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY CARDS
  // ═══════════════════════════════════════════════════════════════
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.glass,
  },
  summaryCardPrimary: {
    borderColor: colors.borderAccent,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  summaryIconContainerInfo: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  summaryIconContainerWarning: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  summaryLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  summaryValuePrimary: {
    color: colors.primary,
  },
  summaryValueInfo: {
    color: colors.info,
  },
  summaryValueWarning: {
    color: colors.warning,
  },

  // ═══════════════════════════════════════════════════════════════
  // CHART SECTION
  // ═══════════════════════════════════════════════════════════════
  chartSection: {
    marginBottom: spacing.xxl,
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION
  // ═══════════════════════════════════════════════════════════════
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
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
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Days List
  daysList: {
    gap: spacing.md,
  },
  dayCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
    ...shadows.neonGlowSubtle,
  },
  dayDate: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  dayBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dayBadgeText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },

  // Day Total
  dayTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dayTotalLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTotalValue: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700' as const,
    color: colors.primary,
    fontFamily: 'monospace',
  },

  // Session List
  sessionList: {
    gap: spacing.sm,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionTime: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  sessionDuration: {
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '600' as const,
    fontFamily: 'monospace',
  },
});

export default MonthlyReportScreen;
