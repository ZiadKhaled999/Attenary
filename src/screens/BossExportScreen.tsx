import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Platform, Linking, Animated, Easing, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, borderRadius, fonts, shadows } from '../theme/colors';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import Svg, { Path } from 'react-native-svg';
import * as Print from 'expo-print';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const { height: SCREEN_H } = Dimensions.get('window');

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buf(array: any): ArrayBuffer {
  const l = array.length;
  const buf = new ArrayBuffer(l);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== l; ++i) view[i] = array.charCodeAt(i) & 0xff;
  return buf;
}

function getFilteredSessions(sessions: any[], selectedYear: string, selectedMonth: string) {
  return sessions
    .filter((s: any) => {
      const d = new Date(s.checkInTime);
      return d.getFullYear().toString() === selectedYear && MONTHS[d.getMonth()] === selectedMonth && s.checkOutTime !== null;
    })
    .sort((a: any, b: any) => b.checkInTime - a.checkInTime);
}

const BackIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FileIcon = ({ size = 20, color = colors.textSecondary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShareIcon = ({ size = 20, color = colors.textSecondary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BossExportScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { appData } = useApp();
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [generating, setGenerating] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [generatedFilePath, setGeneratedFilePath] = useState<string | null>(null);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [generatedExcelPath, setGeneratedExcelPath] = useState<string | null>(null);
  const [selectedExport, setSelectedExport] = useState<'pdf' | 'excel'>('pdf');
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_H)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setShowShareSheet(true);
    sheetTranslateY.setValue(SCREEN_H);
    sheetOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(sheetTranslateY, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  };
  const closeSheet = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, { toValue: SCREEN_H, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setShowShareSheet(false);
      cb?.();
    });
  };

  const years = useMemo(() => {
    const uniqueYears = new Set<number>();
    appData.sessions.forEach((s: any) => uniqueYears.add(new Date(s.checkInTime).getFullYear()));
    uniqueYears.add(new Date().getFullYear());
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [appData.sessions]);

  const monthStats = useMemo(() => {
    const filtered = appData.sessions;
    const stats = {
      totalSeconds: 0,
      totalHours: 0,
      sessionsCount: 0,
      daysCount: 0,
    };

    filtered.forEach((s: any) => {
      const date = new Date(s.checkInTime);
      if (date.getFullYear().toString() === selectedYear && MONTHS[date.getMonth()] === selectedMonth && s.checkOutTime !== null) {
        stats.sessionsCount++;
        stats.totalSeconds += Math.floor((s.checkOutTime - s.checkInTime) / 1000);
      }
    });

    stats.totalHours = stats.totalSeconds / 3600;
    stats.daysCount = new Set(
      filtered
        .filter((s: any) => {
          const date = new Date(s.checkInTime);
          return date.getFullYear().toString() === selectedYear && MONTHS[date.getMonth()] === selectedMonth && s.checkOutTime !== null;
        })
        .map((s: any) => new Date(s.checkInTime).getDate())
    ).size;

    return stats;
  }, [appData.sessions, selectedYear, selectedMonth]);

  const buildPdfHtml = () => {
    const employeeName = appData.employeeName || 'Employee';
    const jobTitle = appData.jobTitle || '';
    const department = appData.department || '';
    const email = appData.email || '';
    const onboarding = appData.onboardingCompleted ? 'Completed' : 'Incomplete';
    const theme = (appData.appSettings?.theme || 'dark').charAt(0).toUpperCase() + (appData.appSettings?.theme || 'dark').slice(1);
    const notifications = appData.appSettings?.notifications ? 'Enabled' : 'Disabled';
    const rate = appData.hourRate || 0;
    const earnings = monthStats.totalHours * rate;
    const exportDate = new Date().toLocaleString();

    const filtered = getFilteredSessions(appData.sessions, selectedYear, selectedMonth);
    const rows = filtered
      .sort((a: any, b: any) => b.checkInTime - a.checkInTime)
      .map((s: any) => {
        const d = new Date(s.checkInTime);
        const checkIn = new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const checkOut = new Date(s.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const ms = s.checkOutTime - s.checkInTime;
        const hrs = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        const hours = ms / 3600000;
        const sessionEarnings = hours * rate;
        return `<tr>
          <td>${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${hrs}h ${mins}m</td>
          <td>${hours.toFixed(2)}</td>
          <td>${sessionEarnings.toFixed(2)}</td>
          <td>${escHtml(s.reason && s.reason.trim() !== '' ? s.reason : '—')}</td>
          <td>${escHtml(s.sessionId)}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #000; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; font-family: Arial, sans-serif; }
  .sub { color: #444; font-size: 12px; margin-bottom: 14px; font-family: Arial, sans-serif; }
  h2 { font-size: 16px; color: #111; margin-bottom: 8px; margin-top: 18px; font-family: Arial, sans-serif; border-bottom: 2px solid #1e1e1e; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif; }
  th { background: #1e1e1e; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; letter-spacing: 0.4; font-family: Arial, sans-serif; }
  td { padding: 8px 10px; border-bottom: 1px solid #e5e5e5; color: #111; font-family: Arial, sans-serif; }
  tr:nth-child(even) td { background: #fafafa; }
  .right { text-align: right; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .profile-table td:first-child { font-weight: 700; color: #333; width: 35%; }
  .summary-table tr.total td { font-weight: 700; font-size: 13px; background: #f3f4f6; }
  .foot { margin-top: 18px; font-size: 10px; color: #777; text-align: center; font-family: Arial, sans-serif; }
</style></head>
<body>
  <h1>Attenary Hours · ${selectedMonth} ${selectedYear}</h1>
  <div class="sub">Generated: ${exportDate} · Employee: ${escHtml(employeeName)}${jobTitle ? ' · ' + escHtml(jobTitle) : ''}${department ? ' · ' + escHtml(department) : ''}</div>

  <h2>Employee Profile</h2>
  <table class="profile-table">
    <tr><td>Name</td><td>${escHtml(employeeName)}</td></tr>
    <tr><td>Email</td><td>${escHtml(email) || '—'}</td></tr>
    <tr><td>Job Title</td><td>${escHtml(jobTitle) || '—'}</td></tr>
    <tr><td>Department</td><td>${escHtml(department) || '—'}</td></tr>
    <tr><td>Hour Rate</td><td>${rate.toFixed(2)}/hr</td></tr>
    <tr><td>Onboarding</td><td>${onboarding}</td></tr>
  </table>

  <h2>App Settings</h2>
  <table class="profile-table">
    <tr><td>Theme</td><td>${theme}</td></tr>
    <tr><td>Notifications</td><td>${notifications}</td></tr>
  </table>

  <h2>Period Summary</h2>
  <table class="summary-table">
    <tr class="total"><td>Total Hours</td><td class="right">${monthStats.totalHours.toFixed(2)}</td></tr>
    <tr><td>Total Sessions</td><td class="right">${monthStats.sessionsCount}</td></tr>
    <tr><td>Days Worked</td><td class="right">${monthStats.daysCount}</td></tr>
    <tr class="total"><td>Estimated Earnings</td><td class="right">${earnings.toFixed(2)}</td></tr>
  </table>

  <h2>Session Details</h2>
  <table>
    <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th class="right">Hours</th><th class="right">Earnings</th><th>Reason</th><th>Session ID</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:#888;">No checked-out sessions in this period.</td></tr>'}</tbody>
  </table>

  <div class="foot">Generated on ${exportDate} · Total ${monthStats.totalHours.toFixed(2)} hrs · Earnings ${earnings.toFixed(2)} · Attenary v3.23.7</div>
</body></html>`;
  };

  const generatePdfFile = async (): Promise<string | null> => {
    const html = buildPdfHtml();
    const { printToFileAsync } = await import('expo-print');
    const { uri } = await printToFileAsync({ html, base64: false });
    setGeneratedFilePath(uri);
    return uri;
  };

  const generateExcelFile = async (): Promise<string | null> => {
    const filtered = getFilteredSessions(appData.sessions, selectedYear, selectedMonth);
    const rate = appData.hourRate || 0;
    const employeeName = appData.employeeName || 'Employee';
    const email = appData.email || '';
    const jobTitle = appData.jobTitle || '';
    const department = appData.department || '';
    const onboarding = appData.onboardingCompleted ? 'Completed' : 'Incomplete';
    const theme = (appData.appSettings?.theme || 'dark').charAt(0).toUpperCase() + (appData.appSettings?.theme || 'dark').slice(1);
    const notifications = appData.appSettings?.notifications ? 'Enabled' : 'Disabled';
    const exportDate = new Date().toLocaleString();
    const daysWorked = new Set(filtered.map((s: any) => new Date(s.checkInTime).toDateString())).size;

    const profileSheet = XLSX.utils.aoa_to_sheet([
      ['EMPLOYEE PROFILE'],
      ['Employee Name', employeeName],
      ['Email', email || '—'],
      ['Job Title', jobTitle || '—'],
      ['Department', department || '—'],
      ['Hour Rate ($/hr)', rate],
      ['Onboarding', onboarding],
      [],
      ['EXPORT INFORMATION'],
      ['Generated On', exportDate],
      ['Period', `${selectedMonth} ${selectedYear}`],
      ['App Version', '3.23.7'],
      [],
      ['APP SETTINGS'],
      ['Theme', theme],
      ['Notifications', notifications],
    ]);
    profileSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
      { s: { r: 12, c: 0 }, e: { r: 12, c: 1 } },
    ];
    profileSheet['!cols'] = [{ wch: 22 }, { wch: 22 }];

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['PERIOD SUMMARY'],
      [],
      ['Metric', 'Value'],
      ['Total Hours', "=SUM('Session Details'!E2:E1000)"],
      ['Total Sessions', "=COUNTA('Session Details'!H2:H1000)"],
      ['Days Worked', daysWorked],
      ['Hour Rate ($/hr)', rate],
      ['Estimated Earnings', "=B4*B7"],
      [],
      ['Generated On', exportDate],
    ]);
    summarySheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    ];
    summarySheet['!cols'] = [{ wch: 22 }, { wch: 18 }];
    if (summarySheet['B4']) summarySheet['B4'].z = '#,##0.00';
    if (summarySheet['B5']) summarySheet['B5'].z = '0';
    if (summarySheet['B6']) summarySheet['B6'].z = '0';
    if (summarySheet['B7']) summarySheet['B7'].z = '#,##0.00';
    if (summarySheet['B8']) summarySheet['B8'].z = '#,##0.00';
    if (summarySheet['B10']) summarySheet['B10'].z = '@';

    const sessionColumns = ['Date', 'Check In', 'Check Out', 'Duration', 'Total Hours', 'Earnings', 'Reason', 'Session ID'];
    const sessionRows = filtered.map((s: any) => {
      const d = new Date(s.checkInTime);
      const ms = s.checkOutTime - s.checkInTime;
      const hours = ms / 3600000;
      const checkIn = new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const checkOut = new Date(s.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const durationH = Math.floor(ms / 3600000);
      const durationM = Math.floor((ms % 3600000) / 60000);
      return [
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        checkIn,
        checkOut,
        `${durationH}h ${durationM}m`,
        parseFloat(hours.toFixed(2)),
        '',
        s.reason && s.reason.trim() !== '' ? s.reason : '—',
        s.sessionId,
      ];
    });

    const sessionSheet = XLSX.utils.aoa_to_sheet([sessionColumns, ...sessionRows]);
    sessionSheet['!cols'] = [
      { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 28 },
    ];
    sessionSheet['!rows'] = [
      { hpt: 20 },
      ...sessionRows.map(() => ({ hpt: 16 })),
    ];

    for (let i = 0; i < sessionRows.length; i++) {
      const rowNum = i + 2;
      sessionSheet[`F${rowNum}`] = `=E${rowNum}*Summary!$B$7`;
      sessionSheet[`F${rowNum}`].z = '#,##0.00';
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Session Details');
    XLSX.utils.book_append_sheet(workbook, profileSheet, 'Profile');

    const wbout = XLSX.write(workbook, { type: 'binary', bookType: 'xlsx' });
    const fileName = `Attenary-BossExport-${selectedMonth}-${selectedYear}.xlsx`;
    const fs = FileSystem as any;
    const destPath = fs.documentDirectory + fileName;
    await fs.writeAsStringAsync(destPath, buf(wbout), { encoding: fs.EncodingType.Base64 });
    setGeneratedExcelPath(destPath);
    return destPath;
  };

  const handleGeneratePdf = async () => {
    setSelectedExport('pdf');
    openSheet();
  };

  const handleGenerateExcel = async () => {
    setSelectedExport('excel');
    openSheet();
  };

  const handleGenerateWithOption = async (option: 'save' | 'whatsapp' | 'telegram' | 'gmail' | 'native') => {
    try {
      if (selectedExport === 'pdf' && !generatedFilePath) {
        setGenerating(true);
        const uri = await generatePdfFile();
        if (uri) setGeneratedFilePath(uri);
        setGenerating(false);
      } else if (selectedExport === 'excel' && !generatedExcelPath) {
        setGeneratingExcel(true);
        const path = await generateExcelFile();
        if (path) setGeneratedExcelPath(path);
        setGeneratingExcel(false);
      }

      const filePath = selectedExport === 'pdf' ? generatedFilePath : generatedExcelPath;
      const fileName = `Attenary-BossExport-${selectedMonth}-${selectedYear}.${selectedExport === 'pdf' ? 'pdf' : 'xlsx'}`;
      if (!filePath) {
        Alert.alert(t('common.error'), selectedExport === 'pdf' ? t('bossExport.generateFailedPdf') : t('bossExport.generateFailedExcel'));
        return;
      }

      if (option === 'save') {
        Alert.alert(t('common.success'), selectedExport === 'pdf' ? t('bossExport.savedPdf') : t('bossExport.savedExcel'));
        closeSheet();
        return;
      }

      closeSheet();
      const fs = FileSystem as any;
      const destPath = fs.documentDirectory + fileName;
      await fs.copyAsync({ from: filePath, to: destPath });

      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([await fs.readAsStringAsync(filePath, { encoding: fs.EncodingType.Base64 })]));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (option === 'native') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          const mimeType = selectedExport === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          await Sharing.shareAsync(destPath, { mimeType, dialogTitle: 'Share Boss Export' });
        } else {
          Alert.alert(t('bossExport.sharingNotAvailable'), t('bossExport.sharingNotAvailableDevice'));
        }
        return;
      }

      const shareUrl = `file://${destPath}`;
      const message = `Attenary Hours Report - ${selectedMonth} ${selectedYear}`;
      let appScheme = '';

      switch (option) {
        case 'whatsapp':
          appScheme = 'whatsapp://send?text=' + encodeURIComponent(message);
          break;
        case 'telegram':
          appScheme = 'tg://msg?text=' + encodeURIComponent(message);
          break;
        case 'gmail':
          appScheme = 'googlegmail://co?subject=' + encodeURIComponent(t('bossExport.reportSubject', { month: selectedMonth, year: selectedYear })) + '&body=' + encodeURIComponent(message);
          break;
        default:
          break;
      }

      const canOpen = await Linking.canOpenURL(appScheme).catch(() => false);
      if (canOpen) {
        await Linking.openURL(appScheme);
      } else {
        const mimeType = selectedExport === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        await Sharing.shareAsync(shareUrl, { mimeType, dialogTitle: 'Share Boss Export' });
      }
    } catch (error) {
      console.log('Option error:', error);
      Alert.alert(t('common.error'), selectedExport === 'pdf' ? t('bossExport.generateFailedPdf') : t('bossExport.generateFailedExcel'));
      setGenerating(false);
      setGeneratingExcel(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon size={24} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('bossExport.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('bossExport.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileIcon size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('bossExport.selectPeriod')}</Text>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('hourRate.year')}</Text>
            <View style={styles.pillsRow}>
              {years.map((y) => {
                const active = selectedYear === y.toString();
                return (
                  <TouchableOpacity key={y} onPress={() => setSelectedYear(y.toString())} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{y}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('hourRate.month')}</Text>
            <View style={styles.pillsRow}>
              {MONTHS.map((m) => {
                const active = selectedMonth === m;
                return (
                  <TouchableOpacity key={m} onPress={() => setSelectedMonth(m)} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('hourRate.totalHours')}</Text>
              <Text style={styles.summaryValue}>{monthStats.totalHours.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('hourRate.sessions')}</Text>
              <Text style={styles.summaryValue}>{monthStats.sessionsCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t('hourRate.daysWorked')}</Text>
              <Text style={styles.summaryValue}>{monthStats.daysCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.exportButton, styles.pdfButton]} onPress={handleGeneratePdf} activeOpacity={0.8} disabled={generating || generatingExcel}>
            <Text style={styles.exportButtonText}>{generating ? t('bossExport.generating') : 'Generate PDF'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportButton, styles.excelButton]} onPress={handleGenerateExcel} activeOpacity={0.8} disabled={generating || generatingExcel}>
            <Text style={styles.exportButtonText}>{generatingExcel ? t('bossExport.generating') : 'Generate Excel'}</Text>
          </TouchableOpacity>
        </View>

        {showShareSheet && (
          <Animated.View style={[styles.sheetOverlay, { opacity: sheetOpacity }]}>
            <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => closeSheet()} />
            <Animated.View style={[styles.sheetCardAnimated, { transform: [{ translateY: sheetTranslateY }] }]}>
              <View style={styles.dragHandle} />
              <Text style={styles.sheetTitle}>{t('bossExport.shareTitle')}</Text>
              <Text style={styles.sheetSubtitle}>
                {selectedExport === 'pdf' ? t('bossExport.shareSubtitlePdf') : t('bossExport.shareSubtitleExcel')}
              </Text>

              <View style={styles.shareOptions}>
                <TouchableOpacity style={styles.shareOption} onPress={() => handleGenerateWithOption('save')}>
                  <View style={[styles.shareIconBox, { backgroundColor: '#e2e8f0' }]}>
                    <FileIcon size={20} color="#0f172a" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.saveLocal')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleGenerateWithOption('whatsapp')}>
                  <View style={[styles.shareIconBox, { backgroundColor: '#dcfce7' }]}>
                    <ShareIcon size={20} color="#166534" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.whatsapp')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleGenerateWithOption('telegram')}>
                  <View style={[styles.shareIconBox, { backgroundColor: '#e0e7ff' }]}>
                    <ShareIcon size={20} color="#3730a3" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.telegram')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleGenerateWithOption('gmail')}>
                  <View style={[styles.shareIconBox, { backgroundColor: '#fee2e2' }]}>
                    <ShareIcon size={20} color="#991b1b" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.gmail')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleGenerateWithOption('native')}>
                  <View style={[styles.shareIconBox, { backgroundColor: '#f1f5f9' }]}>
                    <ShareIcon size={20} color="#0f172a" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.moreOptions')}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  scrollView: { flex: 1 },
  contentContainer: { padding: 16, paddingTop: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  headerText: { flex: 1 },
  headerTitle: { fontSize: fonts.sizes.xl, fontWeight: fonts.weights.bold as any, color: colors.textPrimary, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted, fontWeight: fonts.weights.medium as any, marginTop: 2 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 16, ...shadows.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: fonts.sizes.md, fontWeight: fonts.weights.semibold as any, color: colors.textPrimary },
  filterSection: { marginBottom: 14 },
  filterLabel: { fontSize: fonts.sizes.xs, fontWeight: fonts.weights.bold as any, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 10 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  pillActive: { backgroundColor: 'rgba(139,108,239,0.10)', borderColor: 'rgba(163,116,249,0.30)' },
  pillText: { fontSize: fonts.sizes.sm, fontWeight: fonts.weights.semibold as any, color: colors.textMuted },
  pillTextActive: { color: colors.primary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: fonts.sizes.xs, fontWeight: fonts.weights.bold as any, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  summaryValue: { fontSize: fonts.sizes.xxl, fontWeight: fonts.weights.bold as any, color: colors.textPrimary, fontFamily: 'monospace' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8 },
  exportButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12, borderWidth: 1, ...shadows.card },
  pdfButton: { backgroundColor: '#dc2626', borderColor: '#b91c1c' },
  excelButton: { backgroundColor: '#16a34a', borderColor: '#15803d' },
  iconBadge: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  iconEmoji: { fontSize: 20, color: '#fff' },
  exportButtonText: { color: '#fff', fontSize: fonts.sizes.md, fontWeight: fonts.weights.bold as any, letterSpacing: 0.1 },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetCardAnimated: { backgroundColor: colors.bgMain, borderTopColor: colors.border, borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  dragHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 4 },
  sheetSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 18 },
  shareOptions: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, columnGap: 8, justifyContent: 'center' },
  shareOption: { width: '33.333%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  shareIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  shareLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
});

export default BossExportScreen;
