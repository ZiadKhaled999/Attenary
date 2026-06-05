import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { formatTime, formatTimeReversed } from '../utils/timeUtils';
import Svg, { Path, Circle } from 'react-native-svg';
import { Session } from '../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const colorsMap = {
  bgMain: '#1e1e1e',
  surfaceCard: '#242424',
  surfaceAlt: '#262626',
  borderMain: '#363636',
  borderSubtle: '#2a2a2a',
  textMain: '#dadada',
  textMuted: '#999999',
  textFaint: '#666666',
  accentPurple: '#a882ff',
  statusRed: '#fb464c',
  statusGreen: '#44cf6e',
  white: '#ffffff',
};

const SearchIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={colorsMap.textMuted} strokeWidth="2.5" />
    <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke={colorsMap.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" stroke={colorsMap.textMuted} strokeWidth="2.5" />
  </Svg>
);

const FilterIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" stroke={colorsMap.accentPurple} strokeWidth="2.2" />
  </Svg>
);

type FilterState = {
  year: string | null;
  month: string | null;
  status: 'live' | 'completed' | null;
  day: string | null;
};

const EMPTY_FILTER: FilterState = { year: null, month: null, status: null, day: null };

const HistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { appData, loading } = useApp();

  const safeSessions = appData?.sessions ?? [];

  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    safeSessions.forEach((s) => uniqueYears.add(new Date(s.checkInTime).getFullYear()));
    uniqueYears.add(new Date().getFullYear());
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [safeSessions]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER);
  const [sheetVisible, setSheetVisible] = useState(false);

  const sessions = useMemo(() => {
    let list = [...safeSessions];
    if (!list.length) return list;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s: any) => {
        const d = new Date(s.checkInTime);
        const header = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        return header.toLowerCase().includes(q);
      });
    }

    if (filters.year) {
      list = list.filter((s) => new Date(s.checkInTime).getFullYear().toString() === filters.year);
    }
    if (filters.month) {
      list = list.filter((s) => MONTHS[new Date(s.checkInTime).getMonth()] === filters.month);
    }
    if (filters.status) {
      list = list.filter((s) => (filters.status === 'live' ? s.checkOutTime === null : s.checkOutTime !== null));
    }
    if (filters.day) {
      list = list.filter((s) => new Date(s.checkInTime).getDate().toString() === filters.day);
    }

    return list.sort((a, b) => b.checkInTime - a.checkInTime);
  }, [safeSessions, searchQuery, filters]);

  const renderSession = (session: Session) => {
    const checkIn = new Date(session.checkInTime);
    const checkOut = session.checkOutTime ? new Date(session.checkOutTime) : null;
    const durationMs = checkOut ? checkOut.getTime() - checkIn.getTime() : Date.now() - checkIn.getTime();
    const durationSec = Math.max(Math.floor(durationMs / 1000), 0);
    const isLive = session.checkOutTime === null;

    const dateHeader = checkIn.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const recordId = `Session Record #${session.sessionId.slice(-3).toUpperCase()} — ${checkIn.getFullYear()}`;
    const checkInTime = formatTimeReversed(checkIn);
    const checkOutTime = checkOut ? formatTimeReversed(checkOut) : '—';

    return (
      <TouchableOpacity
        key={session.sessionId}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SessionDetails', { session })}
        style={styles.sessionCard}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <Text style={styles.sessionDate}>{dateHeader}</Text>
            <Text style={styles.sessionRecord}>{recordId}</Text>
          </View>
          <View style={[styles.chevronCircle, isLive && styles.chevronCircleLive]}>
            <ChevronIcon size={20} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Check In</Text>
            <Text style={styles.statValue}>{checkInTime}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Check Out</Text>
            <Text style={[styles.statValue, !checkOut && styles.statValueMuted]}>{checkOutTime}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, isLive ? styles.statusLive : styles.statusCompleted]}>
              {isLive ? 'Active Session' : 'Completed'}
            </Text>
          </View>
        </View>

        <View style={styles.durationRow}>
          <View style={styles.durationLeft}>
            <Text style={styles.durationTitle}>{isLive ? 'Accumulated Duration' : 'Duration'}</Text>
            <Text style={[styles.durationValue, isLive && styles.durationValueLive]}>{formatTime(durationSec)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill}>
              <View style={[styles.progressBar, isLive ? styles.progressBarLive : styles.progressBarCompleted]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your session records</Text>
        </View>

        <View style={styles.stickyBar}>
          <View style={styles.searchBox}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by details..."
              placeholderTextColor={colorsMap.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setSheetVisible(true)} style={styles.filterButton}>
            <FilterIcon />
          </TouchableOpacity>
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Showing {sessions.length} of {safeSessions.length} sessions</Text>
          <Text style={styles.timelineLabel}>Timeline Feed</Text>
        </View>

        <View style={styles.list}>{sessions.map((s) => renderSession(s))}</View>

        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No sessions found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Set Filter Constraints</Text>
              <TouchableOpacity onPress={() => setFilters(EMPTY_FILTER)}>
                <Text style={styles.resetLabel}>Reset All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.sheetFieldLabel}>Select Timeline Year</Text>
              <View style={styles.pillsRow}>
                {years.map((y) => {
                  const active = filters.year === y.toString();
                  return (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setFilters((prev) => ({ ...prev, year: active ? null : y.toString() }))}
                      style={[styles.pill, active && styles.pillActivePurple]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActivePurple]}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetFieldLabel}>Select Month Parameters</Text>
              <View style={styles.pillsRow}>
                {MONTHS.map((m) => {
                  const active = filters.month === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setFilters((prev) => ({ ...prev, month: active ? null : m }))}
                      style={[styles.pill, active && styles.pillActivePurple]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActivePurple]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetFieldLabel}>Target Specific Day</Text>
              <View style={styles.dayBox}>
                <TextInput
                  style={styles.dayInput}
                  placeholder="e.g. 26"
                  placeholderTextColor={colorsMap.textFaint}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={filters.day || ''}
                  onChangeText={(text) => setFilters((prev) => ({ ...prev, day: text || null }))}
                />
              </View>

              <Text style={styles.sheetFieldLabel}>State Filtering</Text>
              <View style={styles.statusGrid}>
                <TouchableOpacity
                  onPress={() => setFilters((prev) => ({ ...prev, status: prev.status === 'live' ? null : 'live' }))}
                  style={[styles.pill, filters.status === 'live' && styles.pillActiveRed]}
                >
                  <View style={[styles.statusDot, filters.status === 'live' && styles.statusDotActive]} />
                  <Text style={[styles.pillText, filters.status === 'live' && styles.pillTextActiveRed]}>Active Sessions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFilters((prev) => ({ ...prev, status: prev.status === 'completed' ? null : 'completed' }))}
                  style={[styles.pill, filters.status === 'completed' && styles.pillActiveGreen]}
                >
                  <View style={[styles.statusDot, filters.status === 'completed' && styles.statusDotActiveGreen]} />
                  <Text style={[styles.pillText, filters.status === 'completed' && styles.pillTextActiveGreen]}>Completed Tasks</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setSheetVisible(false)} activeOpacity={0.9}>
              <Text style={styles.applyLabel}>Apply Timeline Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colorsMap.bgMain },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colorsMap.textMuted, fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingTop: 24 },
  header: { marginBottom: 20, paddingHorizontal: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colorsMap.white, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: colorsMap.textMuted, fontWeight: '600', marginTop: 2 },
  stickyBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorsMap.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colorsMap.borderMain,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: colorsMap.accentPurple, fontSize: 14, fontWeight: '700' },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colorsMap.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorsMap.borderMain,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 14 },
  counterLabel: { fontSize: 10, fontWeight: '700', color: colorsMap.textFaint, letterSpacing: 0.8, textTransform: 'uppercase' },
  timelineLabel: { fontSize: 12, fontWeight: '500', color: colorsMap.textMuted },
  list: { gap: 14, paddingBottom: 40 },
  sessionCard: {
    backgroundColor: colorsMap.surfaceCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colorsMap.borderMain,
    gap: 14,
  },
  sessionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sessionHeaderLeft: { flex: 1, gap: 2 },
  sessionDate: { fontSize: 14, fontWeight: '700', color: colorsMap.white },
  sessionRecord: { fontSize: 10, fontFamily: 'monospace', color: colorsMap.textMuted, letterSpacing: 0.5 },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colorsMap.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorsMap.borderSubtle,
  },
  chevronCircleLive: { borderColor: 'rgba(251,70,76,0.35)' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.015)',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statLabel: { fontSize: 9, fontWeight: '700', color: colorsMap.textFaint, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' },
  statValue: { fontSize: 12, fontWeight: '700', color: colorsMap.white, textAlign: 'center', fontFamily: 'monospace' },
  statValueMuted: { color: colorsMap.textMuted, fontStyle: 'italic', fontWeight: '500' },
  statusLive: { color: colorsMap.statusRed },
  statusCompleted: { color: colorsMap.statusGreen },
  durationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  durationLeft: { flex: 1 },
  durationTitle: { fontSize: 10, fontWeight: '700', color: colorsMap.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  durationValue: { fontSize: 12, fontWeight: '700', color: colorsMap.white, fontFamily: 'monospace' },
  durationValueLive: { color: colorsMap.statusRed },
  progressTrack: { width: 120, height: 6, backgroundColor: colorsMap.surfaceAlt, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  progressFill: { height: '100%', width: '100%' },
  progressBar: { height: '100%', width: '100%', borderRadius: 3 },
  progressBarLive: { backgroundColor: 'rgba(251,70,76,0.9)' },
  progressBarCompleted: { backgroundColor: colorsMap.statusGreen },
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: colorsMap.surfaceCard, borderRadius: 20, borderWidth: 1, borderColor: colorsMap.borderMain },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colorsMap.textMain, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colorsMap.textMuted },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  sheetCard: {
    backgroundColor: colorsMap.bgMain,
    borderTopColor: colorsMap.borderMain,
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: 820,
  },
  dragHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colorsMap.borderMain, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colorsMap.white, letterSpacing: -0.2 },
  resetLabel: { fontSize: 11, fontWeight: '700', color: colorsMap.textFaint },
  sheetBody: { gap: 16 },
  sheetFieldLabel: { fontSize: 10, fontWeight: '700', color: colorsMap.textFaint, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 10 },
  dayBox: { backgroundColor: colorsMap.surfaceAlt, borderRadius: 20, borderWidth: 1, borderColor: colorsMap.borderSubtle, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 120 },
  dayInput: { color: colorsMap.white, fontSize: 14, fontWeight: '700', fontFamily: 'monospace', textAlign: 'center', minWidth: 60 },
  statusGrid: { flexDirection: 'row', gap: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colorsMap.surfaceAlt,
    borderWidth: 1,
    borderColor: colorsMap.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 8,
    flexDirection: 'row',
  },
  pillActivePurple: { backgroundColor: 'rgba(139,108,239,0.10)', borderColor: 'rgba(163,116,249,0.30)' },
  pillActiveRed: { backgroundColor: 'rgba(251,70,76,0.10)', borderColor: 'rgba(251,70,76,0.30)' },
  pillActiveGreen: { backgroundColor: 'rgba(68,207,110,0.10)', borderColor: 'rgba(68,207,110,0.30)' },
  pillText: { fontSize: 11, fontWeight: '700', color: colorsMap.textMuted },
  pillTextActivePurple: { color: colorsMap.accentPurple },
  pillTextActiveRed: { color: colorsMap.statusRed },
  pillTextActiveGreen: { color: colorsMap.statusGreen },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colorsMap.textMuted },
  statusDotActive: { backgroundColor: colorsMap.statusRed },
  statusDotActiveGreen: { backgroundColor: colorsMap.statusGreen },
  applyButton: { marginTop: 20, backgroundColor: colorsMap.accentPurple, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  applyLabel: { fontSize: 14, fontWeight: '900', color: colorsMap.bgMain, letterSpacing: 0.2 },
});

export default HistoryScreen;
