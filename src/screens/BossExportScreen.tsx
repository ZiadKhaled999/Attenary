import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Platform, Linking, Animated, Easing, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useSupabase } from '../context/SupabaseContext';
import { colors, borderRadius, fonts, shadows } from '../theme/colors';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Print from 'expo-print';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const { height: SCREEN_H } = Dimensions.get('window');

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

const SaveIcon = ({ size = 22, color = colors.primary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 10l5 5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15V3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WhatsAppIcon = ({ size = 22, color = '#25D366' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </Svg>
);

const TelegramIcon = ({ size = 22, color = '#26A5B4' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 2L11 13" />
    <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
);

const GmailIcon = ({ size = 22, color = '#EA4335' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="4" width="20" height="16" rx="2.5" />
    <Path d="M2 8l10 6 10-6" />
    <Path d="M2 8h20" />
  </Svg>
);

const MoreIcon = ({ size = 22, color = colors.textSecondary }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="12" r="2" fill={color} />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Circle cx="18" cy="12" r="2" fill={color} />
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
  const { profile } = useSupabase();
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [generating, setGenerating] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [generatedPdfPath, setGeneratedPdfPath] = useState<string | null>(null);
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
    const employeeName = appData.employeeName || profile?.full_name || 'Employee';
    const email = profile?.email || appData.email || '';
    const exportDate = new Date().toLocaleString();

    const filtered = getFilteredSessions(appData.sessions, selectedYear, selectedMonth);
    const rate = appData.hourRate || 0;
    const earnings = monthStats.totalHours * rate;
    const filteredSorted = filtered.sort((a: any, b: any) => b.checkInTime - a.checkInTime);
    const rows = filteredSorted
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
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1a1a; padding: 32px; background: #0f172a; }
  .page { background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); max-width: 900px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.5; }
  .sub { color: #64748b; font-size: 13px; margin-bottom: 18px; }
  h2 { font-size: 16px; color: #ffffff; margin-bottom: 12px; margin-top: 24px; font-weight: 700; letter-spacing: 0.2; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 12px 16px; border-radius: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; color: #475569; padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6; border-bottom: 2px solid #e2e8f0; }
  td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr:hover td { background: #eef2ff; }
  .right { text-align: right; font-variant-numeric: tabular-nums; }
  .profile-table td:first-child { font-weight: 700; color: #475569; width: 38%; background: #f8fafc; }
  .summary-table tr.total td { font-weight: 800; font-size: 15px; background: linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%); color: #4338ca; }
  .summary-table tr.total td:last-child { color: #7c3aed; font-size: 18px; }
  .foot { margin-top: 22px; font-size: 11px; color: #94a3b8; text-align: center; }
  .no-data { text-align: center; color: #94a3b8; padding: 18px; font-style: italic; }
</style></head>
<body>
  <div class="page">
    <h1>Attenary Hours · ${selectedMonth} ${selectedYear}</h1>
    <div class="sub">Generated: ${exportDate} · Employee: ${escHtml(employeeName)}</div>

    <h2>Employee Profile</h2>
    <table class="profile-table">
      <tr><td>Name</td><td>${escHtml(employeeName)}</td></tr>
      <tr><td>Email</td><td>${escHtml(email) || '—'}</td></tr>
    </table>

    <h2>Period Summary</h2>
    <table class="summary-table">
      <tr class="total"><td>Estimated Earnings</td><td class="right">${earnings.toFixed(2)}</td></tr>
      <tr><td>Total Hours</td><td class="right">${monthStats.totalHours.toFixed(2)}</td></tr>
      <tr><td>Total Sessions</td><td class="right">${monthStats.sessionsCount}</td></tr>
      <tr><td>Days Worked</td><td class="right">${monthStats.daysCount}</td></tr>
    </table>

    <h2>Session Details</h2>
    <table>
      <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th class="right">Hours</th><th class="right">Earnings</th><th>Reason</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="no-data">No checked-out sessions in this period.</td></tr>'}</tbody>
    </table>

    <div class="foot">Generated on ${exportDate} · Total ${monthStats.totalHours.toFixed(2)} hrs · Earnings ${earnings.toFixed(2)} · Attenary v3.23.7</div>
  </div>
</body></html>`;
  };

  const generatePdfFile = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return generatePdfWeb();
    }
    const html = buildPdfHtml();
    const { printToFileAsync } = await import('expo-print');
    const { uri } = await printToFileAsync({ html, base64: false });
    setGeneratedPdfPath(uri);
    return uri;
  };

  const generatePdfWeb = async (): Promise<string | null> => {
    const html = buildPdfHtml();
    const container = document.createElement('div');
    container.innerHTML = html;
    Object.assign(container.style, {
      position: 'fixed', left: '-9999px', top: '0', background: '#fff', padding: '24px', maxWidth: '800px',
    });
    document.body.appendChild(container);

    try {
      const [{ default: html2canvasLib }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvasLib(container, { scale: 2, useCORS: true, backgroundColor: '#fff' } as any);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      const pdfFile = pdf.output('blob');
      const url = URL.createObjectURL(pdfFile);
      setGeneratedPdfPath(url);
      return url;
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      const uri = await generatePdfFile();
      if (uri) {
        setGeneratedPdfPath(uri);
        openSheet();
      } else {
        Alert.alert(t('common.error'), t('bossExport.generateFailedPdf'));
      }
    } catch (error) {
      console.log('PDF generation error:', error);
      Alert.alert(t('common.error'), t('bossExport.generateFailedPdf'));
    } finally {
      setGenerating(false);
    }
  };

  const handleShareOption = async (option: 'save' | 'whatsapp' | 'telegram' | 'gmail' | 'native') => {
    if (!generatedPdfPath) {
      Alert.alert(t('common.error'), t('bossExport.generateFailedPdf'));
      return;
    }

    try {
      const fileName = `Attenary-BossExport-${selectedMonth}-${selectedYear}.pdf`;

      if (Platform.OS === 'web') {
        if (option === 'save' || option === 'native') {
          const link = document.createElement('a');
          link.href = generatedPdfPath;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(generatedPdfPath);
          if (option === 'save') {
            Alert.alert(t('common.success'), t('bossExport.savedPdf'));
          }
          closeSheet();
          return;
        }

        const text = `Attenary Hours Report - ${selectedMonth} ${selectedYear}`;
        if (navigator.share) {
          try {
            const response = await fetch(generatedPdfPath);
            const blob = await response.blob();
            const file = new File([blob], fileName, { type: 'application/pdf' });
            await (navigator as any).share({ title: 'Attenary Hours Report', text, files: [file] });
            closeSheet();
            return;
          } catch {
            const link = document.createElement('a');
            link.href = generatedPdfPath;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(generatedPdfPath);
            closeSheet();
            return;
          }
        }

        const link = document.createElement('a');
        link.href = generatedPdfPath;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(generatedPdfPath);
        closeSheet();
        return;
      }

      const fs = FileSystem as any;
      const destPath = fs.documentDirectory + fileName;

      if (option === 'save') {
        await fs.copyAsync({ from: generatedPdfPath, to: destPath });
        Alert.alert(t('common.success'), t('bossExport.savedPdf'));
        closeSheet();
        return;
      }

      await fs.copyAsync({ from: generatedPdfPath, to: destPath });
      closeSheet();

      if (option === 'native') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(destPath, { mimeType: 'application/pdf', dialogTitle: 'Share Boss Export' });
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
        await Sharing.shareAsync(shareUrl, { mimeType: 'application/pdf', dialogTitle: 'Share Boss Export' });
      }
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert(t('common.error'), t('bossExport.shareFailed'));
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
          <TouchableOpacity style={[styles.exportButton, styles.pdfButton, generating && styles.pdfButtonGenerating]} onPress={handleGeneratePdf} activeOpacity={0.8} disabled={generating}>
            {generating ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
            <Text style={styles.exportButtonText}>{!generating ? 'Generate PDF' : ''}</Text>
          </TouchableOpacity>
        </View>

        {showShareSheet && (
          <Animated.View style={[styles.sheetOverlay, { opacity: sheetOpacity }]}>
            <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => closeSheet()} />
            <Animated.View style={[styles.sheetCardAnimated, { transform: [{ translateY: sheetTranslateY }] }]}>
              <Text style={styles.sheetTitle}>{t('bossExport.shareTitle')}</Text>
              <Text style={styles.sheetSubtitle}>{t('bossExport.shareSubtitlePdf')}</Text>
              <View style={styles.shareRow}>
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('save')}>
                  <View style={[styles.shareIconBox, { backgroundColor: 'rgba(139,108,239,0.18)' }]}>
                    <SaveIcon size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.saveLocal')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('whatsapp')}>
                  <View style={[styles.shareIconBox, { backgroundColor: 'rgba(37,211,102,0.15)' }]}>
                    <WhatsAppIcon size={22} color="#25D366" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.whatsapp')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('telegram')}>
                  <View style={[styles.shareIconBox, { backgroundColor: 'rgba(38,165,180,0.15)' }]}>
                    <TelegramIcon size={22} color="#26A5B4" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.telegram')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('gmail')}>
                  <View style={[styles.shareIconBox, { backgroundColor: 'rgba(234,67,53,0.14)' }]}>
                    <GmailIcon size={22} color="#EA4335" />
                  </View>
                  <Text style={styles.shareLabel}>{t('bossExport.gmail')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('native')}>
                  <View style={[styles.shareIconBox, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                    <MoreIcon size={22} color={colors.textSecondary} />
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
  exportButtonText: { color: '#fff', fontSize: fonts.sizes.md, fontWeight: fonts.weights.bold as any, letterSpacing: 0.1 },
  pdfButtonGenerating: { backgroundColor: '#991b1b', borderColor: '#7f1d1d' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bgMain, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 50 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheetCardAnimated: { backgroundColor: colors.bgMain, borderTopColor: colors.border, borderTopWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 4 },
  sheetSubtitle: { fontSize: 12, color: colors.textMuted, marginBottom: 18 },
  shareRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, columnGap: 10, justifyContent: 'space-between', paddingHorizontal: 16 },
  shareOption: { flexBasis: '18%', alignItems: 'center', gap: 8, paddingVertical: 10, minWidth: 60 },
  shareIconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  shareLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
});

export default BossExportScreen;
