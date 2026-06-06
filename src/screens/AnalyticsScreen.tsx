import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import { formatHoursMinutes, formatTime, getDateString } from '../utils/timeUtils';
import Svg, { Polyline, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 48;

const AnalyticsScreen = () => {
  const { appData } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [showAverageModal, setShowAverageModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [viewMonthYear, setViewMonthYear] = useState(new Date().getFullYear());
  const [viewDayYear, setViewDayYear] = useState(new Date().getFullYear());
  const [viewDayMonth, setViewDayMonth] = useState(new Date().getMonth());

  const recentSessions = useMemo(() =>
    appData.sessions
      .sort((a: any, b: any) => b.checkInTime - a.checkInTime)
      .slice(0, 1000),
    [appData.sessions]
  );

  const getDuration = (session: any) => {
    if (!session.checkOutTime) return 0;
    return session.checkOutTime - session.checkInTime;
  };

  const fmt = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 0) return '00:00';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const fmtFull = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 0) return '00:00:00';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const activeSessions = useMemo(() => recentSessions.filter((s: any) => s.checkOutTime === null).length, [recentSessions]);
  const totalSessions = recentSessions.length;
  const completedSessions = totalSessions - activeSessions;
  const daysWithActivity = useMemo(() => new Set(recentSessions.map((s: any) => getDateString(s.checkInTime))).size, [recentSessions]);

  const totalDuration = useMemo(() => {
    let sum = 0;
    recentSessions.forEach((s: any) => { if (s.checkOutTime) sum += s.checkOutTime - s.checkInTime; });
    return sum;
  }, [recentSessions]);

  const avgSessionDuration = useMemo(() => {
    if (completedSessions === 0) return 0;
    return totalDuration / completedSessions;
  }, [totalDuration, completedSessions]);

  // Timeframe data
  const periodData = useMemo(() => {
    const now = new Date();
    const dayMs = 86400000;

    if (selectedPeriod === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayBarsRaw = dayLabels.map((label, i) => {
        const dayStart = new Date(startOfWeek);
        dayStart.setDate(startOfWeek.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        let sum = 0;
        recentSessions.forEach((s: any) => {
          const t = new Date(s.checkInTime);
          if (t >= dayStart && t <= dayEnd && s.checkOutTime) sum += s.checkOutTime - s.checkInTime;
        });
        return { label, hours: sum };
      });
      const maxWeekDayHrs = Math.max(...dayBarsRaw.map(d => d.hours / 3600000), 0.5);
      const dayBars = dayBarsRaw.map((d, i) => {
        const hrs = Math.round((d.hours / 3600000) * 10) / 10;
        return { label: d.label, rawValue: `${hrs} hrs`, value: d.hours === 0 ? 0 : Math.round((hrs / maxWeekDayHrs) * 100), hours: d.hours };
      });

      const weekHours = dayBars.reduce((a, b) => a + b.hours, 0);
      const weekSessions = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfWeek && new Date(s.checkInTime) <= endOfWeek).length;
      const weekActive = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfWeek && new Date(s.checkInTime) <= endOfWeek && s.checkOutTime === null).length;
      const weekDays = new Set(
        recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfWeek && new Date(s.checkInTime) <= endOfWeek).map((s: any) => getDateString(s.checkInTime))
      ).size;

      const prevWeekStart = new Date(startOfWeek);
      prevWeekStart.setDate(startOfWeek.getDate() - 7);
      prevWeekStart.setHours(0, 0, 0, 0);
      const prevWeekEnd = new Date(startOfWeek);
      prevWeekEnd.setMilliseconds(-1);
      let prevSum = 0;
      recentSessions.forEach((s: any) => {
        const t = new Date(s.checkInTime);
        if (t >= prevWeekStart && t <= prevWeekEnd && s.checkOutTime) prevSum += s.checkOutTime - s.checkInTime;
      });
      const trend = prevSum > 0 ? Math.round(((weekHours - prevSum) / prevSum) * 100) : 0;
      const isPositive = trend >= 0;

      return {
        title: 'Weekly Shift Activity Load',
        hours: fmt(weekHours),
        trend: `${isPositive ? '+' : ''}${trend}%`,
        trendColor: isPositive ? colors.fnGreen : colors.fnRed,
        trendIconUp: isPositive,
        barData: dayBars,
        sessions: String(weekSessions),
        active: String(weekActive),
        completed: String(weekSessions - weekActive),
        activeDays: String(weekDays),
        avgSession: fmt(avgSessionDuration),
      };
    } else if (selectedPeriod === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const weeksInMonth = Math.ceil((endOfMonth.getDate() + startOfMonth.getDay()) / 7);
      const barLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5'];
      const barData: any[] = [];
      for (let i = 0; i < Math.max(weeksInMonth, 4); i++) {
        const wkStart = new Date(startOfMonth);
        wkStart.setDate(startOfMonth.getDate() + i * 7);
        wkStart.setHours(0, 0, 0, 0);
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);
        wkEnd.setHours(23, 59, 59, 999);
        let sum = 0;
        recentSessions.forEach((s: any) => {
          const t = new Date(s.checkInTime);
          if (t >= wkStart && t <= wkEnd && s.checkOutTime) sum += s.checkOutTime - s.checkInTime;
        });
        const hrs = Math.round((sum / 3600000) * 10) / 10;
        barData.push({ label: barLabels[i], rawValue: `${hrs} hrs`, hours: sum, weekHrs: hrs });
      }
      const maxWeekHrs = Math.max(...barData.map(d => d.weekHrs), 0.5);
      const normalizedBarData = barData.map((d, i) => ({
        ...d,
        value: d.weekHrs === 0 ? 0 : Math.round((d.weekHrs / maxWeekHrs) * 100),
      }));

      const monthHours = normalizedBarData.reduce((a, b) => a + b.hours, 0);
      const monthSessions = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfMonth && new Date(s.checkInTime) <= endOfMonth).length;
      const monthActive = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfMonth && new Date(s.checkInTime) <= endOfMonth && s.checkOutTime === null).length;
      const monthDays = new Set(
        recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfMonth && new Date(s.checkInTime) <= endOfMonth).map((s: any) => getDateString(s.checkInTime))
      ).size;
      const prevMonthStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1);
      const prevMonthEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 0, 23, 59, 59, 999);
      let prevSum = 0;
      recentSessions.forEach((s: any) => {
        const t = new Date(s.checkInTime);
        if (t >= prevMonthStart && t <= prevMonthEnd && s.checkOutTime) prevSum += s.checkOutTime - s.checkInTime;
      });
      const trend = prevSum > 0 ? Math.round(((monthHours - prevSum) / prevSum) * 100) : 0;
      const isPositive = trend >= 0;

      return {
        title: 'Monthly Shift Activity Load',
        hours: fmt(monthHours),
        trend: `${isPositive ? '+' : ''}${trend}%`,
        trendColor: isPositive ? colors.fnGreen : colors.fnRed,
        trendIconUp: isPositive,
        barData: normalizedBarData,
        sessions: String(monthSessions),
        active: String(monthActive),
        completed: String(monthSessions - monthActive),
        activeDays: String(monthDays),
        avgSession: fmt(avgSessionDuration),
      };
    } else {
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      const quarters = [
        { label: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 3, 0, 23, 59, 59, 999) },
        { label: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 7, 0, 23, 59, 59, 999) },
        { label: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 10, 0, 23, 59, 59, 999) },
        { label: 'Q4', start: new Date(year, 9, 1), end: new Date(year + 1, 1, 0, 23, 59, 59, 999) },
      ];
      const barDataRaw = quarters.map(({ label, start, end }) => {
        let sum = 0;
        recentSessions.forEach((s: any) => {
          const t = new Date(s.checkInTime);
          if (t >= start && t <= end && s.checkOutTime) sum += s.checkOutTime - s.checkInTime;
        });
        const hrs = Math.round((sum / 3600000) * 10) / 10;
        return { label, rawValue: `${hrs} hrs`, hours: sum, qHrs: hrs };
      });
      const maxQHrs = Math.max(...barDataRaw.map(d => d.qHrs), 0.5);
      const barData = barDataRaw.map((d) => ({
        ...d,
        value: d.qHrs === 0 ? 0 : Math.round((d.qHrs / maxQHrs) * 100),
      }));

      const yearHours = barData.reduce((a, b) => a + b.hours, 0);
      const yearSessions = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfYear && new Date(s.checkInTime) <= endOfYear).length;
      const yearActive = recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfYear && new Date(s.checkInTime) <= endOfYear && s.checkOutTime === null).length;
      const yearDays = new Set(
        recentSessions.filter((s: any) => new Date(s.checkInTime) >= startOfYear && new Date(s.checkInTime) <= endOfYear).map((s: any) => getDateString(s.checkInTime))
      ).size;
      const prevYearStart = new Date(year - 1, 0, 1);
      const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      let prevSum = 0;
      recentSessions.forEach((s: any) => {
        const t = new Date(s.checkInTime);
        if (t >= prevYearStart && t <= prevYearEnd && s.checkOutTime) prevSum += s.checkOutTime - s.checkInTime;
      });
      const trend = prevSum > 0 ? Math.round(((yearHours - prevSum) / prevSum) * 100) : 0;
      const isPositive = trend >= 0;

      return {
        title: 'Annual Shift Activity Load',
        hours: fmt(yearHours),
        trend: `${isPositive ? '+' : ''}${trend}%`,
        trendColor: isPositive ? colors.fnGreen : colors.fnRed,
        trendIconUp: isPositive,
        barData,
        sessions: String(yearSessions),
        active: String(yearActive),
        completed: String(yearSessions - yearActive),
        activeDays: String(yearDays),
        avgSession: fmt(avgSessionDuration),
      };
    }
  }, [selectedPeriod, recentSessions, avgSessionDuration]);

  const maxBarValue = useMemo(() => {
    const max = Math.max(...periodData.barData.map(b => b.value || 1), 1);
    return max;
  }, [periodData]);

  const yearAvg = useMemo(() => {
    const ys = recentSessions.filter((s: any) => new Date(s.checkInTime).getFullYear() === selectedYear);
    if (ys.length === 0) return '00:00:00';
    const sum = ys.reduce((a: number, s: any) => a + getDuration(s), 0);
    return fmtFull(sum / ys.length);
  }, [recentSessions, selectedYear]);

  const monthAvg = useMemo(() => {
    const ms = recentSessions.filter((s: any) => new Date(s.checkInTime).getFullYear() === selectedYear && new Date(s.checkInTime).getMonth() === selectedMonthIndex);
    if (ms.length === 0) return '00:00:00';
    const sum = ms.reduce((a: number, s: any) => a + getDuration(s), 0);
    return fmtFull(sum / ms.length);
  }, [recentSessions, selectedYear, selectedMonthIndex]);

  const dayAvg = useMemo(() => {
    const ds = recentSessions.filter((s: any) => {
      const d = new Date(s.checkInTime);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex && d.getDate() === selectedDay;
    });
    if (ds.length === 0) return '00:00:00';
    const sum = ds.reduce((a: number, s: any) => a + getDuration(s), 0);
    return fmtFull(sum / ds.length);
  }, [recentSessions, selectedYear, selectedMonthIndex, selectedDay]);

  const renderMonthGrid = (containerRef: React.MutableRefObject<any>) => {
    if (!containerRef.current) return;
    containerRef.current.removeAllComponents?.();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthNames.forEach((m, idx) => {
      const isSelected = idx === selectedMonthIndex;
      containerRef.current?.addComponent
        ? containerRef.current.addComponent(
            <TouchableOpacity
              key={idx}
              style={[
                styles.monthGridBtn,
                isSelected ? { backgroundColor: colors.accent, borderColor: colors.accent } : { borderColor: colors.border },
              ]}
              onPress={() => {
                setSelectedMonthIndex(idx);
                containerRef.current?.updateContent('');
              }}
            >
              <Text style={[styles.monthGridText, isSelected && { color: colors.white }]}>{m}</Text>
            </TouchableOpacity>
          )
        : null;
    });
  };

  const monthGridRef = useRef<any>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your performance insights</Text>
        </View>

        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && { backgroundColor: colors.accent, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
              ]}
              onPress={() => { setSelectedPeriod(period); setSelectedBarIndex(null); }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && { color: colors.white, fontWeight: '900' },
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Total Hours</Text>
              <Text style={styles.heroValue}>{periodData.hours}</Text>
            </View>
            <View style={[styles.trendBadge, { backgroundColor: `${periodData.trendColor}15`, borderColor: `${periodData.trendColor}30` }]}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={periodData.trendColor} strokeWidth="2.5">
                {periodData.trendIconUp ? (
                  <><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><Polyline points="17 6 23 6 23 12" /></>
                ) : (
                  <><Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><Polyline points="17 18 23 18 23 12" /></>
                )}
              </Svg>
              <Text style={[styles.trendText, { color: periodData.trendColor }]}>{periodData.trend}</Text>
            </View>
          </View>

          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>{periodData.title}</Text>
              {selectedBarIndex !== null && (
                <View style={styles.chartReading}>
                  <Text style={styles.chartReadingText}>
                    {periodData.barData[selectedBarIndex]?.label}: {periodData.barData[selectedBarIndex]?.rawValue}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chartBarsContainer}>
              {periodData.barData.map((bar, idx) => {
                const pct = parseFloat(bar.value) || 0;
                const barHeight = Math.max(4, (pct / maxBarValue) * CHART_HEIGHT);
                const isSelected = selectedBarIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.barWrapper}
                    onPressIn={() => setSelectedBarIndex(idx)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    />
                    {isSelected && (
                      <View style={[styles.barTooltip, { bottom: barHeight + 4 }]}>
                        <Text style={styles.barTooltipText}>{bar.rawValue}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.chartLabelsContainer}>
              {periodData.barData.map((bar, idx) => (
                <Text key={idx} style={styles.chartLabel}>{bar.label}</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sessions</Text>
            <Text style={styles.metricValue}>{periodData.sessions}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active</Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{periodData.active}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={[styles.metricValue, { color: colors.fnGreen }]}>{periodData.completed}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Days</Text>
            <Text style={[styles.metricValue, { color: colors.fnOrange }]}>{periodData.activeDays}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.averageCard}
          onPress={() => setShowAverageModal(true)}
          activeOpacity={0.95}
        >
          <View style={styles.averageHeader}>
            <View style={styles.averageTitleRow}>
              <Text style={styles.averageTitle}>Average Session</Text>
              <Text style={styles.averageTapHint}>(tap for details)</Text>
            </View>
            <View style={[styles.insightBadge, { backgroundColor: `${colors.accent}15` }]}>
              <Text style={[styles.insightBadgeText, { color: colors.accent }]}>Insight</Text>
            </View>
          </View>
          <Text style={styles.averageValue}>{periodData.avgSession}</Text>
          <View style={styles.averageDivider} />
          <Text style={styles.averageSubtext}>Based on completed sessions</Text>
          <View style={styles.averageChevron}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth="2.5">
            <Polyline points="9 18 15 12 9 6" />
          </Svg>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAverageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAverageModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAverageModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Historical Session Average</Text>
            <Text style={styles.modalSubtitle}>Tap selection chips to load deep calendar controls.</Text>

            <View style={styles.modalBodyWrapper}>
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                <View style={styles.modalBody}>
                  <View style={[styles.modalRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <View>
                      <Text style={styles.modalRowLabel}>Total Worktime (Default)</Text>
                      <Text style={[styles.modalRowHint, { color: colors.accent }]}>Lifetime execution values</Text>
                    </View>
                    <Text style={[styles.modalRowValue, { color: colors.accent }]}>{fmtFull(totalDuration)}</Text>
                  </View>

                  <View style={[styles.modalRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <View>
                      <Text style={styles.modalRowLabel}>Custom Year</Text>
                      <View>
                        <TouchableOpacity
                          style={[styles.modalSelectorBtn, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
                          onPress={() => setShowYearPicker(!showYearPicker)}
                        >
                          <Text style={[styles.modalSelectorText, { color: colors.textSecondary }]}>Year: {selectedYear}</Text>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2.5">
                            <Path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM16 2v4M8 2v4M3 10h18" />
                          </Svg>
                        </TouchableOpacity>
                        {showYearPicker && (
                          <View style={styles.inlinePickerGrid}>
                            {Array.from(new Set(recentSessions.map(s => new Date(s.checkInTime).getFullYear()))).sort((a, b) => b - a).map(y => (
                              <TouchableOpacity
                                key={y}
                                style={[styles.inlinePickerBtn, selectedYear === y && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                                onPress={() => { setSelectedYear(y); setShowYearPicker(false); }}
                              >
                                <Text style={[styles.inlinePickerText, selectedYear === y && { color: colors.white }]}>{y}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.modalRowValue, { color: colors.textPrimary }]}>{yearAvg}</Text>
                  </View>

                  <View style={[styles.modalRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <View>
                      <Text style={styles.modalRowLabel}>Custom Month</Text>
                      <View>
                        <TouchableOpacity
                          style={[styles.modalSelectorBtn, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
                          onPress={() => { setViewMonthYear(selectedYear); setShowMonthPicker(!showMonthPicker); }}
                        >
                          <Text style={[styles.modalSelectorText, { color: colors.textSecondary }]}>
                            Month: {new Date(selectedYear, selectedMonthIndex).toLocaleString('default', { month: 'long' })} {selectedYear}
                          </Text>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2.5">
                            <Path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM16 2v4M8 2v4M3 10h18" />
                          </Svg>
                        </TouchableOpacity>
                        {showMonthPicker && (
                          <View style={styles.inlinePickerGrid}>
                            <View style={styles.pickerYearNav}>
                              <TouchableOpacity onPress={() => setViewMonthYear(y => y - 1)} style={styles.pickerNavBtn}>
                                <Text style={styles.pickerNavText}>‹</Text>
                              </TouchableOpacity>
                              <Text style={styles.pickerYearLabel}>{viewMonthYear}</Text>
                              <TouchableOpacity onPress={() => setViewMonthYear(y => y + 1)} style={styles.pickerNavBtn}>
                                <Text style={styles.pickerNavText}>›</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.inlinePickerGrid}>
                              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => (
                                <TouchableOpacity
                                  key={idx}
                                  style={[styles.inlinePickerBtn, selectedMonthIndex === idx && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                                  onPress={() => { setSelectedMonthIndex(idx); setShowMonthPicker(false); }}
                                >
                                  <Text style={[styles.inlinePickerText, selectedMonthIndex === idx && { color: colors.white }]}>{m}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.modalRowValue, { color: colors.textPrimary }]}>{monthAvg}</Text>
                  </View>

                  <View style={[styles.modalRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <View>
                      <Text style={styles.modalRowLabel}>Custom Day</Text>
                      <View>
                        <TouchableOpacity
                          style={[styles.modalSelectorBtn, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
                          onPress={() => { setViewDayYear(selectedYear); setViewDayMonth(selectedMonthIndex); setShowDayPicker(!showDayPicker); }}
                        >
                          <Text style={[styles.modalSelectorText, { color: colors.textSecondary }]}>
                            Day: {new Date(selectedYear, selectedMonthIndex, selectedDay).toLocaleString('default', { month: 'short' })} {selectedDay}, {selectedYear}
                          </Text>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2.5">
                            <Path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM16 2v4M8 2v4M3 10h18" />
                          </Svg>
                        </TouchableOpacity>
                        {showDayPicker && (() => {
                          const y = viewDayYear;
                          const m = viewDayMonth;
                          const firstDay = new Date(y, m, 1).getDay();
                          const daysInMonth = new Date(y, m + 1, 0).getDate();
                          const prevDays = new Date(y, m, 0).getDate();
                          const days: any[] = [];
                          for (let i = firstDay - 1; i >= 0; i--) days.push({ d: prevDays - i, empty: true });
                          for (let d = 1; d <= daysInMonth; d++) days.push({ d, empty: false });
                          while (days.length % 7 !== 0) days.push({ d: null, empty: true });
                          return (
                            <View style={styles.inlinePickerGrid}>
                              <View style={styles.pickerYearNav}>
                                <TouchableOpacity onPress={() => setViewDayYear(y => y - 1)} style={styles.pickerNavBtn}>
                                  <Text style={styles.pickerNavText}>‹</Text>
                                </TouchableOpacity>
                                <Text style={styles.pickerYearLabel}>{viewDayYear} — {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]}</Text>
                                <TouchableOpacity onPress={() => setViewDayYear(y => y + 1)} style={styles.pickerNavBtn}>
                                  <Text style={styles.pickerNavText}>›</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.dayHeaderRow}>
                                {['S','M','T','W','T','F','S'].map((d, i) => <Text key={i} style={styles.dayHeaderText}>{d}</Text>)}
                              </View>
                              <View style={styles.dayGrid}>
                                {days.map((item, idx) => (
                                  <TouchableOpacity
                                    key={idx}
                                    disabled={item.empty}
                                    style={[
                                      styles.dayCell,
                                      !item.empty && selectedDay === item.d && selectedMonthIndex === m && selectedYear === y && { backgroundColor: colors.accent, borderRadius: 14, borderColor: colors.accent },
                                      !item.empty && { borderColor: colors.border },
                                    ]}
                                    onPress={() => { if (!item.empty) { setSelectedDay(item.d); setShowDayPicker(false); } }}
                                  >
                                    <Text style={[styles.dayCellText, !item.empty && selectedDay === item.d && { color: colors.white }]}>{item.empty ? '' : item.d}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    </View>
                    <Text style={[styles.modalRowValue, { color: colors.textPrimary }]}>{dayAvg}</Text>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]} onPress={() => setShowAverageModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Dismiss Analytics View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: spacing.xl,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.hero,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: `${colors.bgCard}99`,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  periodButtonText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  heroPanel: {
    backgroundColor: `${colors.bgCard}cc`,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 60,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  heroValue: {
    fontSize: fonts.sizes.xxxl,
    fontWeight: '900',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '700',
  },
  chartSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '900',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.85,
  },
  chartReading: {
    backgroundColor: colors.bgMain,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartReadingText: {
    fontSize: fonts.sizes.xxs,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    gap: spacing.sm,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  barTooltip: {
    position: 'absolute',
    backgroundColor: colors.bgMain,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    left: 0,
  },
  barTooltipText: {
    fontSize: fonts.sizes.xxs,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chartLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chartLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fonts.sizes.xxs,
    fontWeight: '700',
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 95,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: spacing.md,
    fontFamily: 'monospace',
  },
  averageCard: {
    backgroundColor: `${colors.bgCard}cc`,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  averageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: spacing.xxl,
  },
  averageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  averageTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '900',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  averageTapHint: {
    fontSize: fonts.sizes.xxs,
    color: colors.accent,
    fontWeight: '500',
    opacity: 0.7,
  },
  insightBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  insightBadgeText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  averageValue: {
    fontSize: fonts.sizes.display,
    fontWeight: '900',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  averageDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  averageSubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  averageChevron: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalContent: {
    width: '100%',
    maxWidth: width - spacing.xxl * 2,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    paddingBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '90%',
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  modalBody: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  modalRow: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalRowLabel: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '900',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  modalRowHint: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
  },
  modalRowValue: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  modalSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  modalSelectorText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '900',
  },
  monthGridBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthGridText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inlinePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  inlinePickerBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePickerText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pickerYearNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  pickerNavBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pickerNavText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textMuted,
  },
  pickerYearLabel: {
    fontSize: fonts.sizes.sm,
    fontWeight: '900',
    color: colors.textSecondary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xs,
  },
  dayHeaderText: {
    fontSize: fonts.sizes.xxs,
    fontWeight: '900',
    color: colors.textMuted,
    textTransform: 'uppercase',
    width: 28,
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
    width: '100%',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalCloseBtn: {
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalCloseText: {
    color: colors.white,
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default AnalyticsScreen;
