import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Modal, Alert, TextInput, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useConvexSync } from '../context/ConvexContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, borderRadius, fonts, shadows, spacing } from '../theme/colors';
import { getOrCreateDeviceId } from '../utils/deviceId';
import Svg, { Path } from 'react-native-svg';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getFlagEmoji(currencyCode) {
  const code = currencyCode.toLowerCase();
  const currencyToCountry = {
    usd: 'US', eur: 'EU', gbp: 'GB', jpy: 'JP', cad: 'CA',
    aud: 'AU', cny: 'CN', inr: 'IN', chf: 'CH', egp: 'EG',
    kwd: 'KW', sar: 'SA', aed: 'AE', bhd: 'BH', omr: 'OM',
    qar: 'QA', jod: 'JO', lbp: 'LB',     ils: 'PS', try: 'TR',
    rub: 'RU', krw: 'KR', sgd: 'SG', hkd: 'HK',
    nzd: 'NZ', zar: 'ZA', brl: 'BR', mxn: 'MX', ars: 'AR',
    clp: 'CL', cop: 'CO', pen: 'PE', vef: 'VE', uyu: 'UY',
    dkk: 'DK', nok: 'NO', sek: 'SE', pln: 'PL', czk: 'CZ',
    huf: 'HU', ron: 'RO', bgn: 'BG', hrk: 'HR', rsd: 'RS',
    uah: 'UA', kzt: 'KZ', uzs: 'UZ', pkr: 'PK', bdt: 'BD',
    lkr: 'LK', npr: 'NP', mmk: 'MM', khr: 'KH', lak: 'LA',
    vnd: 'VN', idr: 'ID', myr: 'MY', php: 'PH', thb: 'TH',
    twd: 'TW', mop: 'MO', bnd: 'BN', fjd: 'FJ', pab: 'PA',
    crc: 'CR', gtq: 'GT', hnl: 'HN', svc: 'SV', nio: 'NI',
    dop: 'DO', jmd: 'JM', ttd: 'TT', bbd: 'BB', bzd: 'BZ',
    gyd: 'GY', srd: 'SR', etb: 'ET', kes: 'KE', tzs: 'TZ',
    ugx: 'UG', rwf: 'RW', mwk: 'MW', zmw: 'ZM', zwl: 'ZW',
    ngp: 'NG', ghc: 'GH', cdf: 'CD', xof: 'SN', xaf: 'CM',
    mad: 'MA', dzd: 'DZ', tnd: 'TN', ly: 'LY', sdg: 'SD',
    ss: 'SS', er: 'ER', dj: 'DJ', so: 'SO', km: 'KM',
    mg: 'MG', mu: 'MU', sc: 'SC', mvr: 'MV', bwp: 'BW',
    nad: 'NA', aos: 'AO', mzn: 'MZ', szl: 'SZ', lsl: 'LS',
  };
  const countryCode = currencyToCountry[code] || code.substring(0, 2).toUpperCase();
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

function getCurrencySymbol(currencyCode) {
  try {
    return (0)
      .toLocaleString('en-US', {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
      })
      .replace(/\d/g, '')
      .trim();
  } catch {
    return '';
  }
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'ILS', name: 'Palestinian Shekel' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'TWD', name: 'Taiwan Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'TND', name: 'Tunisian Dinar' },
];

const currencyArray = CURRENCIES.map((c) => ({
  code: c.code,
  name: c.name,
  flag: getFlagEmoji(c.code),
  symbol: getCurrencySymbol(c.code),
}));

const BackIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HourRateScreen = () => {
  const navigation = useNavigation<any>();
  const { appData, setHourRate } = useApp();
  const { queueMutation } = useConvexSync();
  const { t } = useLanguage();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const sessions = appData.sessions ?? [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    sessions.forEach((s: any) => uniqueYears.add(new Date(s.checkInTime).getFullYear()));
    uniqueYears.add(currentYear);
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [sessions, currentYear]);

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [hourRate, setHourRateInput] = useState<string>(appData.hourRate > 0 ? appData.hourRate.toString() : '');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currencyArray[0]);
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  const monthSessions = useMemo(() => {
    return sessions.filter((s: any) => {
      const date = new Date(s.checkInTime);
      return date.getFullYear().toString() === selectedYear && date.getMonth() === selectedMonth && s.checkOutTime !== null;
    }).sort((a: any, b: any) => new Date(b.checkInTime).getDate() - new Date(a.checkInTime).getDate());
  }, [sessions, selectedYear, selectedMonth]);

  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { date: string; totalSeconds: number; sessions: any[] }>();
    monthSessions.forEach((s: any) => {
      const d = new Date(s.checkInTime);
      const key = d.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, { date: key, totalSeconds: 0, sessions: [] });
      const entry = map.get(key)!;
      entry.sessions.push(s);
      entry.totalSeconds += Math.floor((s.checkOutTime - s.checkInTime) / 1000);
    });
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthSessions]);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currencyArray;
    return currencyArray.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (deviceId && appData.hourRate > 0) {
      queueMutation('app_settings', deviceId, 'upsert', {
        user_id: deviceId,
        hour_rate: appData.hourRate,
        currency: selectedCurrency.code,
        updated_at: Date.now(),
      }).catch(() => {});
    }
  }, [selectedCurrency.code, deviceId, appData.hourRate, queueMutation]);

  const handleSearchChange = useCallback((text: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(text), 80);
  }, []);

  const handleClearSearch = useCallback(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchQuery('');
  }, []);

  const monthTotalSeconds = dailyBreakdown.reduce((sum, d) => sum + d.totalSeconds, 0);
  const monthTotalHours = monthTotalSeconds / 3600;
  const rate = parseFloat(hourRate) || 0;
  const earnings = monthTotalHours * rate;

  const handleSaveRate = useCallback(async () => {
    const parsed = parseFloat(hourRate);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert(t('common.error'), t('hourRate.invalidRate'));
      return;
    }
    await setHourRate(parsed);
    if (deviceId) {
      await queueMutation('app_settings', deviceId, 'upsert', {
        user_id: deviceId,
        hour_rate: parsed,
        currency: selectedCurrency.code,
        updated_at: Date.now(),
      });
    }
    setIsEditingRate(false);
    Alert.alert(t('common.success'), t('hourRate.saved'));
  }, [hourRate, setHourRate, queueMutation, deviceId, selectedCurrency.code, t]);

  const handleSelectCurrency = useCallback((item) => {
    setSelectedCurrency(item);
    setShowCurrencySheet(false);
    setSearchQuery('');
  }, []);

  const formatCurrency = useCallback((value: number) => {
    return `${selectedCurrency.symbol || selectedCurrency.code}${value.toFixed(2)}`;
  }, [selectedCurrency]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon size={24} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('hourRate.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('hourRate.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.currencyButton} onPress={() => setShowCurrencySheet(true)}>
            <Text style={styles.currencyFlag}>{selectedCurrency.flag}</Text>
            <Text style={styles.currencyCodeLabel}>{selectedCurrency.code}</Text>
            <ChevronDownIcon size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.glassPanel}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('hourRate.selectPeriod')}</Text>
            <View style={styles.pillsRow}>
              {MONTHS.map((m, idx) => {
                const active = selectedMonth === idx;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMonth(idx)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('hourRate.year')}</Text>
            <View style={styles.pillsRow}>
              {years.map((y) => {
                const active = selectedYear === y.toString();
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelectedYear(y.toString())}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('hourRate.setRate')}</Text>
            {isEditingRate ? (
              <View style={styles.rateRow}>
                <TextInput
                  style={styles.rateInput}
                  value={hourRate}
                  onChangeText={setHourRateInput}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveRate}>
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.rateDisplay} onPress={() => setIsEditingRate(true)}>
                <Text style={styles.rateValue}>{formatCurrency(rate)}</Text>
                <Text style={styles.rateHint}>{t('hourRate.tapToEdit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('hourRate.totalHours')}</Text>
              <Text style={styles.statValue}>{monthTotalHours.toFixed(2)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('hourRate.earnings')}</Text>
              <Text style={styles.statValue}>{formatCurrency(earnings)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('hourRate.sessions')}</Text>
              <Text style={styles.statValue}>{monthSessions.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('hourRate.daysWorked')}</Text>
              <Text style={styles.statValue}>{dailyBreakdown.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>{t('hourRate.dailyBreakdown')}</Text>
          <Text style={styles.sectionHeaderSubtitle}>{MONTHS[selectedMonth]} {selectedYear}</Text>
        </View>

        <View style={styles.glassPanel}>
          {dailyBreakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('hourRate.noData')}</Text>
              <Text style={styles.emptySub}>{t('hourRate.noCompletedSessions')}</Text>
            </View>
          ) : (
            dailyBreakdown.map((day) => {
              const dayEarnings = (day.totalSeconds / 3600) * rate;
              return (
                <View key={day.date} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.dayEarnings}>{formatCurrency(dayEarnings)}</Text>
                  </View>
                  <View style={styles.dayStatsRow}>
                    <Text style={styles.dayStatLabel}>{t('hourRate.totalHours')}</Text>
                    <Text style={styles.dayStatValue}>{(day.totalSeconds / 3600).toFixed(2)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showCurrencySheet} transparent animationType="slide" onRequestClose={() => setShowCurrencySheet(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowCurrencySheet(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Select Currency</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search currency code or name..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="characters"
                returnKeyType="search"
                clearButtonMode="never"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={10}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyRow,
                    selectedCurrency.code === item.code && styles.currencyRowActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectCurrency(item)}
                >
                  <Text style={styles.flagIcon}>{item.flag}</Text>
                  <View style={styles.textContainer}>
                    <Text style={styles.currencyCode}>{item.code}</Text>
                    <Text style={styles.currencyName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.symbolBadge}>
                    <Text style={styles.symbolText}>{item.symbol || item.code}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No currencies found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1, backgroundColor: colors.bgMain },
  scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 100 },
  headerSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
  },
  currencyFlag: { fontSize: 18 },
  currencyCodeLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  glassPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  pillActive: { backgroundColor: 'rgba(139,108,239,0.15)', borderColor: 'rgba(163,116,249,0.4)' },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  pillTextActive: { color: colors.textAccent },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 8 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateInput: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: { backgroundColor: colors.textAccent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  saveButtonText: { color: colors.bgMain, fontSize: 13, fontWeight: '800' },
  rateDisplay: { alignItems: 'center', paddingVertical: 10 },
  rateValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  rateHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { flex: 1, minWidth: '45%', alignItems: 'center', backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, paddingVertical: 14 },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' },
  statValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 10, marginTop: 8 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeaderSubtitle: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  dayCard: { backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, padding: 14, marginBottom: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dayDate: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  dayEarnings: { fontSize: 13, fontWeight: '800', color: colors.textAccent },
  dayStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayStatLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayStatValue: { fontSize: 12, fontWeight: '700', color: colors.textPrimary, fontFamily: 'monospace' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetCard: {
    backgroundColor: colors.bgMain,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  dragHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 14 },
  searchContainer: { position: 'relative', marginBottom: 16 },
  searchBar: {
    height: 48,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    paddingHorizontal: 44,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  currencyRowActive: {
    backgroundColor: 'rgba(139,108,239,0.12)',
    borderColor: 'rgba(163,116,249,0.35)',
  },
  flagIcon: { fontSize: 28, marginRight: 16 },
  textContainer: { flex: 1, paddingRight: 10 },
  currencyCode: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  currencyName: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  symbolBadge: {
    backgroundColor: 'rgba(139,108,239,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163,116,249,0.25)',
  },
  symbolText: { fontSize: 14, fontWeight: '800', color: colors.textAccent },
});

export default HourRateScreen;
