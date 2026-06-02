import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme/colors';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Session } from '../types';
import XLSX from 'xlsx';

const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ExportIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ImportIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={colors.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoreScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { appData, addSessions } = useApp();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const navItems = [
    {
      id: 'feedbacks',
      title: t('more.feedbacks'),
      subtitle: t('more.feedbacksSubtitle'),
      icon: '💬',
      screen: 'Feedbacks',
    },
    {
      id: 'languages',
      title: t('more.languages'),
      subtitle: t('more.languagesSubtitle'),
      icon: '🌍',
      screen: 'Languages',
    },
    {
      id: 'about',
      title: t('more.about'),
      subtitle: t('more.aboutSubtitle'),
      icon: 'ℹ️',
      screen: 'About',
    },
    {
      id: 'privacy',
      title: t('more.privacy'),
      subtitle: t('more.privacySubtitle'),
      icon: '🔒',
      screen: 'PrivacyPolicy',
    },
    {
      id: 'coffee',
      title: t('more.coffee'),
      subtitle: t('more.coffeeSubtitle'),
      icon: '☕',
      screen: 'BuyMeCoffee',
    },
  ];

  const handlePress = (item: any) => {
    if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  const prepareExportData = () => {
    const sessions = appData.sessions.map((session: Session) => ({
      sessionId: session.sessionId,
      checkInTime: new Date(session.checkInTime).toISOString(),
      checkOutTime: session.checkOutTime ? new Date(session.checkOutTime).toISOString() : '',
      duration: session.checkOutTime 
        ? ((session.checkOutTime - session.checkInTime) / 3600000).toFixed(2) + ' hours'
        : 'Active',
      reason: session.reason || '',
    }));

    const profileData = {
      fullName: appData.employeeName,
      email: appData.email,
      jobTitle: appData.jobTitle,
      department: appData.department,
      onboardingCompleted: appData.onboardingCompleted,
    };

    const settingsData = {
      theme: appData.appSettings?.theme || 'dark',
      notifications: appData.appSettings?.notifications !== false,
    };

    return { sessions, profile: profileData, settings: settingsData };
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const exportData = prepareExportData();
      
      const wb = XLSX.utils.book_new();
      
      const sessionsWs = XLSX.utils.json_to_sheet(exportData.sessions);
      XLSX.utils.book_append_sheet(wb, sessionsWs, 'Sessions');
      
      const profileWs = XLSX.utils.json_to_sheet([exportData.profile]);
      XLSX.utils.book_append_sheet(wb, profileWs, 'Profile');
      
      const settingsWs = XLSX.utils.json_to_sheet([exportData.settings]);
      XLSX.utils.book_append_sheet(wb, settingsWs, 'Settings');

      if (Platform.OS === 'web') {
        const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `attenary-export-${Date.now()}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = `attenary-export-${Date.now()}.xlsx`;
        const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
        const filePath = cacheDir + fileName;
        await (FileSystem as any).writeAsStringAsync(filePath, wbout, {
          encoding: (FileSystem as any).EncodingType.Base64,
        });
        
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Attenary Data',
        });
      }
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (importing) return;
    setImporting(true);

    try {
      const result = await (DocumentPicker as any).getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
      });

      if ((result as any).canceled || (result as any).type === 'cancel') {
        setImporting(false);
        return;
      }

      const uri = (result as any).uri || (result as any).assets?.[0]?.uri;
      if (!uri) {
        setImporting(false);
        return;
      }

      const fileContent = await (FileSystem as any).readAsStringAsync(uri, {
        encoding: (FileSystem as any).EncodingType.Base64,
      });

      const wb = XLSX.read(fileContent, { type: 'base64' });

      let importedSessions: Session[] = [];

      const sessionsSheet = wb.Sheets['Sessions'];
      if (sessionsSheet) {
        const rawSessions = XLSX.utils.sheet_to_json(sessionsSheet);
        importedSessions = rawSessions.map((row: any) => {
          const checkInTime = new Date(row.checkInTime || row.check_in_time || row.CheckInTime || Date.now()).getTime();
          const checkOutTimeStr = row.checkOutTime || row.check_out_time || row.CheckOutTime;
          const checkOutTime = checkOutTimeStr ? new Date(checkOutTimeStr).getTime() : null;
          
          return {
            sessionId: row.sessionId || row.id || `imported-${Date.now()}-${Math.random()}`,
            checkInTime,
            checkOutTime,
            reason: row.reason || null,
          };
        });
      }

      if (importedSessions.length > 0) {
        const success = await addSessions(importedSessions);
        if (success) {
          Alert.alert('Success', `Imported ${importedSessions.length} sessions!`);
        }
      } else {
        Alert.alert('Info', 'No sessions found in the imported file.');
      }
    } catch (error) {
      console.log('Import error:', error);
      Alert.alert('Error', 'Failed to import data. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgMain} />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={handleExport}
              activeOpacity={0.8}
              disabled={exporting || importing}
            >
              <View style={styles.actionButtonContent}>
                {exporting ? (
                  <ActivityIndicator color={colors.bgMain} size="small" />
                ) : (
                  <ExportIcon size={24} />
                )}
                <Text style={styles.actionButtonText}>{exporting ? 'Exporting...' : 'Export All Data'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.importButton]}
              onPress={handleImport}
              activeOpacity={0.8}
              disabled={exporting || importing}
            >
              <View style={styles.actionButtonContent}>
                {importing ? (
                  <ActivityIndicator color={colors.bgMain} size="small" />
                ) : (
                  <ImportIcon size={24} />
                )}
                <Text style={styles.actionButtonText}>{importing ? 'Importing...' : 'Import Data'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.settings')}</Text>
          <View style={styles.cardContainer}>
            {navItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  index === 0 && styles.navItemFirst,
                  index === navItems.length - 1 && styles.navItemLast,
                ]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.navItemIcon}>
                  <Text style={styles.navItemIconText}>{item.icon}</Text>
                </View>
                <View style={styles.navItemContent}>
                  <Text style={styles.navItemTitle}>{item.title}</Text>
                  <Text style={styles.navItemSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRightIcon size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Attenary</Text>
          <Text style={styles.footerSubtext}>Time Tracking Made Simple</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.huge },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fonts.sizes.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginLeft: spacing.xs },
  actionsContainer: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1, borderRadius: borderRadius.card, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  exportButton: { backgroundColor: colors.primary },
  importButton: { backgroundColor: colors.secondary },
  actionButtonContent: { alignItems: 'center' },
  actionButtonText: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.bgMain, marginTop: spacing.sm },
  cardContainer: { backgroundColor: colors.bgCard, borderRadius: borderRadius.card, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  navItemFirst: { borderTopLeftRadius: borderRadius.card, borderTopRightRadius: borderRadius.card },
  navItemLast: { borderBottomWidth: 0, borderBottomLeftRadius: borderRadius.card, borderBottomRightRadius: borderRadius.card },
  navItemIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.bgGlassLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  navItemIconText: { fontSize: 24 },
  navItemContent: { flex: 1 },
  navItemTitle: { fontSize: fonts.sizes.lg, fontWeight: '500', color: colors.textPrimary, marginBottom: 2 },
  navItemSubtitle: { fontSize: fonts.sizes.sm, color: colors.textMuted },
  footer: { alignItems: 'center', paddingVertical: spacing.xxl },
  footerText: { fontSize: fonts.sizes.md, fontWeight: '500', color: colors.textMuted, marginBottom: spacing.xs },
  footerSubtext: { fontSize: fonts.sizes.sm, color: colors.textMuted },
});

export default MoreScreen;